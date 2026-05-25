import { ethers } from 'ethers';
import { z } from 'zod';
import KYC from '../src/models/KYC.js';
import {
  approveKYCOnChain as approveKYCChain,
  revokeKYCOnChain as revokeKYCChain,
  isKYCApprovedOnChain,
  initBlockchain,
  isBlockchainReady,
} from '../services/blockchainService.js';

const cleanWallet = (addr) => {
  if (!addr) throw new Error('Wallet is required');
  return ethers.getAddress(String(addr).trim()).toLowerCase();
};

const submitSchema = z.object({
  wallet: z.string().min(10),
  metadata: z.record(z.any()).optional(),
});

export const submitKYC = async (req, res) => {
  try {
    const payload = submitSchema.parse(req.body || {});
    const wallet = cleanWallet(payload.wallet);

    const doc = await KYC.findOneAndUpdate(
      { walletAddress: wallet },
      {
        walletAddress: wallet,
        status: 'PENDING',
        metadata: payload.metadata || {},
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({
      wallet: doc.walletAddress,
      status: doc.status,
      message: 'KYC submitted. Waiting for admin approval.',
    });
  } catch (err) {
    console.error('submitKYC error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const checkKYCStatus = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const local = await KYC.findOne({ walletAddress: wallet });

    initBlockchain();
    const onChainApproved = isBlockchainReady()
      ? await isKYCApprovedOnChain(ethers.getAddress(wallet))
      : local?.status === 'APPROVED';

    return res.json({
      wallet,
      isApproved: onChainApproved || local?.status === 'APPROVED',
      localStatus: local?.status || 'NONE',
      lastUpdated: local?.updatedAt?.toISOString?.() || null,
    });
  } catch (err) {
    console.error('checkKYCStatus error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const approveKYCOnChain = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    let txHash = '';

    initBlockchain();
    if (isBlockchainReady()) {
      txHash = await approveKYCChain(wallet);
    }

    const doc = await KYC.findOneAndUpdate(
      { walletAddress: wallet },
      { status: 'APPROVED', updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({
      wallet: doc.walletAddress,
      txHash,
      status: doc.status,
    });
  } catch (err) {
    console.error('approveKYC error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const revokeKYCOnChain = async (req, res) => {
  try {
    const wallet = cleanWallet(req.body.wallet);
    let txHash = '';

    initBlockchain();
    if (isBlockchainReady()) {
      txHash = await revokeKYCChain(wallet);
    }

    const doc = await KYC.findOneAndUpdate(
      { walletAddress: wallet },
      { status: 'REVOKED', updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({
      wallet: doc.walletAddress,
      txHash,
      status: doc.status,
    });
  } catch (err) {
    console.error('revokeKYC error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getPendingKYC = async (req, res) => {
  try {
    const docs = await KYC.find({ status: 'PENDING' }).sort({ updatedAt: -1 });
    const applications = docs.map((doc) => ({
      wallet: doc.walletAddress,
      status: doc.status,
      metadata: doc.metadata || {},
      updatedAt: doc.updatedAt?.toISOString?.() || null,
    }));

    return res.json({ applications });
  } catch (err) {
    console.error('getPendingKYC error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export async function isWalletKYCApproved(wallet) {
  const normalized = cleanWallet(wallet);
  const local = await KYC.findOne({ walletAddress: normalized });
  if (local?.status === 'APPROVED') return true;

  initBlockchain();
  if (isBlockchainReady()) {
    return isKYCApprovedOnChain(ethers.getAddress(normalized));
  }
  return false;
}
