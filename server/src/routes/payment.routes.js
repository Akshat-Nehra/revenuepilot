const express = require("express");

const {
  createPaymentLink,
} = require("../controllers/payment.controller");

const router = express.Router();

router.post("/create-link", createPaymentLink);

module.exports = router;