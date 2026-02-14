import express from "express";
import {
	buyTokens,
	getBalance,
	getTokenInfo,
	requestPurchase,
	getPendingPurchases,
	mintPurchase,
	getInvestmentsByWallet,
	getInvestorsSummary,
} from "../controllers/tokenController.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";

const router = express.Router();

// Buy tokens (mints on-chain from backend wallet)
router.post("/buy", requireAdminKey, buyTokens);
router.post("/request", requestPurchase);
router.get("/purchases/pending", requireAdminKey, getPendingPurchases);
router.post("/mint", requireAdminKey, mintPurchase);
router.get("/investments/:wallet", getInvestmentsByWallet);
router.get("/investors", requireAdminKey, getInvestorsSummary);
router.get("/balance/:wallet", getBalance);
router.get("/info", getTokenInfo);

export default router;
