require("dotenv").config();

const dns = require("dns");

// Fix MongoDB SRV DNS resolution
dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  console.log(
    "[CONFIG] Razorpay mode:",
    process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
      ? "TEST"
      : "LIVE/UNKNOWN"
  );

  app.listen(PORT, () => {
    console.log(`RevenuePilot server running on port ${PORT}`);
  });
};

startServer();