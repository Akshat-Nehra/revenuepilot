const razorpay = require("../config/razorpay");

const RecoveryAttempt = require("../models/RecoveryAttempt");

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
  // 4. CREATE PAYMENT LINK
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
      // 5. Update recovery attempt
      // ==================================

      recoveryAttempt.status =
        "payment_pending";

      recoveryAttempt.razorpayPaymentLinkId =
        paymentLink.id;

      recoveryAttempt.razorpayPaymentLinkUrl =
        paymentLink.short_url;

      await recoveryAttempt.save();


      // ==================================
      // 6. Update transaction
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


  // ======================================
  // 7. SEND REMINDER
  // ======================================

  if (
    recommendation.action ===
    "SEND_REMINDER"
  ) {

    recoveryAttempt.status =
      "reminder_sent";

    await recoveryAttempt.save();

    return {
      success: true,

      status:
        "reminder_sent",

      recoveryAttemptId:
        recoveryAttempt._id,

      message:
        "Recovery reminder scheduled successfully",
    };
  }


  // ======================================
  // 8. NO ACTION
  // ======================================

  if (
    recommendation.action ===
    "NO_ACTION"
  ) {

    recoveryAttempt.status =
      "stopped";

    await recoveryAttempt.save();

    return {
      success: true,

      status: "stopped",

      recoveryAttemptId:
        recoveryAttempt._id,

      message:
        "AI determined that no recovery action is required",
    };
  }


  // ======================================
  // 9. Unsupported action
  // ======================================

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