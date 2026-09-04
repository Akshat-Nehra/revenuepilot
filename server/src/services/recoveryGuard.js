const RecoveryAttempt = require("../models/RecoveryAttempt");

const MAX_ATTEMPTS = 3;

const checkRecoveryGuard = async (transactionId) => {
  const attempts = await RecoveryAttempt.find({
    transactionId,
  }).sort({
    attemptNumber: 1,
  });

  // 1. Already recovered?
  const recovered = attempts.find(
    (attempt) => attempt.status === "recovered"
  );

  if (recovered) {
    return {
      allowed: false,
      reason: "Transaction has already been recovered",
      attempts,
    };
  }

  // 2. Count non-stopped attempts towards maximum limit
  const activeOrCompletedAttempts = attempts.filter(
    (attempt) => attempt.status !== "stopped"
  );

  if (activeOrCompletedAttempts.length >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      reason: "Maximum automated recovery attempts reached",
      attempts,
    };
  }

  return {
    allowed: true,
    attemptNumber: activeOrCompletedAttempts.length + 1,
    attempts,
  };
};

module.exports = {
  checkRecoveryGuard,
  MAX_ATTEMPTS,
};