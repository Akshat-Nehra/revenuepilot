const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

/**
 * Get all users (ADMIN only)
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("GetUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

/**
 * Create a new user / employee (ADMIN only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "EMPLOYEE" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and initial password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A user with email '${cleanEmail}' already exists.`,
      });
    }

    // Validate role
    const assignedRole = ["ADMIN", "EMPLOYEE"].includes(role) ? role : "EMPLOYEE";

    // Hash password
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      isActive: true,
    });

    // Record audit log
    await AuditLog.create({
      event: "USER_CREATED",
      actor: req.user.name,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      status: "SUCCESS",
      details: `Created new user '${newUser.name}' (${newUser.email}) with role ${newUser.role}.`,
    }).catch((e) => console.error("Audit log error:", e));

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("CreateUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user.",
      error: error.message,
    });
  }
};

/**
 * Update user status / role (ADMIN only)
 * PATCH /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role, name } = req.body;

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Self-modification protection: Prevent admin from deactivating or demoting themselves
    if (req.user._id.toString() === id) {
      if (isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Action blocked: You cannot deactivate your own administrative account.",
        });
      }
      if (role && role !== "ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Action blocked: You cannot remove your own administrator privileges.",
        });
      }
    }

    const updates = [];

    if (typeof isActive === "boolean" && targetUser.isActive !== isActive) {
      targetUser.isActive = isActive;
      updates.push(isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED");
    }

    if (role && ["ADMIN", "EMPLOYEE"].includes(role) && targetUser.role !== role) {
      targetUser.role = role;
      updates.push("ROLE_CHANGED");
    }

    if (name && String(name).trim() && targetUser.name !== name) {
      targetUser.name = String(name).trim();
      updates.push("PROFILE_UPDATED");
    }

    await targetUser.save();

    // Record audit events
    for (const eventName of updates) {
      await AuditLog.create({
        event: eventName,
        actor: req.user.name,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        status: "SUCCESS",
        details: `Updated user '${targetUser.name}' (${targetUser.email}): status=${targetUser.isActive ? 'Active' : 'Inactive'}, role=${targetUser.role}.`,
      }).catch((e) => console.error("Audit log error:", e));
    }

    return res.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
        lastLoginAt: targetUser.lastLoginAt,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("UpdateUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};
