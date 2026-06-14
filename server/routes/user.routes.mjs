import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("users", "read"), getAllUsers);
router.get("/:id", authorize("users", "read"), getUserById);
router.post("/", authorize("users", "create"), createUser);
router.put("/:id", authorize("users", "update"), updateUser);
router.delete("/:id", authorize("users", "delete"), deleteUser);

export default router;
