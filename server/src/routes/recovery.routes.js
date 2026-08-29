const express = require("express");

const {
  evaluateTransaction,
  generateAIRecovery
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

module.exports = router;