const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "successful",
        "failed",
        "abandoned",
        "overdue",
      ],
      required: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "WALLET"],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    successfulPayments: {
      type: Number,
      default: 0,
    },

    previousFailures: {
      type: Number,
      default: 0,
    },

    daysOverdue: {
      type: Number,
      default: 0,
    },

    checkoutAbandoned: {
      type: Boolean,
      default: false,
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "paused", "cancelled", "none"],
      default: "none",
    },

    recoveryStatus: {
      type: String,
      enum: [
        "pending",
        "eligible",
        "in_progress",
        "recovered",
        "stopped",
        "not_required",
      ],
      default: "pending",
    },

    riskScore: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ],
      default: "LOW",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);