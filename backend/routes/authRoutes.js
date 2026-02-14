import express from "express";
import { getNonce, verifySignature } from "../controllers/authController.js";

const router = express.Router();

router.post("/nonce", getNonce);
router.post("/verify", verifySignature);

export default router;
