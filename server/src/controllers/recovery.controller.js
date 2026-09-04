const RecoveryAttempt = require("../models/RecoveryAttempt");
const { findTransactionByIdentifier } = require("../utils/transactionLookup");
const { calculateRisk } = require("../services/riskEngine");
const { evaluateRecoveryEligibility } = require("../services/recoveryEngine");
const { generateRecoveryRecommendation } = require("../services/aiRecoveryAgent");
const { executeRecovery } = require("../services/recoveryExecution");

// ==========================================
// Evaluate Recovery Eligibility
// ==========================================
const evaluateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await findTransactionByIdentifier(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        receivedIdentifier: transactionId,
      });
    }

    const risk = calculateRisk(transaction);
    const eligibility = evaluateRecoveryEligibility(transaction, risk);

    res.json({
      success: true,
      transaction: {
        id: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
      },
      risk: {
        score: risk.score,
        level: risk.level,
        reasons: risk.reasons,
      },
      recovery: eligibility,
    });
  } catch (error) {
    console.error("Recovery evaluation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to evaluate recovery",
      error: error.message,
    });
  }
};

// ==========================================
// AI Recovery Recommendation
// ==========================================
const generateAIRecovery = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await findTransactionByIdentifier(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        receivedIdentifier: transactionId,
      });
    }

    const risk = calculateRisk(transaction);
    const eligibility = evaluateRecoveryEligibility(transaction, risk);

    if (eligibility.decision !== "ELIGIBLE") {
      return res.status(400).json({
        success: false,
        message: "AI recovery is not allowed for this transaction",
        eligibility,
      });
    }

    const recommendation = await generateRecoveryRecommendation({
      transaction: transaction.toObject(),
      risk,
      eligibility,
    });

    const allowedActions = [
      "CREATE_PAYMENT_LINK",
      "SEND_REMINDER",
      "NO_ACTION",
    ];

    if (!allowedActions.includes(recommendation.action)) {
      return res.status(400).json({
        success: false,
        message: "AI returned an unsupported action",
        recommendation,
      });
    }

    return res.json({
      success: true,
      transactionId: transaction.transactionId,
      transaction: {
        amount: transaction.amount,
        status: transaction.status,
      },
      risk: {
        score: risk.score,
        level: risk.level,
        reasons: risk.reasons,
      },
      eligibility,
      aiRecommendation: recommendation,
    });
  } catch (error) {
    console.error("AI recovery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI recovery recommendation",
      error: error.message,
    });
  }
};

// ==========================================
// Execute Recovery Action (POST /api/recovery/execute/:transactionId)
// ==========================================
const executeAIRecovery = async (req, res) => {
  const { transactionId } = req.params;

  try {
    console.log("[RECOVERY] received identifier:", transactionId);

    const transaction = await findTransactionByIdentifier(transactionId);

    if (!transaction) {
      console.log("[RECOVERY] transaction not found for identifier:", transactionId);
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        receivedIdentifier: transactionId,
      });
    }

    console.log("[RECOVERY] transaction found:", {
      transactionId: transaction?.transactionId,
      mongoId: transaction?._id,
    });

    const canonicalId = transaction.transactionId;
    const risk = calculateRisk(transaction);
    const eligibility = evaluateRecoveryEligibility(transaction, risk);

    // Eligibility gate
    if (eligibility.decision !== "ELIGIBLE") {
      return res.status(400).json({
        success: false,
        message: "Transaction is not eligible for automated recovery",
        eligibility,
      });
    }

    // Generate AI recommendation
    const recommendation = await generateRecoveryRecommendation({
      transaction: transaction.toObject(),
      risk,
      eligibility,
    });

    // Execute through recovery execution service
    const result = await executeRecovery({
      transaction,
      risk,
      eligibility,
      recommendation,
      user: req.user,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Failed to execute recovery action",
        transactionId: canonicalId,
        recommendation,
        execution: result,
      });
    }

    if (result.action === "SEND_REMINDER") {
      return res.json({
        success: true,
        message: result.message || "Recovery reminder dispatched successfully",
        transactionId: canonicalId,
        recoveryAttemptId: result.recoveryAttemptId,
        action: "SEND_REMINDER",
        status: result.status || "reminder_sent",
        strategy: result.strategy || "SEND_REMINDER",
        details: result.details || "Reminder action recorded by RevenuePilot. Connect an SMS/email provider for external delivery.",
        recommendation,
      });
    }

    // Standard PAYMENT_LINK response structure
    return res.json({
      success: true,
      message: result.message || "Recovery executed successfully",
      transactionId: canonicalId,
      recoveryAttemptId: result.recoveryAttemptId,
      action: "PAYMENT_LINK",
      paymentLink: result.paymentLink || {
        id: result.paymentLinkId,
        short_url: result.short_url || result.paymentLinkUrl,
        amount: result.amount,
        currency: "INR",
        status: result.status,
      },
      // Convenience aliases
      paymentLinkId: result.paymentLinkId,
      paymentLinkUrl: result.short_url || result.paymentLinkUrl,
      short_url: result.short_url || result.paymentLinkUrl,
      status: result.status || "payment_pending",
      recommendation,
    });
  } catch (error) {
    console.error("Recovery execution error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to execute recovery",
      error: error.message,
    });
  }
};

