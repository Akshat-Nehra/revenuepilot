const express = require("express");
const cors = require("cors");

const paymentRoutes = require("./routes/payment.routes");

const transactionRoutes = require(
  "./routes/transaction.routes"
);

const metricsRoutes = require(
  "./routes/metrics.routes"
);

const recoveryRoutes = require(
  "./routes/recovery.routes"
);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "RevenuePilot backend is running",
  });
});

app.use("/api/payments", paymentRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/metrics", metricsRoutes);

app.use("/api/recovery", recoveryRoutes);

module.exports = app;
