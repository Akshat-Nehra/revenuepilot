const express = require("express");

const {
  evaluateTransaction,
  generateAIRecovery,
  executeAIRecovery,
  getRecoveryAttempts,
  getRecoveryAttemptById,
  getAIDecisions,
  syncRecoveryAttempts,
} = require("../controllers/recovery.controller");

const router = express.Router();

// Synchronize recovery status with Razorpay
router.post("/sync", syncRecoveryAttempts);

// List all recovery attempts
router.get("/", getRecoveryAttempts);

// AI decisions list
router.get("/decisions", getAIDecisions);
router.get("/ai-decisions", getAIDecisions);

// Recovery evaluation & recommendation by transaction ID
router.get("/evaluate/:transactionId", evaluateTransaction);
router.get("/ai/:transactionId", generateAIRecovery);

// Execute recovery action
router.post("/execute/:transactionId", executeAIRecovery);
router.post("/:transactionId", executeAIRecovery);

// Single recovery attempt by ID
router.get("/:id", getRecoveryAttemptById);

module.exports = router;