const express = require("express");

const {
  getRevenueMetrics,
} = require("../controllers/metrics.controller");

const router = express.Router();

router.get(
  "/revenue",
  getRevenueMetrics
);

module.exports = router;