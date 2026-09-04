const Transaction = require("../models/Transaction");

const {
  calculateRisk,
} = require("../services/riskEngine");

const {
  evaluateRecoveryEligibility,
} = require("../services/recoveryEngine");

const {
  generateRecoveryRecommendation,
} = require("../services/aiRecoveryAgent");

const {
  executeRecovery,
} = require(
  "../services/recoveryExecution"
);

// ==========================================
// Evaluate Recovery Eligibility
// ==========================================

const evaluateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction =
      await Transaction.findOne({
        transactionId,
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const risk =
      calculateRisk(transaction);

    const eligibility =
      evaluateRecoveryEligibility(
        transaction,
        risk
      );

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
    console.error(
      "Recovery evaluation error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to evaluate recovery",
    });
  }
};


// ==========================================
// AI Recovery Recommendation
// ==========================================

const generateAIRecovery = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find transaction
    const transaction =
      await Transaction.findOne({
        transactionId,
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Calculate deterministic risk
    const risk =
      calculateRisk(transaction);

    // Evaluate deterministic eligibility
    const eligibility =
      evaluateRecoveryEligibility(
        transaction,
        risk
      );

    // ======================================
    // IMPORTANT:
    // AI cannot bypass the policy engine
    // ======================================

    if (
      eligibility.decision !== "ELIGIBLE"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "AI recovery is not allowed for this transaction",

        eligibility,
      });
    }

    // ======================================
    // Ask AI for recommendation
    // ======================================

    const recommendation =
      await generateRecoveryRecommendation({
        transaction:
          transaction.toObject(),

        risk,

        eligibility,
      });

    // ======================================
    // Validate AI output
    // ======================================

    const allowedActions = [
      "CREATE_PAYMENT_LINK",
      "SEND_REMINDER",
      "NO_ACTION",
    ];

    if (
      !allowedActions.includes(
        recommendation.action
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "AI returned an unsupported action",

        recommendation,
      });
    }

    // ======================================
    // Return result
    // ======================================

    return res.json({
      success: true,

      transactionId,

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

      aiRecommendation:
        recommendation,
    });

  } catch (error) {
    console.error(
      "AI recovery error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate AI recovery recommendation",

      error: error.message,
    });
  }
};

const executeAIRecovery = async (
  req,
  res
) => {
  try {

    const { transactionId } =
      req.params;

    const transaction =
      await Transaction.findOne({
        transactionId,
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found",
      });
    }

    const risk =
      calculateRisk(transaction);

    const eligibility =
      evaluateRecoveryEligibility(
        transaction,
        risk
      );

    // ==================================
    // Eligibility gate
    // ==================================

    if (
      eligibility.decision !==
      "ELIGIBLE"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Transaction is not eligible for automated recovery",

        eligibility,
      });
    }

    // ==================================
    // Generate AI recommendation
    // ==================================

    const recommendation =
      await generateRecoveryRecommendation({
        transaction:
          transaction.toObject(),

        risk,

        eligibility,
      });

    // ==================================
    // Execute through policy layer
    // ==================================

    const result =
      await executeRecovery({
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
        transactionId,
        recommendation,
        execution: result,
      });
    }

    return res.json({
      success: true,
      data: {
        recoveryAttemptId: result.recoveryAttemptId,
        transactionId,
        attemptNumber: result.attemptNumber || 1,
        status: result.status || "payment_pending",
        paymentLinkId: result.paymentLinkId,
        paymentLink: result.short_url || result.paymentLinkUrl,
        paymentLinkUrl: result.short_url || result.paymentLinkUrl,
        short_url: result.short_url || result.paymentLinkUrl,
        razorpayUrl: result.short_url || result.paymentLinkUrl,
      },
      recoveryAttemptId: result.recoveryAttemptId,
      attemptNumber: result.attemptNumber || 1,
      paymentLinkId: result.paymentLinkId,
      paymentLink: result.short_url || result.paymentLinkUrl,
      paymentLinkUrl: result.short_url || result.paymentLinkUrl,
      short_url: result.short_url || result.paymentLinkUrl,
      razorpayUrl: result.short_url || result.paymentLinkUrl,
      status: result.status,
      recommendation,
      execution: result,
      message: "Recovery initiated successfully",
    });

  } catch (error) {

    console.error(
      "Recovery execution error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to execute recovery",

      error:
        error.message,
    });
  }
};

// ==========================================
// Get All Recovery Attempts
// ==========================================
const getRecoveryAttempts = async (req, res) => {
  try {
    const RecoveryAttempt = require("../models/RecoveryAttempt");
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

// ==========================================
// Get Single Recovery Attempt By ID
// ==========================================
const getRecoveryAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    const RecoveryAttempt = require("../models/RecoveryAttempt");

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
    const RecoveryAttempt = require("../models/RecoveryAttempt");
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

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  evaluateTransaction,
  generateAIRecovery,
  executeAIRecovery,
  getRecoveryAttempts,
  getRecoveryAttemptById,
  getAIDecisions,
};