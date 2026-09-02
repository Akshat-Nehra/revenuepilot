const crypto = require("crypto");

const RecoveryAttempt = require("../models/RecoveryAttempt");

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    console.log("Webhook secret loaded:", !!secret);
    console.log("Raw body available:", !!req.rawBody);
    console.log("Raw body length:", req.rawBody?.length);
    console.log(
    "Signature received:",
     req.headers["x-razorpay-signature"]
    );

    if (!signature || !secret) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature configuration missing",
      });
    }

    // Debug information - do NOT print the secret
    console.log("Webhook secret loaded:", !!secret);
    console.log("Raw body available:", !!req.rawBody);
    console.log("Raw body length:", req.rawBody?.length);

    if (!req.rawBody) {
      return res.status(400).json({
        success: false,
        message: "Raw webhook body missing",
      });
    }

    // Verify Razorpay webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    // Safe signature comparison
    const isValidSignature =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    if (!isValidSignature) {
      console.log("❌ Invalid Razorpay webhook signature");

      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // Signature verified
    const event = req.body.event;

    console.log("✅ Razorpay webhook received:", event);

    // =====================================================
    // PAYMENT CAPTURED / PAYMENT LINK PAID
    // =====================================================

    if (
      event === "payment.captured" ||
      event === "payment_link.paid"
    ) {
      const payment =
        req.body.payload?.payment?.entity;

      if (!payment) {
        return res.status(400).json({
          success: false,
          message: "Payment data missing",
        });
      }

      const transactionId =
        payment.notes?.transactionId;

      const recoveryAttemptId =
        payment.notes?.recoveryAttemptId;

      console.log("Transaction:", transactionId);
      console.log(
        "Recovery Attempt:",
        recoveryAttemptId
      );

      let recoveryAttempt = null;

      // First try using the exact RecoveryAttempt ID
      if (recoveryAttemptId) {
        recoveryAttempt =
          await RecoveryAttempt.findById(
            recoveryAttemptId
          );
      }

      // Fallback: find by transaction ID
      if (!recoveryAttempt && transactionId) {
        recoveryAttempt =
          await RecoveryAttempt.findOne({
            transactionId,
            status: "payment_pending",
          }).sort({
            createdAt: -1,
          });
      }

      if (!recoveryAttempt) {
        console.log(
          "⚠️ Recovery attempt not found"
        );

        return res.json({
          success: true,
          message:
            "Payment received but recovery attempt not found",
        });
      }

      // =====================================================
      // IDEMPOTENCY PROTECTION
      // =====================================================

      if (recoveryAttempt.status === "recovered") {
        console.log(
          "ℹ️ Recovery already processed"
        );

        return res.json({
          success: true,
          message: "Recovery already processed",
        });
      }

      // =====================================================
      // MARK RECOVERY AS SUCCESSFUL
      // =====================================================

      recoveryAttempt.status = "recovered";

      recoveryAttempt.recoveredAmount =
        payment.amount / 100;

      recoveryAttempt.recoveredAt =
        new Date();

      await recoveryAttempt.save();

      console.log(
        `💰 RECOVERED ₹${payment.amount / 100}`
      );

      return res.json({
        success: true,
        message:
          "Recovery marked as successful",
        transactionId,
        recoveredAmount:
          payment.amount / 100,
      });
    }

    // =====================================================
    // PAYMENT FAILED
    // =====================================================

    if (event === "payment.failed") {
      const payment =
        req.body.payload?.payment?.entity;

      if (payment) {
        const transactionId =
          payment.notes?.transactionId;

        console.log(
          "❌ Payment failed:",
          transactionId
        );

        const recoveryAttempt =
          await RecoveryAttempt.findOne({
            transactionId,
            status: "payment_pending",
          }).sort({
            createdAt: -1,
          });

        if (recoveryAttempt) {
          recoveryAttempt.status = "failed";

          recoveryAttempt.failureReason =
            payment.error_description ||
            "Payment failed";

          await recoveryAttempt.save();

          console.log(
            "Recovery attempt marked as failed"
          );
        }
      }

      return res.json({
        success: true,
        message: "Payment failure processed",
      });
    }

    // =====================================================
    // OTHER EVENTS
    // =====================================================

    console.log(
      "ℹ️ Webhook event not handled:",
      event
    );

    return res.json({
      success: true,
      message: "Webhook received",
    });

  } catch (error) {
    console.error(
      "Webhook processing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

module.exports = {
  handleRazorpayWebhook,
};