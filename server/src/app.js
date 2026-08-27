const express = require("express");
const cors = require("cors");

const paymentRoutes = require("./routes/payment.routes");

const transactionRoutes = require(
  "./routes/transaction.routes"
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

module.exports = app;
