const calculateRisk = (transaction) => {
  let score = 0;
  const reasons = [];

  // Payment failure
  if (transaction.status === "failed") {
    score += 30;
    reasons.push("Payment failure");
  }

  // Checkout abandonment
  if (
    transaction.status === "abandoned" ||
    transaction.checkoutAbandoned
  ) {
    score += 25;
    reasons.push("Checkout abandoned");
  }

  // Overdue invoice
  if (
    transaction.status === "overdue" ||
    transaction.daysOverdue > 0
  ) {
    score += 35;
    reasons.push(
      `${transaction.daysOverdue} days overdue`
    );
  }

  // Repeated failures
  if (transaction.previousFailures >= 2) {
    score += 15;
    reasons.push("Repeated payment failures");
  }

  // Multiple attempts
  if (transaction.attempts >= 2) {
    score += 10;
    reasons.push("Multiple payment attempts");
  }

  // Strong historical payment behavior
  if (transaction.successfulPayments >= 5) {
    score -= 10;
    reasons.push("Strong payment history");
  }

  // Never allow negative risk
  score = Math.max(0, Math.min(score, 100));

  let level;

  if (score >= 80) {
    level = "CRITICAL";
  } else if (score >= 60) {
    level = "HIGH";
  } else if (score >= 30) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  return {
    score,
    level,
    reasons,
  };
};

module.exports = {
  calculateRisk,
};