const express = require("express");
const { getUsers, createUser, updateUser } = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// All user management routes require ADMIN role
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);

module.exports = router;
