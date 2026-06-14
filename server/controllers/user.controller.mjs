import User from "../models/user.model.mjs";
import Role from "../models/role.model.mjs";
import {
  buildOwnerFilter,
  canAccessResource,
  hasDataAccessAll,
} from "../utils/permissions.mjs";
import { validateAllowedLlms } from "../utils/llmAccess.mjs";
import { listAvailableModels } from "../constants/llmCatalog.mjs";

const validateUserLlmsAgainstRole = (userLlms, role) => {
  const normalized = validateAllowedLlms(userLlms);
  const roleLlms = role?.allowedLlms || [];
  if (roleLlms.length === 0 || normalized.length === 0) return normalized;

  const roleSet = new Set(roleLlms);
  const invalid = normalized.filter((id) => !roleSet.has(id));
  if (invalid.length > 0) {
    throw new Error(`LLM(s) not allowed for this role: ${invalid.join(", ")}`);
  }
  return normalized;
};

export const getLlmCatalog = async (_req, res) => {
  res.json(listAvailableModels());
};

export const getAllUsers = async (req, res) => {
  try {
    const filter = buildOwnerFilter(req.user, "users");
    const users = await User.find(filter)
      .populate("role", "name allowedLlms")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role")
      .select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      !hasDataAccessAll(req.user, "users") &&
      user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, roleId, allowedLlms } = req.body;

    if (!firstName?.trim() || !email?.trim() || !password || !roleId) {
      return res.status(400).json({
        error: "First name, email, password, and role are required",
      });
    }

    const role = await Role.findById(roleId);
    if (!role) return res.status(400).json({ error: "Invalid role" });

    let normalizedLlms = [];
    if (allowedLlms !== undefined) {
      normalizedLlms = validateUserLlmsAgainstRole(allowedLlms, role);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      email: email.toLowerCase().trim(),
      password,
      role: roleId,
      allowedLlms: normalizedLlms,
      createdBy: req.user._id,
    });

    const populated = await User.findById(user._id)
      .populate("role", "name allowedLlms")
      .select("-password");

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!canAccessResource(req.user, "users", user)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { firstName, lastName, email, password, roleId, isActive, allowedLlms } = req.body;

    if (firstName?.trim()) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName?.trim() || "";

    if (email?.trim() && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }
      user.email = email.toLowerCase().trim();
    }

    if (password) user.password = password;

    if (roleId && hasDataAccessAll(req.user, "users")) {
      const role = await Role.findById(roleId);
      if (!role) return res.status(400).json({ error: "Invalid role" });
      user.role = roleId;
      if (user.allowedLlms?.length) {
        user.allowedLlms = validateUserLlmsAgainstRole(user.allowedLlms, role);
      }
    }

    if (allowedLlms !== undefined && hasDataAccessAll(req.user, "users")) {
      const role = await Role.findById(user.role);
      user.allowedLlms = validateUserLlmsAgainstRole(allowedLlms, role);
    }

    if (isActive !== undefined && hasDataAccessAll(req.user, "users")) {
      if (user._id.toString() === req.user._id.toString() && !isActive) {
        return res.status(400).json({ error: "You cannot deactivate your own account" });
      }
      user.isActive = isActive;
    }

    await user.save();

    const populated = await User.findById(user._id)
      .populate("role", "name allowedLlms")
      .select("-password");

    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!canAccessResource(req.user, "users", user)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
