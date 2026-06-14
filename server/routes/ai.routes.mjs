import express from "express";
import { enhanceStory, generateUI } from "../controllers/ai.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";

const router = express.Router();

router.use(authenticate);

router.post("/enhance", authorize("ai", "create"), enhanceStory);
router.post("/generate-ui", authorize("ai", "create"), generateUI);

export default router;
