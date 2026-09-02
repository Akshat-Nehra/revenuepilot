const express = require("express");
const cors = require("cors");

const app = express();

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

const webhookRoutes = require(
  "./routes/webhook.routes"
);


app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

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

app.use("/api/webhooks", webhookRoutes);

module.exports = app;
