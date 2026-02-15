import express from "express";
import { getAdminAnalytics } from "../controllers/analyticsController.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";

const router = express.Router();

router.get("/", requireAdminKey, getAdminAnalytics);

export default router;
