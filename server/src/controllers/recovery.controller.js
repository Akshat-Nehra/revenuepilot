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
      });

    return res.json({
      success:
        result.success,

      transactionId,

      recommendation,

      execution:
        result,
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
// EXPORTS
// ==========================================

module.exports = {
  evaluateTransaction,
  generateAIRecovery,
  executeAIRecovery,
};