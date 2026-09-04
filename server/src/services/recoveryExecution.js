const razorpay = require("../config/razorpay");
const RecoveryAttempt = require("../models/RecoveryAttempt");
const AuditLog = require("../models/AuditLog");
const { validateRecoveryAction } = require("./actionValidator");
const { checkRecoveryGuard } = require("./recoveryGuard");

/**
 * Validates whether a URL is a genuine Razorpay URL
 */
const isValidRazorpayUrl = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "rzp.io" || parsed.hostname.endsWith(".razorpay.com"))
    );
  } catch {
    return false;
  }
};

const executeRecovery = async ({
  transaction,
  risk,
  eligibility,
  recommendation,
  user,
}) => {
  const canonicalId = String(transaction.transactionId);

  // Normalize action
  let action = recommendation?.action || "PAYMENT_LINK";
  if (action === "CREATE_PAYMENT_LINK") {
    action = "PAYMENT_LINK";
  }

  // Handle NO_ACTION immediately
  if (action === "NO_ACTION") {
    return {
      success: false,
      status: "blocked",
      action: "NO_ACTION",
      reason: "AI determined that no recovery action is required",
      transactionId: canonicalId,
      recommendation,
    };
  }

  // Validate allowed action
  if (action !== "PAYMENT_LINK" && action !== "SEND_REMINDER") {
    return {
      success: false,
      status: "blocked",
      reason: `Recovery executor does not support action: ${action}`,
      transactionId: canonicalId,
    };
  }

  // Policy validation
  const validation = validateRecoveryAction({
    transaction,
    risk,
    eligibility,
    recommendation: { ...recommendation, action },
  });

  if (!validation.approved) {
    return {
      success: false,
      status: "blocked",
      reason: validation.reason,
      transactionId: canonicalId,
    };
  }

  // Recovery guard check (attempt limit and recovered state)
  const guard = await checkRecoveryGuard(canonicalId);
  if (!guard.allowed) {
    return {
      success: false,
      status: "stopped",
      reason: guard.reason,
      transactionId: canonicalId,
    };
  }

  const amountInRupees = Number(transaction.amount);
  if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
    throw new Error(`Invalid transaction amount: ${transaction.amount}`);
  }

  // ======================================
  // ACTION: SEND_REMINDER
  // ======================================
  if (action === "SEND_REMINDER") {
    const recoveryAttempt = await RecoveryAttempt.create({
      transactionId: canonicalId,
      customerId: transaction.customerId || "CUS_UNKNOWN",
      amount: amountInRupees,
      attemptNumber: guard.attemptNumber,
      idempotencyKey: `${canonicalId}-${guard.attemptNumber}-${Date.now()}`,
      action: "SEND_REMINDER",
      strategy: recommendation?.strategy || "SEND_REMINDER",
      aiReason: recommendation?.reason || "Autonomous recovery reminder strategy executed",
      aiConfidence: recommendation?.confidence || 0.87,
      riskScore: risk?.score ?? 50,
      riskLevel: risk?.level || "MEDIUM",
      eligibilityDecision: eligibility?.decision || "ELIGIBLE",
      status: "reminder_sent",
      executedBy: {
        userId: user?._id || null,
        name: user?.name || "RevenuePilot Engine",
        role: user?.role || "SYSTEM",
      },
    });

    transaction.recoveryStatus = "in_progress";
    transaction.lastRecoveryAttempt = new Date();
    await transaction.save();

    await AuditLog.create({
      transactionId: canonicalId,
      event: "RECOVERY_REMINDER_SENT",
      actor: user?.name || "RevenuePilot Engine",
      actorUserId: user?._id || null,
      actorRole: user?.role || "SYSTEM",
      decision: "SEND_REMINDER",
      status: "SUCCESS",
      details: `Recovery reminder attempt #${guard.attemptNumber} recorded for ${canonicalId}. Connect an SMS/email provider for external delivery.`,
      metadata: {
        attemptNumber: guard.attemptNumber,
        strategy: recommendation?.strategy || "SEND_REMINDER",
        providerNotice: "Reminder action recorded by RevenuePilot. Connect an SMS/email provider for external delivery.",
      },
    }).catch((e) => console.error("Audit log error:", e));

    return {
      success: true,
      message: "Recovery reminder dispatched successfully",
      action: "SEND_REMINDER",
      status: "reminder_sent",
      transactionId: canonicalId,
      recoveryAttemptId: recoveryAttempt._id.toString(),
      strategy: recommendation?.strategy || "SEND_REMINDER",
      details: "Reminder action recorded by RevenuePilot. Connect an SMS/email provider for external delivery.",
      recommendation,
    };
  }

  // ======================================
  // ACTION: PAYMENT_LINK
  // ======================================

  // 1. Idempotency Check: Existing Active Payment Link
  const activeAttempt = await RecoveryAttempt.findOne({
    transactionId: canonicalId,
    status: "payment_pending",
    $or: [{ paymentLinkUrl: { $ne: null } }, { short_url: { $ne: null } }]
  }).sort({ createdAt: -1 });

  if (activeAttempt && (activeAttempt.paymentLinkUrl || activeAttempt.short_url)) {
    const existingUrl = activeAttempt.paymentLinkUrl || activeAttempt.short_url;
    const existingLinkId = activeAttempt.paymentLinkId || activeAttempt.razorpayPaymentLinkId;

    if (isValidRazorpayUrl(existingUrl)) {
      console.log("[RECOVERY] Existing active recovery attempt found with valid payment link:", {
        attemptId: activeAttempt._id,
        transactionId: canonicalId,
        paymentLinkId: existingLinkId,
        short_url: existingUrl
      });

      return {
        success: true,
        message: "Recovery executed successfully",
        transactionId: canonicalId,
        recoveryAttemptId: activeAttempt._id.toString(),
        action: "PAYMENT_LINK",
        paymentLink: {
          id: existingLinkId,
          short_url: existingUrl,
          amount: activeAttempt.amount,
          currency: "INR",
          status: activeAttempt.status || "payment_pending",
        },
        paymentLinkId: existingLinkId,
        paymentLinkUrl: existingUrl,
        short_url: existingUrl,
        status: activeAttempt.status || "payment_pending",
        recommendation,
      };
    }
  }

  const amountInPaise = Math.round(amountInRupees * 100);
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new Error(`Invalid Razorpay amount: ${amountInPaise}`);
  }

  console.log("[RAZORPAY] Amount:", {
    rupees: amountInRupees,
    paise: amountInPaise,
  });

  // Create recovery attempt record
  const recoveryAttempt = await RecoveryAttempt.create({
    transactionId: canonicalId,
    customerId: transaction.customerId || "CUS_UNKNOWN",
    amount: amountInRupees,
    attemptNumber: guard.attemptNumber,
    idempotencyKey: `${canonicalId}-${guard.attemptNumber}-${Date.now()}`,
    action: "PAYMENT_LINK",
    strategy: recommendation?.strategy || "PAYMENT_LINK",
    aiReason: recommendation?.reason || "Autonomous recovery strategy executed",
    aiConfidence: recommendation?.confidence || 0.87,
    riskScore: risk?.score ?? 50,
    riskLevel: risk?.level || "MEDIUM",
    eligibilityDecision: eligibility?.decision || "ELIGIBLE",
    status: "created",
    executedBy: {
      userId: user?._id || null,
      name: user?.name || "RevenuePilot Engine",
      role: user?.role || "SYSTEM",
    },
  });

  // Build Razorpay Payment Link Request
  console.log("[RAZORPAY] Starting Payment Link creation");
  const referenceId = `RP-${canonicalId}-${Date.now()}`;

  const customer = {};
  if (transaction.customerEmail && String(transaction.customerEmail).trim()) {
    customer.email = String(transaction.customerEmail).trim();
  }
  if (transaction.customerContact || transaction.customerPhone) {
    const rawContact = String(transaction.customerContact || transaction.customerPhone).trim();
    if (rawContact && rawContact.length >= 8) customer.contact = rawContact;
  }
  if (Object.keys(customer).length > 0 && transaction.customerName && String(transaction.customerName).trim()) {
    customer.name = String(transaction.customerName).trim();
  }

  const options = {
    amount: amountInPaise,
    currency: "INR",
    description: `Revenue Recovery - ${canonicalId}`,
    reference_id: referenceId,
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    notes: {
      source: "RevenuePilot",
      transactionId: canonicalId,
      recoveryAttemptId: String(recoveryAttempt._id || recoveryAttempt.id),
    },
  };

  if (Object.keys(customer).length > 0) {
    options.customer = customer;
  }

  let paymentLink;
  try {
    paymentLink = await razorpay.paymentLink.create(options);
  } catch (error) {
    console.error("[RAZORPAY ERROR]", {
      message: error?.message,
      statusCode: error?.statusCode,
      code: error?.error?.code,
      description: error?.error?.description,
      field: error?.error?.field,
    });

    recoveryAttempt.status = "failed";
    recoveryAttempt.failureReason = error?.error?.description || error?.message || "Razorpay Payment Link creation failed";
    await recoveryAttempt.save();

    throw new Error(
      error?.error?.description ||
      error?.message ||
      "Razorpay Payment Link creation failed"
    );
  }

  if (!paymentLink || !paymentLink.id || !paymentLink.short_url || !isValidRazorpayUrl(paymentLink.short_url)) {
    recoveryAttempt.status = "failed";
    recoveryAttempt.failureReason = !paymentLink
      ? "Razorpay returned an empty payment link response"
      : !paymentLink.id
        ? "Razorpay did not return a payment link ID"
        : !paymentLink.short_url
          ? `Razorpay created link ${paymentLink.id} but did not return short_url`
          : `Invalid Razorpay short_url returned by Razorpay`;
    await recoveryAttempt.save();
    throw new Error(recoveryAttempt.failureReason);
  }

  // Update Database Models
  recoveryAttempt.status = "payment_pending";
  recoveryAttempt.razorpayPaymentLinkId = paymentLink.id;
  recoveryAttempt.razorpayPaymentLinkUrl = paymentLink.short_url;
  recoveryAttempt.paymentLinkId = paymentLink.id;
  recoveryAttempt.paymentLinkUrl = paymentLink.short_url;
  recoveryAttempt.short_url = paymentLink.short_url;
  await recoveryAttempt.save();

  transaction.recoveryStatus = "in_progress";
  transaction.lastRecoveryAttempt = new Date();
  await transaction.save();

  await AuditLog.create({
    transactionId: canonicalId,
    event: "RECOVERY_PAYMENT_LINK_CREATED",
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
    message: "Recovery executed successfully",
    transactionId: canonicalId,
    recoveryAttemptId: recoveryAttempt._id.toString(),
    action: "PAYMENT_LINK",
    paymentLink: {
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      amount: paymentLink.amount,
      currency: paymentLink.currency || "INR",
      status: paymentLink.status || "created",
    },
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.short_url,
    short_url: paymentLink.short_url,
    status: "payment_pending",
    recommendation,
  };
};

module.exports = {
  executeRecovery,
  isValidRazorpayUrl,
};