import express from "express";
import { login, getMe, changePassword } from "../controllers/auth.controller.mjs";
import { authenticate } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/change-password", authenticate, changePassword);

export default router;
