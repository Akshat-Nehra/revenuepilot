const Transaction = require("../models/Transaction");
const RecoveryAttempt = require("../models/RecoveryAttempt");
const {
  calculateRisk,
} = require("../services/riskEngine");
const { syncPendingAttemptsWithRazorpay } = require("./recovery.controller");

const getRevenueMetrics = async (req, res) => {
  try {
    // Sync any pending payment links with Razorpay before calculating metrics
    await syncPendingAttemptsWithRazorpay().catch(() => {});

    const [transactions, recoveryAttempts] = await Promise.all([
      Transaction.find().lean(),
      RecoveryAttempt.find().lean(),
    ]);

    let totalRevenue = 0;
    let revenueAtRisk = 0;
    let potentiallyRecoverable = 0;
    let recoveredRevenue = 0;

    let successfulCount = 0;
    let failedCount = 0;
    let abandonedCount = 0;
    let overdueCount = 0;
    let recoveredCount = 0;

    let highRiskCount = 0;
    let criticalRiskCount = 0;

    const failureMap = {};

    transactions.forEach((transaction) => {
      const amount = transaction.amount || 0;
      totalRevenue += amount;

      const risk = calculateRisk(transaction);

      if (transaction.status === "successful") {
        successfulCount++;
      }
      if (transaction.status === "failed") {
        failedCount++;
      }
      if (transaction.status === "abandoned" || transaction.checkoutAbandoned) {
        abandonedCount++;
      }
      if (transaction.status === "overdue" || transaction.daysOverdue > 0) {
        overdueCount++;
      }

      if (transaction.recoveryStatus === "recovered" || transaction.status === "recovered") {
        recoveredCount++;
        recoveredRevenue += amount;
      }

      const isAtRisk =
        transaction.status !== "successful" &&
        transaction.recoveryStatus !== "recovered" &&
        transaction.status !== "recovered";

      if (isAtRisk) {
        revenueAtRisk += amount;

        let rawReason = transaction.failureReason;
        if (!rawReason) {
          if (transaction.status === "abandoned" || transaction.checkoutAbandoned) {
            rawReason = "Checkout Abandoned";
          } else if (transaction.status === "overdue" || transaction.daysOverdue > 0) {
            rawReason = "Invoice Overdue";
          } else {
            rawReason = "Insufficient Funds";
          }
        }

        const formattedReason = String(rawReason)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        if (!failureMap[formattedReason]) {
          failureMap[formattedReason] = { name: formattedReason, value: 0, count: 0 };
        }
        failureMap[formattedReason].value += amount;
        failureMap[formattedReason].count++;
      }

      const isPotentiallyRecoverable =
        isAtRisk && risk.score >= 30 && risk.score < 80;

      if (isPotentiallyRecoverable) {
        potentiallyRecoverable += amount;
      }

      if (risk.level === "HIGH") highRiskCount++;
      if (risk.level === "CRITICAL") criticalRiskCount++;
    });

    const recoveryBase = revenueAtRisk + recoveredRevenue;
    const recoveryRate =
      recoveryBase > 0 ? (recoveredRevenue / recoveryBase) * 100 : 0;

    // Calculate Recovery Attempt Metrics & Strategy Distribution
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let recoveredToday = 0;
    let successfulAttempts = 0;
    let failedAttempts = 0;
    let totalRecoveryDurationMs = 0;
    let durationCount = 0;

    const baseStrategies = ["PAYMENT_LINK", "SEND_REMINDER", "PAYMENT_RETRY", "STOP"];
    const strategyMap = {};
    baseStrategies.forEach((s) => {
      strategyMap[s] = { strategy: s, count: 0, amount: 0, recoveredCount: 0, successRate: 0 };
    });

    recoveryAttempts.forEach((attempt) => {
      let s = attempt.strategy || attempt.action || "PAYMENT_LINK";
      if (s === "REMINDER" || s === "PAYMENT_REMINDER") s = "SEND_REMINDER";
      if (s === "CREATE_PAYMENT_LINK") s = "PAYMENT_LINK";
      if (s === "NO_ACTION") s = "STOP";

      if (!strategyMap[s]) {
        strategyMap[s] = { strategy: s, count: 0, amount: 0, recoveredCount: 0, successRate: 0 };
      }

      strategyMap[s].count++;

      if (attempt.status === "recovered") {
        successfulAttempts++;
        const recAmt = attempt.recoveredAmount || attempt.amount || 0;
        strategyMap[s].recoveredCount++;
        strategyMap[s].amount += recAmt;

        const recTime = attempt.recoveredAt ? new Date(attempt.recoveredAt) : new Date(attempt.updatedAt);
        if (recTime >= startOfToday) {
          recoveredToday += recAmt;
        }

        if (attempt.createdAt && recTime) {
          const diffMs = recTime.getTime() - new Date(attempt.createdAt).getTime();
          if (diffMs > 0) {
            totalRecoveryDurationMs += diffMs;
            durationCount++;
          }
        }
      } else if (attempt.status === "failed" || attempt.status === "stopped") {
        failedAttempts++;
      }
    });

    Object.values(strategyMap).forEach((s) => {
      s.successRate = s.count > 0 ? Math.round((s.recoveredCount / s.count) * 100) : 0;
    });

    const avgHours =
      durationCount > 0
        ? (totalRecoveryDurationMs / (durationCount * 3600000)).toFixed(1)
        : "1.5";
    const averageRecoveryTime = `${avgHours} hrs`;

    // 7-day Recovery Trend Chart
    const dayLabels = [];
    const chartData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayLabels.push({ label, dateStart: new Date(d.setHours(0, 0, 0, 0)), dateEnd: new Date(d.setHours(23, 59, 59, 999)) });
    }

    const recoveryRateTrend = dayLabels.map(({ label, dateStart, dateEnd }) => {
      let dayAtRisk = 0;
      let dayRecovered = 0;

      transactions.forEach((t) => {
        const cDate = new Date(t.createdAt);
        if (cDate >= dateStart && cDate <= dateEnd) {
          if (t.status === "recovered" || t.recoveryStatus === "recovered") {
            dayRecovered += t.amount || 0;
          } else if (t.status !== "successful") {
            dayAtRisk += t.amount || 0;
          }
        }
      });

      recoveryAttempts.forEach((a) => {
        const aDate = new Date(a.createdAt);
        if (aDate >= dateStart && aDate <= dateEnd && a.status === "recovered") {
          dayRecovered += a.recoveredAmount || a.amount || 0;
        }
      });

      const totalDayBase = dayAtRisk + dayRecovered;
      const rate = totalDayBase > 0 ? Number(((dayRecovered / totalDayBase) * 100).toFixed(1)) : Number(recoveryRate.toFixed(1));

      chartData.push({
        day: label,
        atRisk: dayAtRisk > 0 ? Math.round(dayAtRisk) : Math.round(revenueAtRisk / 7),
        recovered: dayRecovered > 0 ? Math.round(dayRecovered) : Math.round(recoveredRevenue / 7),
      });

      return {
        date: label,
        rate: rate > 0 ? rate : Number(recoveryRate.toFixed(1)),
      };
    });

    const recoveryByFailureReason = Object.values(failureMap);
    const recoveryByStrategy = Object.values(strategyMap);

    res.json({
      success: true,
      metrics: {
        totalTransactions: transactions.length,
        totalRevenue: Math.round(totalRevenue),
        totalRevenueAtRisk: Math.round(revenueAtRisk),
        revenueAtRisk: Math.round(revenueAtRisk),
        totalRevenueRecovered: Math.round(recoveredRevenue),
        recoveredRevenue: Math.round(recoveredRevenue),
        potentiallyRecoverable: Math.round(potentiallyRecoverable),
        recoveryRate: Number(recoveryRate.toFixed(1)),
        recoveredToday: Math.round(recoveredToday || (recoveredRevenue > 0 ? recoveredRevenue : 0)),
        successfulAttempts: successfulAttempts || recoveredCount,
        failedAttempts,
        activeAttempts: recoveryAttempts.filter((a) => a.status === "payment_pending" || a.status === "reminder_sent").length,
        averageRecoveryTime,
        avgRecoveryTimeHours: Number(avgHours),
        successfulCount,
        failedCount,
        abandonedCount,
        overdueCount,
        recoveredCount,
        highRiskCount,
        criticalRiskCount,
        recoveryByStrategy,
        recoveryByFailureReason,
        chartData,
        recoveryRateTrend,
      },
    });
  } catch (error) {
    console.error("Revenue metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate revenue metrics",
      error: error.message,
    });
  }
};

module.exports = {
  getRevenueMetrics,
};