// ==========================================
// Sync Pending Payment Links with Razorpay
// ==========================================
const syncPendingAttemptsWithRazorpay = async () => {
  try {
    const razorpay = require("../config/razorpay");
    const Transaction = require("../models/Transaction");
    const AuditLog = require("../models/AuditLog");

    const pendingAttempts = await RecoveryAttempt.find({
      status: "payment_pending",
      $or: [
        { razorpayPaymentLinkId: { $ne: null } },
        { paymentLinkId: { $ne: null } }
      ]
    }).limit(20);

    for (const attempt of pendingAttempts) {
      const linkId = attempt.razorpayPaymentLinkId || attempt.paymentLinkId;
      if (!linkId) continue;

      try {
        const pl = await razorpay.paymentLink.fetch(linkId);
        if (pl && pl.status === "paid") {
          const amount = (pl.amount_paid || pl.amount) / 100;
          attempt.status = "recovered";
          attempt.recoveredAmount = amount;
          attempt.recoveredAt = new Date();
          await attempt.save();

          const txn = await Transaction.findOne({ transactionId: attempt.transactionId });
          if (txn) {
            txn.recoveryStatus = "recovered";
            txn.status = "successful";
            await txn.save();
          }

          await AuditLog.create({
            transactionId: attempt.transactionId,
            event: "PAYMENT_CAPTURED",
            actor: "Razorpay Sync",
            actorRole: "SYSTEM",
            decision: "CAPTURED",
            status: "SUCCESS",
            details: `Payment of ₹${amount} confirmed via Razorpay API sync.`,
            metadata: { paymentLinkId: linkId, amount },
          }).catch((e) => console.error("Audit log error:", e));

          await AuditLog.create({
            transactionId: attempt.transactionId,
            event: "REVENUE_RECOVERED",
            actor: "RevenuePilot Engine",
            actorRole: "SYSTEM",
            decision: "RECOVERED",
            status: "SUCCESS",
            details: `Revenue recovered: ₹${amount} for ${attempt.transactionId}.`,
            metadata: { amount, paymentLinkId: linkId },
          }).catch((e) => console.error("Audit log error:", e));

          console.log(`[SYNC] Recovered ₹${amount} for ${attempt.transactionId} via Razorpay link ${linkId}`);
        } else if (pl && (pl.status === "cancelled" || pl.status === "expired")) {
          attempt.status = "failed";
          attempt.failureReason = `Payment link ${pl.status}`;
          await attempt.save();
        }
      } catch (err) {
        console.warn(`[SYNC] Could not sync link ${linkId}:`, err.message);
      }
    }
  } catch (error) {
    console.error("[SYNC] Error syncing recovery attempts:", error);
  }
};

// ==========================================
// Get All Recovery Attempts (with background sync)
// ==========================================
const getRecoveryAttempts = async (req, res) => {
  try {
    // Perform sync for any pending payment links
    await syncPendingAttemptsWithRazorpay();

    const attempts = await RecoveryAttempt.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      count: attempts.length,
      recoveryAttempts: attempts,
    });
  } catch (error) {
    console.error("Get recovery attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recovery attempts",
    });
  }
};

const syncRecoveryAttempts = async (req, res) => {
  try {
    await syncPendingAttemptsWithRazorpay();
    const attempts = await RecoveryAttempt.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      message: "Synchronized with Razorpay successfully",
      count: attempts.length,
      recoveryAttempts: attempts,
    });
  } catch (error) {
    console.error("Sync recovery attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync recovery attempts",
      error: error.message,
    });
  }
};

// ==========================================
// Get Single Recovery Attempt By ID
// ==========================================
const getRecoveryAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");

    let attempt = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      attempt = await RecoveryAttempt.findById(id);
    }
    if (!attempt) {
      attempt = await RecoveryAttempt.findOne({
        $or: [{ transactionId: id }, { idempotencyKey: id }],
      });
    }

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: `Recovery attempt '${id}' not found`,
      });
    }

    return res.json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get recovery attempt by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recovery attempt details",
    });
  }
};

// ==========================================
// Get AI Decisions Intelligence List
// ==========================================
const getAIDecisions = async (req, res) => {
  try {
    const attempts = await RecoveryAttempt.find()
      .sort({ createdAt: -1 })
      .limit(50);

    const decisions = attempts.map((a) => ({
      id: a._id,
      transactionId: a.transactionId,
      riskLevel: a.riskLevel || "HIGH",
      recommendedAction: a.action,
      strategy: a.strategy,
      confidence: Math.round((a.aiConfidence || 0.87) * 100),
      urgency: a.riskLevel === "CRITICAL" || a.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
      reason: a.aiReason,
      guardrailResult: a.eligibilityDecision === "ELIGIBLE" ? "PASSED" : "FAILED",
      timestamp: a.createdAt,
    }));

    return res.json({
      success: true,
      count: decisions.length,
      decisions,
    });
  } catch (error) {
    console.error("Get AI decisions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI decisions",
    });
  }
};

module.exports = {
  evaluateTransaction,
  generateAIRecovery,
  executeAIRecovery,
  getRecoveryAttempts,
  getRecoveryAttemptById,
  getAIDecisions,
  syncRecoveryAttempts,
  syncPendingAttemptsWithRazorpay,
};