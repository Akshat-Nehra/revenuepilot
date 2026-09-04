const mongoose = require("mongoose");

const recoveryAttemptSchema =
  new mongoose.Schema(
    {
      transactionId: {
        type: String,
        required: true,
        index: true,
      },

      customerId: {
        type: String,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      action: {
        type: String,
        enum: [
          "CREATE_PAYMENT_LINK",
          "PAYMENT_LINK",
          "PAYMENT_RETRY",
          "SEND_REMINDER",
          "NO_ACTION",
        ],
        required: true,
      },

      strategy: {
        type: String,
        required: true,
      },

      aiReason: {
        type: String,
        required: true,
      },

      aiConfidence: {
        type: Number,
        min: 0,
        max: 1,
      },

      riskScore: {
        type: Number,
        required: true,
      },

      riskLevel: {
        type: String,
        required: true,
      },

      eligibilityDecision: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "created",
          "payment_pending",
          "reminder_sent",
          "recovered",
          "failed",
          "stopped",
        ],
        default: "created",
      },

      razorpayPaymentLinkId: {
        type: String,
        default: null,
      },

      razorpayPaymentLinkUrl: {
        type: String,
        default: null,
      },

      paymentLinkId: {
        type: String,
        default: null,
      },

      paymentLinkUrl: {
        type: String,
        default: null,
      },

      short_url: {
        type: String,
        default: null,
      },

      recoveredAmount: {
        type: Number,
        default: 0,
      },

      recoveredAt: {
        type: Date,
        default: null,
      },

      failureReason: {
        type: String,
        default: null,
      },

      attemptNumber: {
         type: Number,
         required: true,
        },

    idempotencyKey: {
         type: String,
        required: true,
         unique: true,
    },

    executedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: {
        type: String,
        default: "System",
      },
      role: {
        type: String,
        default: "SYSTEM",
      },
    },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "RecoveryAttempt",
    recoveryAttemptSchema
  );