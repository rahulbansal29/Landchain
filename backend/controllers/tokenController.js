import { ethers } from 'ethers';
import { z } from 'zod';
import Purchase from '../src/models/Purchase.js';
import { getNextSequence } from '../src/models/Counter.js';
import { findPropertyById } from './propertyController.js';
import { isWalletKYCApproved } from './KYCController.js';
import {
  initBlockchain,
  isBlockchainReady,
  mintTokensOnChain,
} from '../services/blockchainService.js';

const buySchema = z.object({
  wallet: z.string().min(10),
  propertyId: z.number().int().positive(),
  tokens: z.number().int().positive(),
});

const cleanWallet = (addr) => {
  if (!addr) throw new Error('Wallet is required');
  return ethers.getAddress(String(addr).trim()).toLowerCase();
};

const withProperty = (purchase, property) => {
  if (!property) return { ...purchase, property: null };
  const api = property.toAPI ? property.toAPI() : property;
  return {
    ...purchase,
    property: {
      id: api.id,
      name: api.name,
      address: api.address,
      tokenPrice: api.tokenPrice,
      totalTokens: api.totalTokens,
      status: api.status,
    },
  };
};

const purchaseToAPI = (doc) => ({
  id: doc.purchaseId,
  wallet: doc.wallet,
  propertyId: doc.propertyId,
  tokens: doc.tokens,
  tokenPrice: doc.tokenPrice,
  moneyAmount: doc.moneyAmount,
  status: doc.status,
  isKYCApproved: doc.isKYCApproved,
  txHash: doc.txHash,
  createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
  mintedAt: doc.mintedAt?.toISOString?.() || doc.mintedAt || null,
});

const getPendingTokensForProperty = async (propertyId) => {
  const pending = await Purchase.find({ propertyId, status: 'PENDING' });
  return pending.reduce((sum, item) => sum + item.tokens, 0);
};

const buildHoldings = async (wallet) => {
  const minted = await Purchase.find({ wallet, status: 'MINTED' });
  const holdings = new Map();

  for (const item of minted) {
    const current = holdings.get(item.propertyId) || {
      propertyId: item.propertyId,
      tokensHeld: 0,
      totalInvested: 0,
    };
    current.tokensHeld += item.tokens;
    current.totalInvested += item.moneyAmount;
    holdings.set(item.propertyId, current);
  }

  const result = [];
  for (const holding of holdings.values()) {
    const property = await findPropertyById(holding.propertyId);
    const api = property?.toAPI?.();
    const ownershipPercent = api?.totalTokens
      ? (holding.tokensHeld / api.totalTokens) * 100
      : 0;
    result.push({
      ...holding,
      ownershipPercent,
      property: api || null,
    });
  }
  return result;
};

const finalizeMint = async (property, purchase, wallet) => {
  let txHash = purchase.txHash || '';

  initBlockchain();
  if (isBlockchainReady() && property.tokenAddress) {
    txHash = await mintTokensOnChain(property.tokenAddress, wallet, purchase.tokens);
  }

  property.tokensAvailable -= purchase.tokens;
  if (property.tokensAvailable <= 0) {
    property.status = 'SOLD_OUT';
    property.tokensAvailable = 0;
  }
  await property.save();

  purchase.status = 'MINTED';
  purchase.isKYCApproved = true;
  purchase.txHash = txHash;
  purchase.mintedAt = new Date();
  await purchase.save();

  return txHash;
};

