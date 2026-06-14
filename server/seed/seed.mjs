import Role from "../models/role.model.mjs";
import User from "../models/user.model.mjs";
import { buildFullPermissions } from "../constants/modules.mjs";

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@bahelper.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";

export const seedDatabase = async () => {
  let adminRole = await Role.findOne({ name: "Super Admin" });

  if (!adminRole) {
    adminRole = await Role.create({
      name: "Super Admin",
      description: "Full system access with all module permissions",
      permissions: buildFullPermissions(),
      isSystem: true,
    });
    console.log("✓ Super Admin role created");
  } else {
    adminRole.permissions = buildFullPermissions();
    await adminRole.save();
    console.log("✓ Super Admin permissions synced");
  }

  const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL });
  if (!existingAdmin) {
    await User.create({
      firstName: "System",
      lastName: "Admin",
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role: adminRole._id,
      isActive: true,
    });
    console.log(`✓ Seed admin user created (${SEED_ADMIN_EMAIL})`);
  } else {
    console.log(`✓ Seed admin user already exists (${SEED_ADMIN_EMAIL})`);
  }
};
