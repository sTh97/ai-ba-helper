import Role from "../models/role.model.mjs";
import User from "../models/user.model.mjs";
import { MODULES } from "../constants/modules.mjs";
import { buildOwnerFilter } from "../utils/permissions.mjs";

const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    throw new Error("Permissions must be an array");
  }

  const validModules = MODULES.map((m) => m.key);
  for (const perm of permissions) {
    if (!validModules.includes(perm.module)) {
      throw new Error(`Invalid module: ${perm.module}`);
    }
  }
};

export const getModules = async (_req, res) => {
  res.json(MODULES);
};

export const getAllRoles = async (req, res) => {
  try {
    const ownerFilter = buildOwnerFilter(req.user, "roles");
    const filter = ownerFilter.createdBy
      ? { $or: [ownerFilter, { isSystem: true }] }
      : {};
    const roles = await Role.find(filter).sort({ createdAt: -1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    validatePermissions(permissions);

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: "Role name already exists" });
    }

    const role = await Role.create({
      name: name.trim(),
      description: description?.trim() || "",
      permissions: permissions || [],
      createdBy: req.user._id,
    });

    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem) {
      return res.status(400).json({ error: "System roles cannot be modified" });
    }

    if (permissions) validatePermissions(permissions);

    if (name?.trim() && name.trim() !== role.name) {
      const existing = await Role.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ error: "Role name already exists" });
      }
      role.name = name.trim();
    }

    if (description !== undefined) role.description = description?.trim() || "";
    if (permissions) role.permissions = permissions;

    await role.save();
    res.json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem) {
      return res.status(400).json({ error: "System roles cannot be deleted" });
    }

    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        error: `Cannot delete role. ${usersWithRole} user(s) are assigned to it.`,
      });
    }

    await role.deleteOne();
    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
