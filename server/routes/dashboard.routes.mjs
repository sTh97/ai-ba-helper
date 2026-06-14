import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.get("/stats", authenticate, authorize("dashboard", "read"), getDashboardStats);

export default router;
