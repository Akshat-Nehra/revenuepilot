const express = require("express");

const {
  getTransactions,
} = require(
  "../controllers/transaction.controller"
);

const router = express.Router();

router.get(
  "/",
  getTransactions
);

module.exports = router;