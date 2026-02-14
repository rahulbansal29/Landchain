// backend/controllers/kycController.js

import { getKYCRegistryContract } from "../services/blockchainService.js";
import { ethers } from "ethers";
import { z } from "zod";

const kycStore = new Map();

const cleanWallet = (addr) => {
  if (!addr) throw new Error("Wallet is required");
  return ethers.getAddress(addr.trim());
};

const submitSchema = z.object({
  wallet: z.string().min(10),
  metadata: z.record(z.any()).optional(),
});

export const submitKYC = async (req, res) => {
  try {
    const payload = submitSchema.parse(req.body || {});
    const wallet = cleanWallet(payload.wallet);

    kycStore.set(wallet, {
      status: "PENDING",
      metadata: payload.metadata || {},
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      wallet,
      status: "PENDING",
      message: "KYC submitted. Waiting for admin approval.",
    });
  } catch (err) {
    console.error("submitKYC error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const checkKYCStatus = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const kycRegistry = getKYCRegistryContract();
    const isApproved = await kycRegistry.isKYCApproved(wallet);
    const local = kycStore.get(wallet);

    return res.json({
      wallet,
      isApproved,
      localStatus: local?.status || "NONE",
      lastUpdated: local?.updatedAt || null,
    });
  } catch (err) {
    console.error("checkKYCStatus error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const approveKYCOnChain = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    const kycRegistry = getKYCRegistryContract();

    const tx = await kycRegistry.approveKYC(wallet);
    await tx.wait();

    kycStore.set(wallet, {
      status: "APPROVED",
      metadata: kycStore.get(wallet)?.metadata || {},
      updatedAt: new Date().toISOString(),
    });

    return res.json({ wallet, txHash: tx.hash, status: "APPROVED" });
  } catch (err) {
    console.error("approveKYCOnChain error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const revokeKYCOnChain = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    const kycRegistry = getKYCRegistryContract();

    const tx = await kycRegistry.revokeKYC(wallet);
    await tx.wait();

    kycStore.set(wallet, {
      status: "REVOKED",
      metadata: kycStore.get(wallet)?.metadata || {},
      updatedAt: new Date().toISOString(),
    });

    return res.json({ wallet, txHash: tx.hash, status: "REVOKED" });
  } catch (err) {
    console.error("revokeKYCOnChain error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getPendingKYC = async (req, res) => {
  try {
    const applications = Array.from(kycStore.entries())
      .filter(([, entry]) => entry.status === "PENDING")
      .map(([wallet, entry]) => ({
        wallet,
        status: entry.status,
        metadata: entry.metadata || {},
        updatedAt: entry.updatedAt || null,
      }));

    return res.json({ applications });
  } catch (err) {
    console.error("getPendingKYC error:", err);
    return res.status(400).json({ error: err.message });
  }
};


