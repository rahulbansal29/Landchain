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
	getQuote,
	buyTokensOnChain,
} from "../controllers/tokenController.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";

const router = express.Router();

// Buy tokens (mints on-chain from backend wallet)
router.post("/buy", requireAdminKey, buyTokens);
router.post("/request", requestPurchase);
// Self-service paid purchase: get price, then confirm after paying ETH
router.get("/quote", getQuote);
router.post("/buy-onchain", buyTokensOnChain);
router.get("/purchases/pending", requireAdminKey, getPendingPurchases);
router.post("/mint", requireAdminKey, mintPurchase);
router.get("/investments/:wallet", getInvestmentsByWallet);
router.get("/investors", requireAdminKey, getInvestorsSummary);
router.get("/balance/:wallet", getBalance);
router.get("/info", getTokenInfo);

export default router;
