const Transaction = require("../models/Transaction");
const {
  calculateRisk,
} = require("../services/riskEngine");

const getTransactions = async (req, res) => {
  try {
    const transactions =
      await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(500);

    const results = transactions.map(
      (transaction) => {
        const risk =
          calculateRisk(transaction);

        return {
          ...transaction.toObject(),

          riskScore: risk.score,

          riskLevel: risk.level,

          riskReasons: risk.reasons,
        };
      }
    );

    res.json({
      success: true,
      count: results.length,
      transactions: results,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch transactions",
    });
  }
};

module.exports = {
  getTransactions,
};