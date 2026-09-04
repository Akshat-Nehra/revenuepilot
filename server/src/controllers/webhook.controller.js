const crypto = require("crypto");
const RecoveryAttempt = require("../models/RecoveryAttempt");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");

const safeEqual = (received, expected) => {
  if (!received || !expected || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ success: false, message: "Webhook secret is not configured" });
    }

    if (!signature || !req.rawBody) {
      return res.status(400).json({ success: false, message: "Webhook signature or raw body missing" });
    }

    const expected = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
    if (!safeEqual(signature, expected)) {
      console.error("[WEBHOOK] Invalid signature");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = req.body?.event;
    console.log("[WEBHOOK] Verified event:", event);

    if (event === "payment.captured" || event === "payment_link.paid") {
      const payment = req.body?.payload?.payment?.entity || null;
      const paymentLink = req.body?.payload?.payment_link?.entity || null;

      // payment.captured normally carries payment.entity; payment_link.paid carries payment_link.entity.
      const notes = payment?.notes || paymentLink?.notes || {};
      const paymentLinkId = paymentLink?.id || payment?.payment_link_id || payment?.payment_link?.id || null;
      const transactionId = notes.transactionId || notes.transaction_id || null;
      const recoveryAttemptId = notes.recoveryAttemptId || notes.recovery_attempt_id || null;
      const amountPaise = Number(payment?.amount ?? paymentLink?.amount ?? 0);
      const amount = amountPaise / 100;

      let attempt = null;
      if (recoveryAttemptId) attempt = await RecoveryAttempt.findById(recoveryAttemptId);
      if (!attempt && paymentLinkId) {
        attempt = await RecoveryAttempt.findOne({
          $or: [
            { razorpayPaymentLinkId: paymentLinkId },
            { paymentLinkId: paymentLinkId },
          ],
        });
      }
      if (!attempt && transactionId) {
        attempt = await RecoveryAttempt.findOne({
          transactionId,
          status: { $in: ["created", "payment_pending"] },
        }).sort({ createdAt: -1 });
      }

      if (!attempt) {
        console.warn("[WEBHOOK] Payment received but matching recovery attempt was not found", {
          event, transactionId, recoveryAttemptId, paymentLinkId, paymentId: payment?.id || null,
        });
        // Acknowledge the webhook so Razorpay does not repeatedly retry an event we cannot correlate.
        return res.json({ success: true, message: "Webhook received; recovery attempt not found" });
      }

      if (attempt.status === "recovered") {
        return res.json({ success: true, message: "Recovery already processed", transactionId: attempt.transactionId });
      }

      if (amount <= 0) {
        console.error("[WEBHOOK] Invalid payment amount", { amountPaise });
        return res.status(400).json({ success: false, message: "Invalid payment amount" });
      }

      attempt.status = "recovered";
      attempt.recoveredAmount = amount;
      attempt.recoveredAt = new Date();
      if (paymentLinkId) {
        attempt.razorpayPaymentLinkId = paymentLinkId;
        attempt.paymentLinkId = paymentLinkId;
      }
      await attempt.save();

      const txn = await Transaction.findOne({ transactionId: attempt.transactionId });
      if (txn) {
        txn.recoveryStatus = "recovered";
        txn.status = "successful";
        await txn.save();
      }

      await AuditLog.create({
        transactionId: attempt.transactionId,
        event: "PAYMENT_CAPTURED",
        actor: "Razorpay Webhook",
        actorRole: "WEBHOOK",
        decision: "CAPTURED",
        status: "SUCCESS",
        details: `Payment of ₹${amount} captured via Razorpay.`,
        metadata: { event, paymentId: payment?.id || null, paymentLinkId, amount },
      }).catch((e) => console.error("Audit log error:", e));

      await AuditLog.create({
        transactionId: attempt.transactionId,
        event: "REVENUE_RECOVERED",
        actor: "RevenuePilot Engine",
        actorRole: "SYSTEM",
        decision: "RECOVERED",
        status: "SUCCESS",
        details: `Revenue recovered: ₹${amount}.`,
        metadata: { amount, paymentId: payment?.id || null, paymentLinkId },
      }).catch((e) => console.error("Audit log error:", e));

      console.log(`[WEBHOOK] RECOVERED ₹${amount} for ${attempt.transactionId}`);
      return res.json({ success: true, message: "Recovery marked as successful", transactionId: attempt.transactionId, recoveredAmount: amount });
    }

    if (event === "payment.failed") {
      const payment = req.body?.payload?.payment?.entity;
      const transactionId = payment?.notes?.transactionId;
      const attempt = transactionId
        ? await RecoveryAttempt.findOne({ transactionId, status: "payment_pending" }).sort({ createdAt: -1 })
        : null;

      if (attempt) {
        attempt.status = "failed";
        attempt.failureReason = payment?.error_description || payment?.error?.description || "Payment failed";
        await attempt.save();
      }

      return res.json({ success: true, message: "Payment failure processed" });
    }

    return res.json({ success: true, message: "Webhook received", event });
  } catch (error) {
    console.error("[WEBHOOK] Processing error:", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed", error: error.message });
  }
};

module.exports = { handleRazorpayWebhook };
