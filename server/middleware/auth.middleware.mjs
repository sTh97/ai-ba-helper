import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import { hasPermission } from "../utils/permissions.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "ba-helper-dev-secret-change-in-production";

export const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).populate("role");

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorize = (module, action) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!hasPermission(req.user, module, action)) {
    return res.status(403).json({ error: "You do not have permission for this action" });
  }

  next();
};
