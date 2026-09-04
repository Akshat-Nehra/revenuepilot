const express = require("express");
const razorpay = require("../config/razorpay");
const { createPaymentLink } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/create-link", createPaymentLink);

/**
 * Temporary Debug Endpoint: GET /api/payments/test-link
 * Creates a ₹10 test Payment Link directly through Razorpay to verify SDK connectivity
 */
router.get("/test-link", async (req, res) => {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 1000,
      currency: "INR",
      description: "RevenuePilot Razorpay Connection Test",
      reference_id: `RP-TEST-${Date.now()}`,
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
    });

    console.log("[RAZORPAY TEST LINK] Successfully created:", {
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      status: paymentLink.status,
    });

    return res.json({
      success: true,
      paymentLink: {
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        status: paymentLink.status,
      },
    });
  } catch (error) {
    console.error("[RAZORPAY TEST LINK ERROR]:", {
      message: error?.message,
      statusCode: error?.statusCode,
      code: error?.error?.code,
      description: error?.error?.description,
    });

    return res.status(500).json({
      success: false,
      message: "Razorpay Payment Link creation failed",
      error: error?.error?.description || error.message,
    });
  }
});

module.exports = router;