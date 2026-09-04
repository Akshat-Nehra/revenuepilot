const express = require("express");
const {
  getTransactions,
  getTransactionById,
} = require("../controllers/transaction.controller");

const router = express.Router();

router.get("/", getTransactions);
router.get("/:id", getTransactionById);

module.exports = router;