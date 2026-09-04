const AuditLog = require("../models/AuditLog");

/**
 * Get audit logs
 * GET /api/audit
 */
const getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, event, transactionId } = req.query;

    const query = {};
    if (event) query.event = event;
    if (transactionId) query.transactionId = transactionId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit) || 100);

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("GetAuditLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs.",
    });
  }
};

module.exports = {
  getAuditLogs,
};
