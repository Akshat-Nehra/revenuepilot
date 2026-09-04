const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const JWT_SECRET = process.env.JWT_SECRET || "revenuepilot-secret-jwt-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Record security audit log
      await AuditLog.create({
        event: "LOGIN_FAILED",
        actor: cleanEmail,
        actorRole: "UNKNOWN",
        status: "FAILED",
        details: `Login failed: user '${cleanEmail}' does not exist.`,
        metadata: { ip: req.ip },
      }).catch((e) => console.error("Audit log error:", e));

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isValid = await user.isValidPassword(password);

    if (!isValid) {
      // Record security audit log
      await AuditLog.create({
        event: "LOGIN_FAILED",
        actor: user.name,
        actorUserId: user._id,
        actorRole: user.role,
        status: "FAILED",
        details: `Failed password attempt for '${user.email}'.`,
        metadata: { ip: req.ip },
      }).catch((e) => console.error("Audit log error:", e));

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact an administrator.",
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Sign JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Record successful login audit
    await AuditLog.create({
      event: "LOGIN_SUCCESS",
      actor: user.name,
      actorUserId: user._id,
      actorRole: user.role,
      status: "SUCCESS",
      details: `User '${user.name}' (${user.role}) logged in successfully.`,
      metadata: { ip: req.ip },
    }).catch((e) => console.error("Audit log error:", e));

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again.",
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GetMe controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile.",
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await AuditLog.create({
        event: "LOGOUT",
        actor: req.user.name,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        status: "SUCCESS",
        details: `User '${req.user.name}' logged out.`,
      }).catch((e) => console.error("Audit log error:", e));
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during logout.",
    });
  }
};

module.exports = {
  login,
  getMe,
  logout,
};
