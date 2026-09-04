const razorpay = require("../config/razorpay");

const RecoveryAttempt = require("../models/RecoveryAttempt");
const AuditLog = require("../models/AuditLog");

const {
  validateRecoveryAction,
} = require("./actionValidator");

const {
  checkRecoveryGuard,
} = require("./recoveryGuard");


const executeRecovery = async ({
  transaction,
  risk,
  eligibility,
  recommendation,
  user,
}) => {

  // ======================================
  // 1. Validate AI recommendation
  // ======================================

  const validation =
    validateRecoveryAction({
      transaction,
      risk,
      eligibility,
      recommendation,
    });

  if (!validation.approved) {
    return {
      success: false,
      status: "blocked",
      reason: validation.reason,
    };
  }


  // ======================================
  // 2. Check recovery guard
  // ======================================

  const guard =
    await checkRecoveryGuard(
      transaction.transactionId
    );

  if (!guard.allowed) {
    return {
      success: false,
      status: "stopped",
      reason: guard.reason,
    };
  }


  // ======================================
  // 3. Create recovery attempt
  // ======================================

  const recoveryAttempt =
    await RecoveryAttempt.create({
      transactionId:
        transaction.transactionId,

      customerId:
        transaction.customerId,

      amount:
        transaction.amount,

      attemptNumber:
        guard.attemptNumber,

      idempotencyKey:
        `${transaction.transactionId}-${guard.attemptNumber}`,

      action:
        recommendation.action,

      strategy:
        recommendation.strategy || "PAYMENT_LINK",

      aiReason:
        recommendation.reason || "Autonomous recovery strategy executed",

      aiConfidence:
        recommendation.confidence || 0.87,

      riskScore:
        risk.score,

      riskLevel:
        risk.level,

      eligibilityDecision:
        eligibility.decision || "ELIGIBLE",

      status: "created",

      executedBy: {
        userId: user?._id || null,
        name: user?.name || "RevenuePilot Engine",
        role: user?.role || "SYSTEM",
      },
    });

  // Record audit log for attempt creation
  await AuditLog.create({
    transactionId: transaction.transactionId,
    event: "RECOVERY_ATTEMPT_CREATED",
    actor: user?.name || "RevenuePilot Engine",
    actorUserId: user?._id || null,
    actorRole: user?.role || "SYSTEM",
    decision: recommendation.action,
    status: "SUCCESS",
    details: `Recovery attempt #${guard.attemptNumber} created for ${transaction.transactionId} (${recommendation.strategy || 'PAYMENT_LINK'}).`,
  }).catch((e) => console.error("Audit log error:", e));


  // ======================================
  // 4. CREATE PAYMENT LINK
  // ======================================

  const isPaymentLinkAction =
    recommendation.action === "CREATE_PAYMENT_LINK" ||
    recommendation.action === "PAYMENT_LINK" ||
    recommendation.action === "PAYMENT_RETRY";

  if (isPaymentLinkAction) {
    try {
      // Build customer details
      const customerEmail =
        transaction.customerEmail ||
        `${(transaction.customerName || "customer").toLowerCase().replace(/\s+/g, ".")}@example.com`;

      const paymentLinkPayload = {
        amount: Math.round(transaction.amount * 100), // in paise
        currency: "INR",
        accept_partial: false,
        description: `Revenue recovery for ${transaction.transactionId}`,
        reference_id: `${transaction.transactionId}-att${guard.attemptNumber}-${Date.now().toString().slice(-6)}`,
        customer: {
          name: transaction.customerName || "Valued Customer",
          email: customerEmail,
        },
        notify: {
          sms: false,
          email: false,
        },
        reminder_enable: false,
        notes: {
          source: "RevenuePilot",
          transactionId: transaction.transactionId,
          recoveryAttemptId: recoveryAttempt._id.toString(),
        },
      };

      const paymentLink = await razorpay.paymentLink.create(paymentLinkPayload);

      // Safe debug logging (no secrets)
      console.log("Razorpay Payment Link Created:", {
        id: paymentLink.id,
        status: paymentLink.status,
        short_url: paymentLink.short_url,
        amount: paymentLink.amount,
      });

      // Verify that Razorpay returned a valid payment link
      if (!paymentLink || !paymentLink.short_url) {
        throw new Error("Razorpay did not return a valid payment link");
      }

      // ==================================
      // 5. Update recovery attempt
      // ==================================

      recoveryAttempt.status = "payment_pending";
      recoveryAttempt.razorpayPaymentLinkId = paymentLink.id;
      recoveryAttempt.razorpayPaymentLinkUrl = paymentLink.short_url;
      recoveryAttempt.paymentLinkId = paymentLink.id;
      recoveryAttempt.paymentLinkUrl = paymentLink.short_url;
      recoveryAttempt.short_url = paymentLink.short_url;
      await recoveryAttempt.save();

      // ==================================
      // 6. Update transaction
      // ==================================

      transaction.recoveryStatus = "in_progress";
      transaction.lastRecoveryAttempt = new Date();
      await transaction.save();

      // Record audit log for payment link creation
      await AuditLog.create({
        transactionId: transaction.transactionId,
        event: "PAYMENT_LINK_CREATED",
        actor: user?.name || "RevenuePilot Engine",
        actorUserId: user?._id || null,
        actorRole: user?.role || "SYSTEM",
        decision: "PAYMENT_LINK",
        status: "SUCCESS",
        details: `Razorpay Payment Link generated (${paymentLink.id}): ${paymentLink.short_url}`,
        metadata: { paymentLinkId: paymentLink.id, url: paymentLink.short_url },
      }).catch((e) => console.error("Audit log error:", e));

      return {
        success: true,
        status: "payment_pending",
        recoveryAttemptId: recoveryAttempt._id,
        attemptNumber: guard.attemptNumber,
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.short_url,
        short_url: paymentLink.short_url,
        paymentLink: paymentLink.short_url,
        amount: transaction.amount,
      };

    } catch (error) {
      console.error("❌ Razorpay payment link creation failed:", error);

      recoveryAttempt.status = "failed";
      recoveryAttempt.failureReason = error.error?.description || error.message || "Razorpay API error";
      await recoveryAttempt.save();

      return {
        success: false,
        status: "failed",
        reason: error.error?.description || error.message || "Failed to create Razorpay Payment Link",
      };
    }
  }


  // ======================================
  // 7. SEND REMINDER
  // ======================================

  if (recommendation.action === "SEND_REMINDER") {
    recoveryAttempt.status = "reminder_sent";
    await recoveryAttempt.save();

    return {
      success: true,
      status: "reminder_sent",
      recoveryAttemptId: recoveryAttempt._id,
      message: "Recovery reminder scheduled successfully",
    };
  }


  // ======================================
  // 8. NO ACTION
  // ======================================

  if (recommendation.action === "NO_ACTION") {
    recoveryAttempt.status = "stopped";
    await recoveryAttempt.save();

    return {
      success: true,
      status: "stopped",
      recoveryAttemptId: recoveryAttempt._id,
      message: "AI determined that no recovery action is required",
    };
  }


  // ======================================
  // 9. Unsupported action
  // ======================================

  return {
    success: false,
    status: "blocked",
    reason: `Unsupported recovery action: ${recommendation.action}`,
  };
};

module.exports = {
  executeRecovery,
};