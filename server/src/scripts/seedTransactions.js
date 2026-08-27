require("dotenv").config();

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const names = [
  "Rahul Sharma",
  "Priya Verma",
  "Aman Gupta",
  "Neha Singh",
  "Rohan Mehta",
  "Ananya Kapoor",
  "Arjun Malhotra",
  "Simran Kaur",
  "Karan Bhatia",
  "Ishita Jain",
];

const paymentMethods = [
  "UPI",
  "CARD",
  "NETBANKING",
  "WALLET",
];

const failureReasons = [
  "insufficient_funds",
  "bank_declined",
  "technical_error",
  "authentication_failed",
];

const statuses = [
  "successful",
  "failed",
  "abandoned",
  "overdue",
];

const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomNumber = (min, max) => {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
};

const generateTransaction = (index) => {
  const status = randomItem(statuses);

  let failureReason = null;
  let checkoutAbandoned = false;
  let daysOverdue = 0;
  let subscriptionStatus = "none";
  let attempts = 0;

  if (status === "failed") {
    failureReason = randomItem(failureReasons);

    attempts = randomNumber(1, 3);

    subscriptionStatus =
      Math.random() > 0.5
        ? "active"
        : "none";
  }

  if (status === "abandoned") {
    checkoutAbandoned = true;

    attempts = 0;

    subscriptionStatus = "none";
  }

  if (status === "overdue") {
    daysOverdue = randomNumber(3, 30);

    subscriptionStatus = "active";
  }

  const successfulPayments =
    randomNumber(0, 12);

  const previousFailures =
    randomNumber(0, 3);

  const amount = randomNumber(
    499,
    50000
  );

  return {
    transactionId: `TXN_${String(index).padStart(5, "0")}`,

    customerId: `CUS_${String(
      randomNumber(1, 100)
    ).padStart(4, "0")}`,

    customerName: randomItem(names),

    amount,

    currency: "INR",

    status,

    failureReason,

    paymentMethod:
      randomItem(paymentMethods),

    attempts,

    successfulPayments,

    previousFailures,

    daysOverdue,

    checkoutAbandoned,

    subscriptionStatus,

    recoveryStatus:
      status === "successful"
        ? "not_required"
        : "pending",
  };
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "Connected to MongoDB"
    );

    await Transaction.deleteMany({});

    console.log(
      "Existing transactions cleared"
    );

    const transactions = [];

    for (let i = 1; i <= 500; i++) {
      transactions.push(
        generateTransaction(i)
      );
    }

    await Transaction.insertMany(
      transactions
    );

    console.log(
      `Inserted ${transactions.length} transactions`
    );

    await mongoose.disconnect();

    console.log(
      "Database connection closed"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Seeding failed:",
      error
    );

    process.exit(1);
  }
};

seedDatabase();