export const buyTokens = async (req, res) => {
  try {
    const payload = buySchema.parse({
      wallet: String(req.body.wallet || ''),
      propertyId: Number(req.body.propertyId),
      tokens: Number(req.body.tokens),
    });

    const wallet = cleanWallet(payload.wallet);
    const property = await findPropertyById(payload.propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Property is not available' });
    }

    if (payload.tokens > property.tokensAvailable) {
      return res.status(400).json({
        error: `Only ${property.tokensAvailable} tokens available`,
      });
    }

    const kycOk = await isWalletKYCApproved(wallet);
    if (!kycOk) {
      return res.status(403).json({ error: 'KYC not approved' });
    }

    const purchaseId = await getNextSequence('purchase');
    const purchase = await Purchase.create({
      purchaseId,
      wallet,
      propertyId: property.propertyId,
      tokens: payload.tokens,
      tokenPrice: property.tokenPrice,
      moneyAmount: payload.tokens * property.tokenPrice,
      status: 'PENDING',
      isKYCApproved: true,
    });

    const txHash = await finalizeMint(property, purchase, wallet);

    return res.json({
      wallet,
      propertyId: property.propertyId,
      tokensMinted: payload.tokens,
      tokenPrice: property.tokenPrice,
      totalCost: purchase.moneyAmount,
      txHash,
    });
  } catch (err) {
    console.error('buyTokens error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const requestPurchase = async (req, res) => {
  try {
    const payload = buySchema.parse({
      wallet: String(req.body.wallet || ''),
      propertyId: Number(req.body.propertyId),
      tokens: Number(req.body.tokens),
    });

    const wallet = cleanWallet(payload.wallet);
    const property = await findPropertyById(payload.propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Property is not available' });
    }

    const pendingTokens = await getPendingTokensForProperty(property.propertyId);
    const available = property.tokensAvailable - pendingTokens;
    if (payload.tokens > available) {
      return res.status(400).json({
        error: `Only ${available} tokens available after pending requests`,
      });
    }

    const isKYCApproved = await isWalletKYCApproved(wallet);
    const purchaseId = await getNextSequence('purchase');

    const purchase = await Purchase.create({
      purchaseId,
      wallet,
      propertyId: property.propertyId,
      tokens: payload.tokens,
      tokenPrice: property.tokenPrice,
      moneyAmount: payload.tokens * property.tokenPrice,
      status: 'PENDING',
      isKYCApproved,
    });

    return res.json({
      message: 'Purchase request submitted',
      purchase: withProperty(purchaseToAPI(purchase), property),
    });
  } catch (err) {
    console.error('requestPurchase error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getPendingPurchases = async (req, res) => {
  try {
    const pending = await Purchase.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    const list = [];
    for (const item of pending) {
      const property = await findPropertyById(item.propertyId);
      list.push(withProperty(purchaseToAPI(item), property));
    }
    return res.json({ purchases: list });
  } catch (err) {
    console.error('getPendingPurchases error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const mintPurchase = async (req, res) => {
  try {
    const purchaseId = Number(req.body.purchaseId);
    if (!purchaseId) {
      return res.status(400).json({ error: 'purchaseId is required' });
    }

    const purchase = await Purchase.findOne({ purchaseId });
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status !== 'PENDING') {
      return res.status(400).json({ error: 'Purchase is not pending' });
    }

    const property = await findPropertyById(purchase.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Property is not available' });
    }

    if (purchase.tokens > property.tokensAvailable) {
      return res.status(400).json({
        error: `Only ${property.tokensAvailable} tokens available`,
      });
    }

    const kycOk = await isWalletKYCApproved(purchase.wallet);
    if (!kycOk) {
      return res.status(403).json({ error: 'KYC not approved' });
    }

    await finalizeMint(property, purchase, purchase.wallet);

    return res.json({
      message: 'Tokens minted',
      purchase: withProperty(purchaseToAPI(purchase), property),
    });
  } catch (err) {
    console.error('mintPurchase error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getInvestmentsByWallet = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const holdings = await buildHoldings(wallet);
    return res.json({ wallet, holdings });
  } catch (err) {
    console.error('getInvestmentsByWallet error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getInvestorsSummary = async (req, res) => {
  try {
    const minted = await Purchase.find({ status: 'MINTED' });
    const walletMap = new Map();

    for (const item of minted) {
      const entry = walletMap.get(item.wallet) || {
        wallet: item.wallet,
        totalTokens: 0,
        totalInvested: 0,
      };
      entry.totalTokens += item.tokens;
      entry.totalInvested += item.moneyAmount;
      walletMap.set(item.wallet, entry);
    }

    const investors = [];
    for (const entry of walletMap.values()) {
      investors.push({
        ...entry,
        holdings: await buildHoldings(entry.wallet),
      });
    }

    return res.json({ investors });
  } catch (err) {
    console.error('getInvestorsSummary error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getBalance = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const propertyId = Number(req.query.propertyId);

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId query parameter is required' });
    }

    const property = await findPropertyById(propertyId);
    if (!property?.tokenAddress) {
      const minted = await Purchase.aggregate([
        { $match: { wallet, propertyId, status: 'MINTED' } },
        { $group: { _id: null, total: { $sum: '$tokens' } } },
      ]);
      const total = minted[0]?.total || 0;
      return res.json({ wallet, propertyId, balance: String(total), source: 'database' });
    }

    initBlockchain();
    if (!isBlockchainReady()) {
      return res.status(503).json({ error: 'Blockchain not configured' });
    }

    const { getSPVTokenContract, getTokenDecimals } = await import('../services/blockchainService.js');
    const token = getSPVTokenContract(property.tokenAddress);
    const balance = await token.balanceOf(ethers.getAddress(wallet));
    const decimals = await getTokenDecimals(property.tokenAddress);

    return res.json({
      wallet,
      propertyId,
      balance: ethers.formatUnits(balance, decimals),
      source: 'chain',
    });
  } catch (err) {
    console.error('getBalance error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getTokenInfo = async (req, res) => {
  try {
    const propertyId = Number(req.query.propertyId);

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId query parameter is required' });
    }

    const property = await findPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!property.tokenAddress) {
      return res.json({
        propertyId,
        tokenAddress: '',
        name: property.tokenName,
        symbol: property.tokenSymbol,
        totalSupply: String(property.totalTokens - property.tokensAvailable),
        decimals: 0,
        source: 'database',
      });
    }

    initBlockchain();
    if (!isBlockchainReady()) {
      return res.status(503).json({ error: 'Blockchain not configured' });
    }

    const { getSPVTokenContract, getTokenDecimals } = await import('../services/blockchainService.js');
    const token = getSPVTokenContract(property.tokenAddress);
    const name = await token.name();
    const symbol = await token.symbol();
    const supply = await token.totalSupply();
    const decimals = await getTokenDecimals(property.tokenAddress);

    return res.json({
      propertyId,
      tokenAddress: property.tokenAddress,
      name,
      symbol,
      totalSupply: ethers.formatUnits(supply, decimals),
      decimals,
      source: 'chain',
    });
  } catch (err) {
    console.error('getTokenInfo error:', err);
    return res.status(400).json({ error: err.message });
  }
};
