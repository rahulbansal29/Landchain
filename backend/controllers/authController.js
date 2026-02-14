import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

const adminWallets = (process.env.ADMIN_WALLETS || process.env.ADMIN_WALLET || "")
  .split(",")
  .map((wallet) => wallet.trim().toLowerCase())
  .filter(Boolean);

const nonceStore = new Map();
const NONCE_TTL_MS = 10 * 60 * 1000;

const cleanWallet = (addr) => {
  if (!addr) throw new Error("Wallet is required");
  return ethers.getAddress(String(addr).trim());
};

const isExpired = (issuedAt) => {
  if (!issuedAt) return true;
  const timestamp = new Date(issuedAt).getTime();
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > NONCE_TTL_MS;
};

export const getNonce = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    const nonce = crypto.randomBytes(16).toString("hex");
    const issuedAt = new Date().toISOString();

    nonceStore.set(wallet, { nonce, issuedAt });

    return res.json({ wallet, nonce, issuedAt });
  } catch (err) {
    console.error("getNonce error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const verifySignature = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    const signature = req.body.signature;

    if (!signature) {
      return res.status(400).json({ error: "Signature is required" });
    }

    const entry = nonceStore.get(wallet);
    if (!entry || !entry.nonce || !entry.issuedAt) {
      return res.status(400).json({ error: "Nonce not found. Request a new nonce." });
    }

    if (isExpired(entry.issuedAt)) {
      nonceStore.delete(wallet);
      return res.status(400).json({ error: "Nonce expired. Request a new nonce." });
    }

    const message = [
      "LandChain login",
      `Wallet: ${wallet}`,
      `Nonce: ${entry.nonce}`,
      `Issued At: ${entry.issuedAt}`,
    ].join("\n");

    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    nonceStore.delete(wallet);

    const role = adminWallets.includes(wallet.toLowerCase()) ? "admin" : "user";
    const token = jwt.sign(
      { type: "user_session", wallet, role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ token, wallet, role });
  } catch (err) {
    console.error("verifySignature error:", err);
    return res.status(400).json({ error: err.message });
  }
};
