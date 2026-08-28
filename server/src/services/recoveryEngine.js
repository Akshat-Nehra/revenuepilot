const evaluateRecoveryEligibility = (transaction, risk) => {
  const reasons = [];
  const warnings = [];

  // ----------------------------------------
  // STOP RULE 1: Already recovered
  // ----------------------------------------

  if (transaction.recoveryStatus === "recovered") {
    return {
      decision: "STOP",
      reason: "Transaction has already been recovered",
      reasons: ["Already recovered"],
      warnings: [],
    };
  }

  // ----------------------------------------
  // STOP RULE 2: Successful transaction
  // ----------------------------------------

  if (transaction.status === "successful") {
    return {
      decision: "STOP",
      reason: "Transaction was already successful",
      reasons: ["Payment successful"],
      warnings: [],
    };
  }

  // ----------------------------------------
  // STOP RULE 3: Too many attempts
  // ----------------------------------------

  if (transaction.attempts >= 3) {
    return {
      decision: "STOP",
      reason: "Maximum recovery attempts reached",
      reasons: ["Three or more payment attempts"],
      warnings: [
        "Further attempts may negatively impact customer experience",
      ],
    };
  }

  // ----------------------------------------
  // STOP RULE 4: Excessive previous failures
  // ----------------------------------------

  if (transaction.previousFailures >= 4) {
    return {
      decision: "STOP",
      reason: "Customer has excessive previous failures",
      reasons: ["Four or more previous failures"],
      warnings: [
        "Customer should not receive automated recovery attempts",
      ],
    };
  }

  // ----------------------------------------
  // HUMAN REVIEW: High-value transaction
  // ----------------------------------------

  if (transaction.amount > 50000) {
    return {
      decision: "HUMAN_REVIEW",
      reason: "Transaction exceeds automated recovery limit",
      reasons: ["Amount greater than ₹50,000"],
      warnings: [
        "Human approval required before money-related action",
      ],
    };
  }

  // ----------------------------------------
  // HUMAN REVIEW: Critical risk
  // ----------------------------------------

  if (risk.score >= 80) {
    return {
      decision: "HUMAN_REVIEW",
      reason: "Transaction has critical revenue risk",
      reasons: ["Risk score is 80 or higher"],
      warnings: [
        "Critical-risk transactions require human review",
      ],
    };
  }

  // ----------------------------------------
  // HUMAN REVIEW: Very low confidence
  // ----------------------------------------

  if (risk.score < 30) {
    return {
      decision: "STOP",
      reason: "Risk is too low to justify recovery",
      reasons: ["Risk score below 30"],
      warnings: [],
    };
  }

  // ----------------------------------------
  // ELIGIBLE
  // ----------------------------------------

  if (transaction.status === "failed") {
    reasons.push("Payment failure detected");
  }

  if (
    transaction.status === "abandoned" ||
    transaction.checkoutAbandoned
  ) {
    reasons.push("Checkout abandonment detected");
  }

  if (
    transaction.status === "overdue" ||
    transaction.daysOverdue > 0
  ) {
    reasons.push("Outstanding payment detected");
  }

  return {
    decision: "ELIGIBLE",
    reason: "Transaction meets automated recovery criteria",
    reasons,
    warnings,
  };
};

module.exports = {
  evaluateRecoveryEligibility,
};