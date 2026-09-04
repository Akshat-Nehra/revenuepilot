const express = require("express");
const { login, getMe, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Public login route
router.post("/login", login);

// Authenticated session routes
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

module.exports = router;
