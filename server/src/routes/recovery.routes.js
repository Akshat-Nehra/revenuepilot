const express = require("express");

const {
  evaluateTransaction,
} = require(
  "../controllers/recovery.controller"
);

const router = express.Router();

router.get(
  "/evaluate/:transactionId",
  evaluateTransaction
);

module.exports = router;