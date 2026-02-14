import express from "express";
import { adminLogin, verifyAdminSession } from "../controllers/adminAuthController.js";

const router = express.Router();

// Admin password login
router.post("/login", adminLogin);

// Verify admin session
router.get("/verify", verifyAdminSession);

export default router;
