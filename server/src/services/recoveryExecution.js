const razorpay = require(
  "../config/razorpay"
);

const RecoveryAttempt = require(
  "../models/RecoveryAttempt"
);

const Transaction = require(
  "../models/Transaction"
);

const {
  validateRecoveryAction,
} = require("./actionValidator");

const executeRecovery = async ({
  transaction,
  risk,
  eligibility,
  recommendation,
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
  // 2. Create recovery attempt
  // ======================================

  const recoveryAttempt =
    await RecoveryAttempt.create({
      transactionId:
        transaction.transactionId,

      customerId:
        transaction.customerId,

      amount:
        transaction.amount,

      action:
        recommendation.action,

      strategy:
        recommendation.strategy,

      aiReason:
        recommendation.reason,

      aiConfidence:
        recommendation.confidence,

      riskScore:
        risk.score,

      riskLevel:
        risk.level,

      eligibilityDecision:
        eligibility.decision,

      status: "created",
    });

  // ======================================
  // 3. CREATE PAYMENT LINK
  // ======================================

  if (
    recommendation.action ===
    "CREATE_PAYMENT_LINK"
  ) {

    try {

      const paymentLink =
        await razorpay.paymentLink.create({
          amount:
            Math.round(
              transaction.amount * 100
            ),

          currency: "INR",

          description:
            `Revenue recovery for ${transaction.transactionId}`,

          reference_id:
            transaction.transactionId,

          customer: {
            name:
              transaction.customerName,
          },

          notes: {
            transactionId:
              transaction.transactionId,

            recoveryAttemptId:
              recoveryAttempt._id.toString(),

            source:
              "RevenuePilot",
          },

          notify: {
            sms: false,
            email: false,
          },

          reminder_enable: false,
        });

      // ==================================
      // 4. Update recovery attempt
      // ==================================

      recoveryAttempt.status =
        "payment_pending";

      recoveryAttempt.razorpayPaymentLinkId =
        paymentLink.id;

      recoveryAttempt.razorpayPaymentLinkUrl =
        paymentLink.short_url;

      await recoveryAttempt.save();

      // ==================================
      // 5. Update transaction
      // ==================================

      transaction.recoveryStatus =
        "in_progress";

      await transaction.save();

      return {
        success: true,

        status:
          "payment_pending",

        recoveryAttemptId:
          recoveryAttempt._id,

        paymentLinkId:
          paymentLink.id,

        paymentLinkUrl:
          paymentLink.short_url,

        amount:
          transaction.amount,
      };

    } catch (error) {

      recoveryAttempt.status =
        "failed";

      recoveryAttempt.failureReason =
        error.message;

      await recoveryAttempt.save();

      return {
        success: false,

        status: "failed",

        reason:
          error.message,
      };
    }
  }

  return {
    success: false,

    status: "unsupported",

    reason:
      "Recovery action is not executable yet",
  };
};

module.exports = {
  executeRecovery,
};