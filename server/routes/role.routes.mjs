import express from "express";
import {
  getModules,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.get("/modules", authorize("roles", "read"), getModules);
router.get("/", authorize("roles", "read"), getAllRoles);
router.get("/:id", authorize("roles", "read"), getRoleById);
router.post("/", authorize("roles", "create"), createRole);
router.put("/:id", authorize("roles", "update"), updateRole);
router.delete("/:id", authorize("roles", "delete"), deleteRole);

export default router;
