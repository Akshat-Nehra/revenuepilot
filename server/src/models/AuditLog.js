const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: String,
      default: "RevenuePilot Engine",
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorRole: {
      type: String,
      default: "SYSTEM",
    },
    decision: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "SUCCESS",
    },
    details: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
