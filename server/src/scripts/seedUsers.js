require("dotenv").config();
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const User = require("../models/User");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/revenuepilot";
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected for User Seeding");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  await connectDB();

  const adminPassword = process.env.ADMIN_DEMO_PASSWORD || "Admin@123456";
  const employeePassword = process.env.EMPLOYEE_DEMO_PASSWORD || "Employee@123456";

  const usersToSeed = [
    {
      name: "RevenuePilot Admin",
      email: "admin@revenuepilot.ai",
      password: adminPassword,
      role: "ADMIN",
    },
    {
      name: "Recovery Analyst",
      email: "employee@revenuepilot.ai",
      password: employeePassword,
      role: "EMPLOYEE",
    },
  ];

  console.log("🌱 Seeding demo users...");

  for (const item of usersToSeed) {
    const existing = await User.findOne({ email: item.email });

    if (existing) {
      console.log(`ℹ️ User '${item.email}' (${existing.role}) already exists.`);
      // Update password hash and ensure isActive = true
      existing.passwordHash = await User.hashPassword(item.password);
      existing.isActive = true;
      existing.role = item.role;
      await existing.save();
      console.log(`   Updated credentials for '${item.email}'.`);
    } else {
      const passwordHash = await User.hashPassword(item.password);
      await User.create({
        name: item.name,
        email: item.email,
        passwordHash,
        role: item.role,
        isActive: true,
      });
      console.log(`✅ Created user '${item.name}' (${item.email}) - Role: ${item.role}`);
    }
  }

  console.log("\n==========================================");
  console.log("🎉 User Seeding Complete!");
  console.log("------------------------------------------");
  console.log("ADMIN Credentials:");
  console.log(`  Email:    admin@revenuepilot.ai`);
  console.log(`  Password: ${adminPassword}`);
  console.log("------------------------------------------");
  console.log("EMPLOYEE Credentials:");
  console.log(`  Email:    employee@revenuepilot.ai`);
  console.log(`  Password: ${employeePassword}`);
  console.log("==========================================\n");

  await mongoose.disconnect();
  process.exit(0);
};

seedUsers();
