const validateRecoveryAction = ({
  transaction,
  risk,
  eligibility,
  recommendation,
}) => {
  const allowedActions = [
    "CREATE_PAYMENT_LINK",
    "PAYMENT_LINK",
    "PAYMENT_RETRY",
    "SEND_REMINDER",
    "NO_ACTION",
  ];

  // -----------------------------
  // Eligibility must be valid
  // -----------------------------

  if (eligibility && eligibility.decision !== "ELIGIBLE" && eligibility.decision !== "APPROVED") {
    return {
      approved: false,
      reason: "Transaction is not eligible for automated recovery",
    };
  }

  // -----------------------------
  // Validate AI action
  // -----------------------------

  if (!allowedActions.includes(recommendation.action)) {
    return {
      approved: false,
      reason: `AI requested an unsupported action: ${recommendation.action}`,
    };
  }

  // -----------------------------
  // NO_ACTION
  // -----------------------------

  if (recommendation.action === "NO_ACTION") {
    return {
      approved: false,
      reason: "AI determined that no recovery action is required",
    };
  }

  // -----------------------------
  // Confidence guardrail
  // -----------------------------

  if (
    typeof recommendation.confidence === "number" &&
    recommendation.confidence < 0.5
  ) {
    return {
      approved: false,
      reason: "AI confidence is below the minimum safety threshold",
    };
  }

  // -----------------------------
  // Amount safety
  // -----------------------------

  if (!transaction.amount || transaction.amount <= 0) {
    return {
      approved: false,
      reason: "Invalid transaction amount",
    };
  }

  // -----------------------------
  // Maximum automated amount policy (₹2,00,000 max)
  // -----------------------------

  if (transaction.amount > 200000) {
    return {
      approved: false,
      reason: "Transaction exceeds automated recovery amount limit (₹2,00,000)",
    };
  }

  // -----------------------------
  // Critical fraud risk cutoff
  // -----------------------------

  if (risk && risk.score > 95) {
    return {
      approved: false,
      reason: "Critical fraud risk detected — requires manual compliance review",
    };
  }

  // -----------------------------
  // Everything passed
  // -----------------------------

  return {
    approved: true,
    reason: "Recovery action passed all policy checks",
  };
};

module.exports = {
  validateRecoveryAction,
};