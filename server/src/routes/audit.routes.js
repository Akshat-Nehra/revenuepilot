const express = require("express");
const { getAuditLogs } = require("../controllers/audit.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Audit logs are accessible to both ADMIN and EMPLOYEE
router.use(authenticate);
router.use(authorize("ADMIN", "EMPLOYEE"));

router.get("/", getAuditLogs);

module.exports = router;
