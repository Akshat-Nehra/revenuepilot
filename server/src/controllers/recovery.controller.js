const Transaction = require("../models/Transaction");

const {
  calculateRisk,
} = require("../services/riskEngine");

const {
  evaluateRecoveryEligibility,
} = require("../services/recoveryEngine");

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

module.exports = {
  evaluateTransaction,
};