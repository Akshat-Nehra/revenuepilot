const Transaction = require("../models/Transaction");
const { findTransactionByIdentifier } = require("../utils/transactionLookup");
const { calculateRisk } = require("../services/riskEngine");

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(500);

    const results = transactions.map((transaction) => {
      const risk = calculateRisk(transaction);

      return {
        ...transaction.toObject(),
        riskScore: risk.score,
        riskLevel: risk.level,
        riskReasons: risk.reasons,
      };
    });

    res.json({
      success: true,
      count: results.length,
      transactions: results,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await findTransactionByIdentifier(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        receivedIdentifier: id,
      });
    }

    const risk = calculateRisk(transaction);

    return res.json({
      success: true,
      transaction: {
        ...transaction.toObject(),
        riskScore: risk.score,
        riskLevel: risk.level,
        riskReasons: risk.reasons,
      },
    });
  } catch (error) {
    console.error("Get transaction by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction details",
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
};