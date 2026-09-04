const express = require("express");
const cors = require("cors");

const app = express();

// Route Imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const auditRoutes = require("./routes/audit.routes");
const paymentRoutes = require("./routes/payment.routes");
const transactionRoutes = require("./routes/transaction.routes");
const metricsRoutes = require("./routes/metrics.routes");
const recoveryRoutes = require("./routes/recovery.routes");
const webhookRoutes = require("./routes/webhook.routes");

// Middleware Imports
const { authenticate, authorize } = require("./middleware/auth.middleware");

// CORS Configuration
const configuredOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

// Body Parser with Raw Body Preservation for Webhook HMAC Verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Public Health Endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "RevenuePilot backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Authentication & Public Routes
app.use("/api/auth", authRoutes);
app.use("/api/webhooks", webhookRoutes);

// Protected Admin User Management Routes (ADMIN only)
app.use("/api/users", userRoutes);

// Protected Audit Log Routes (ADMIN + EMPLOYEE)
app.use("/api/audit", auditRoutes);

// Protected Business APIs (ADMIN + EMPLOYEE)
app.use("/api/transactions", authenticate, authorize("ADMIN", "EMPLOYEE"), transactionRoutes);
app.use("/api/metrics", authenticate, authorize("ADMIN", "EMPLOYEE"), metricsRoutes);
app.use("/api/recovery", authenticate, authorize("ADMIN", "EMPLOYEE"), recoveryRoutes);
app.use("/api/ai/decisions", authenticate, authorize("ADMIN", "EMPLOYEE"), (req, res) => require("./controllers/recovery.controller").getAIDecisions(req, res));
app.use("/api/payments", authenticate, authorize("ADMIN", "EMPLOYEE"), paymentRoutes);

module.exports = app;
