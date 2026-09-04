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
const parseAllowedOrigins = () => {
  const rawOrigins = [
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS,
    "https://revenuepilot-blush.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
  ];

  const origins = [];
  rawOrigins.forEach((item) => {
    if (!item) return;
    item.split(",").forEach((origin) => {
      const trimmed = origin.trim().replace(/\/+$/, "");
      if (trimmed) origins.push(trimmed);
    });
  });

  return Array.from(new Set(origins));
};

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (curl, Postman, server-to-server)
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const allowedOrigins = parseAllowedOrigins();
  
  if (allowedOrigins.includes(cleanOrigin)) return true;
  
  // Allow all Vercel deployments (preview branches & production) and localhost origins
  if (
    /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin) ||
    /^https:\/\/revenuepilot(-[a-z0-9-]+)?\.vercel\.app$/.test(cleanOrigin) ||
    /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
  ) {
    return true;
  }
  
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    optionsSuccessStatus: 200,
    maxAge: 86400,
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
