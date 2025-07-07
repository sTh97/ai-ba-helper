// server/routes/dashboard.routes.js or dashboard.routes.mjs

import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.mjs";

const router = express.Router();

router.get("/stats", getDashboardStats);

export default router;
