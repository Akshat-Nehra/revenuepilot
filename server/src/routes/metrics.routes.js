const express = require("express");
const { getRevenueMetrics } = require("../controllers/metrics.controller");

const router = express.Router();

router.get("/", getRevenueMetrics);
router.get("/revenue", getRevenueMetrics);
router.get("/overview", getRevenueMetrics);

module.exports = router;