// routes/KYCRoutes.js
import express from "express";
import {
	submitKYC,
	checkKYCStatus,
	approveKYCOnChain,
	revokeKYCOnChain,
	getPendingKYC,
} from "../controllers/KYCController.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";
const router = express.Router();

// Public: submit KYC
router.post("/submit", submitKYC);

// Public: check on-chain KYC status
router.get("/status/:wallet", checkKYCStatus);

// Admin: approve/revoke
router.post("/approve", requireAdminKey, approveKYCOnChain);
router.post("/revoke", requireAdminKey, revokeKYCOnChain);
router.get("/pending", requireAdminKey, getPendingKYC);

export default router;
