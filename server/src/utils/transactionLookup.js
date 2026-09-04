const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

/**
 * Reusable helper to find transaction by business transactionId (e.g. TXN_00486) or MongoDB _id
 * @param {string} identifier 
 * @returns {Promise<Document|null>}
 */
async function findTransactionByIdentifier(identifier) {
  if (!identifier || typeof identifier !== "string" || identifier.trim() === "" || identifier === "undefined" || identifier === "null" || identifier === "[object Object]") {
    return null;
  }

  const cleanId = identifier.trim();

  // 1. Search by canonical business transactionId
  let txn = await Transaction.findOne({ transactionId: cleanId });
  if (txn) return txn;

  // 2. If valid Mongo ObjectId, also search by _id
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    txn = await Transaction.findById(cleanId);
    if (txn) return txn;
  }

  return null;
}

module.exports = {
  findTransactionByIdentifier,
};
