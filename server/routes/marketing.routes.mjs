import express from "express";
import {
  getProjectStoriesPreview,
  refineMarketingPrompt,
  generateMarketingCollateral,
  getAllCollateral,
  getCollateralById,
  saveCollateral,
  updateCollateral,
  deleteCollateral,
  exportCollateral,
} from "../controllers/marketing.controller.mjs";
import { authenticate, authorize } from "../middleware/auth.middleware.mjs";
import { attachAISelection } from "../middleware/aiSelection.middleware.mjs";

const router = express.Router();

router.use(authenticate);
router.use(attachAISelection);

router.get("/project/:projectId/stories", authorize("marketing", "read"), getProjectStoriesPreview);
router.post("/prompt/refine", authorize("marketing", "create"), refineMarketingPrompt);
router.post("/generate", authorize("marketing", "create"), generateMarketingCollateral);
router.post("/export", authorize("marketing", "read"), exportCollateral);
router.get("/", authorize("marketing", "read"), getAllCollateral);
router.get("/:id", authorize("marketing", "read"), getCollateralById);
router.post("/", authorize("marketing", "create"), saveCollateral);
router.put("/:id", authorize("marketing", "update"), updateCollateral);
router.delete("/:id", authorize("marketing", "delete"), deleteCollateral);

export default router;
