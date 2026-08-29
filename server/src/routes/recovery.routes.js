const express = require("express");

const {
  evaluateTransaction,
  generateAIRecovery,
  executeAIRecovery,
} = require(
  "../controllers/recovery.controller"
);

const router = express.Router();

router.get(
  "/evaluate/:transactionId",
  evaluateTransaction
);

router.get(
  "/ai/:transactionId",
  generateAIRecovery
);

router.post(
  "/execute/:transactionId",
  executeAIRecovery
);

module.exports = router;