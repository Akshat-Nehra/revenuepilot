const Transaction = require("../models/Transaction");
const {
  calculateRisk,
} = require("../services/riskEngine");

const getRevenueMetrics = async (req, res) => {
  try {
    const transactions = await Transaction.find();

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

    transactions.forEach((transaction) => {
      const amount = transaction.amount || 0;

      // Total transaction value
      totalRevenue += amount;

      // Calculate current risk
      const risk = calculateRisk(transaction);

      // Successful transactions
      if (transaction.status === "successful") {
        successfulCount++;
      }

      // Failed payments
      if (transaction.status === "failed") {
        failedCount++;
      }

      // Abandoned checkouts
      if (
        transaction.status === "abandoned" ||
        transaction.checkoutAbandoned
      ) {
        abandonedCount++;
      }

      // Overdue invoices
      if (
        transaction.status === "overdue" ||
        transaction.daysOverdue > 0
      ) {
        overdueCount++;
      }

      // Revenue already recovered
      if (transaction.recoveryStatus === "recovered") {
        recoveredCount++;
        recoveredRevenue += amount;
      }

      // Revenue at risk
      const isAtRisk =
        transaction.status !== "successful" &&
        transaction.recoveryStatus !== "recovered";

      if (isAtRisk) {
        revenueAtRisk += amount;
      }

      // Potentially recoverable revenue
      //
      // We don't consider every risky transaction recoverable.
      // Critical cases will require stronger controls/human review.
      const isPotentiallyRecoverable =
        isAtRisk &&
        risk.score >= 30 &&
        risk.score < 80;

      if (isPotentiallyRecoverable) {
        potentiallyRecoverable += amount;
      }

      if (risk.level === "HIGH") {
        highRiskCount++;
      }

      if (risk.level === "CRITICAL") {
        criticalRiskCount++;
      }
    });

    const recoveryRate =
      revenueAtRisk > 0
        ? (recoveredRevenue / revenueAtRisk) * 100
        : 0;

    res.json({
      success: true,

      metrics: {
        totalTransactions: transactions.length,

        totalRevenue: Math.round(totalRevenue),

        revenueAtRisk: Math.round(revenueAtRisk),

        potentiallyRecoverable: Math.round(
          potentiallyRecoverable
        ),

        recoveredRevenue: Math.round(
          recoveredRevenue
        ),

        recoveryRate: Number(
          recoveryRate.toFixed(2)
        ),

        successfulCount,

        failedCount,

        abandonedCount,

        overdueCount,

        recoveredCount,

        highRiskCount,

        criticalRiskCount,
      },
    });
  } catch (error) {
    console.error(
      "Revenue metrics error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to calculate revenue metrics",
    });
  }
};

module.exports = {
  getRevenueMetrics,
};