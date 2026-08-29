const validateRecoveryAction = ({
  transaction,
  risk,
  eligibility,
  recommendation,
}) => {
  const allowedActions = [
    "CREATE_PAYMENT_LINK",
    "SEND_REMINDER",
    "NO_ACTION",
  ];

  // -----------------------------
  // Eligibility must be valid
  // -----------------------------

  if (
    eligibility.decision !== "ELIGIBLE"
  ) {
    return {
      approved: false,
      reason:
        "Transaction is not eligible for automated recovery",
    };
  }

  // -----------------------------
  // Validate AI action
  // -----------------------------

  if (
    !allowedActions.includes(
      recommendation.action
    )
  ) {
    return {
      approved: false,
      reason:
        "AI requested an unsupported action",
    };
  }

  // -----------------------------
  // NO_ACTION
  // -----------------------------

  if (
    recommendation.action === "NO_ACTION"
  ) {
    return {
      approved: false,
      reason:
        "AI determined that no recovery action is required",
    };
  }

  // -----------------------------
  // Confidence guardrail
  // -----------------------------

  if (
    typeof recommendation.confidence !==
      "number" ||
    recommendation.confidence < 0.6
  ) {
    return {
      approved: false,
      reason:
        "AI confidence is below the minimum threshold",
    };
  }

  // -----------------------------
  // Amount safety
  // -----------------------------

  if (
    !transaction.amount ||
    transaction.amount <= 0
  ) {
    return {
      approved: false,
      reason:
        "Invalid transaction amount",
    };
  }

  // -----------------------------
  // Maximum automated amount
  // -----------------------------

  if (transaction.amount > 50000) {
    return {
      approved: false,
      reason:
        "Transaction exceeds automated recovery amount limit",
    };
  }

  // -----------------------------
  // Critical risk
  // -----------------------------

  if (risk.score >= 80) {
    return {
      approved: false,
      reason:
        "Critical-risk transaction requires human review",
    };
  }

  // -----------------------------
  // Everything passed
  // -----------------------------

  return {
    approved: true,
    reason:
      "Recovery action passed all policy checks",
  };
};

module.exports = {
  validateRecoveryAction,
};