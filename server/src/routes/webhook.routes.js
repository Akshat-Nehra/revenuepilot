const express = require("express");

const {
  handleRazorpayWebhook,
} = require("../controllers/webhook.controller");

const router = express.Router();

router.post(
  "/razorpay",
  handleRazorpayWebhook
);

module.exports = router;