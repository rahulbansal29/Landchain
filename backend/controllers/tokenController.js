// backend/controllers/tokenController.js

import { getSPVTokenContract, getTokenDecimals, getKYCRegistryContract } from "../services/blockchainService.js";
import { ethers } from "ethers";
import { z } from "zod";
import { getPropertyStore } from "./propertyController.js";

const purchases = [];
let nextPurchaseId = 1;

const buySchema = z.object({
  wallet: z.string().min(10),
  propertyId: z.number().int().positive(),
  tokens: z.number().int().positive(),
});

const cleanWallet = (addr) => {
  if (!addr) throw new Error("Wallet is required");
  return ethers.getAddress(addr.trim());
};

const withProperty = (purchase, property) => {
  if (!property) return { ...purchase, property: null };
  return {
    ...purchase,
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      tokenPrice: property.tokenPrice,
      totalTokens: property.totalTokens,
      status: property.status,
    },
  };
};

const getPendingTokensForProperty = (propertyId) =>
  purchases
    .filter((item) => item.propertyId === propertyId && item.status === "PENDING")
    .reduce((sum, item) => sum + item.tokens, 0);

const buildHoldings = (wallet) => {
  const properties = getPropertyStore();
  const holdings = new Map();

  purchases
    .filter((item) => item.wallet === wallet && item.status === "MINTED")
    .forEach((item) => {
      const current = holdings.get(item.propertyId) || {
        propertyId: item.propertyId,
        tokensHeld: 0,
        totalInvested: 0,
      };
      current.tokensHeld += item.tokens;
      current.totalInvested += item.moneyAmount;
      holdings.set(item.propertyId, current);
    });

  return Array.from(holdings.values()).map((holding) => {
    const property = properties.find((item) => item.id === holding.propertyId);
    const ownershipPercent = property?.totalTokens
      ? (holding.tokensHeld / property.totalTokens) * 100
      : 0;

    return {
      ...holding,
      ownershipPercent,
      property,
    };
  });
};

const recordMintedPurchase = (payload) => {
  const entry = {
    id: nextPurchaseId++,
    wallet: payload.wallet,
    propertyId: payload.propertyId,
    tokens: payload.tokens,
    tokenPrice: payload.tokenPrice,
    moneyAmount: payload.tokens * payload.tokenPrice,
    status: "MINTED",
    isKYCApproved: true,
    createdAt: payload.createdAt || new Date().toISOString(),
    mintedAt: payload.mintedAt || new Date().toISOString(),
    txHash: payload.txHash,
  };
  purchases.push(entry);
  return entry;
};

export const buyTokens = async (req, res) => {
  try {
    const payload = buySchema.parse({
      wallet: String(req.body.wallet || ""),
      propertyId: Number(req.body.propertyId),
      tokens: Number(req.body.tokens),
    });

    const wallet = cleanWallet(payload.wallet);
    const properties = getPropertyStore();
    const property = properties.find((item) => item.id === payload.propertyId);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.status !== "ACTIVE") {
      return res.status(400).json({ error: "Property is not available" });
    }

    if (payload.tokens > property.tokensAvailable) {
      return res.status(400).json({
        error: `Only ${property.tokensAvailable} tokens available`,
      });
    }

    const kycRegistry = getKYCRegistryContract();
    const isKYCApproved = await kycRegistry.isKYCApproved(wallet);
    if (!isKYCApproved) {
      return res.status(403).json({ error: "KYC not approved" });
    }

    const spvToken = getSPVTokenContract();
    const decimals = await getTokenDecimals();
    const amount = ethers.parseUnits(String(payload.tokens), decimals);
    const tx = await spvToken.mint(wallet, amount);
    await tx.wait();

    property.tokensAvailable -= payload.tokens;
    if (property.tokensAvailable <= 0) {
      property.status = "SOLD_OUT";
      property.tokensAvailable = 0;
    }

    const totalCost = payload.tokens * property.tokenPrice;

    recordMintedPurchase({
      wallet,
      propertyId: property.id,
      tokens: payload.tokens,
      tokenPrice: property.tokenPrice,
      txHash: tx.hash,
    });

    return res.json({
      wallet,
      propertyId: property.id,
      tokensMinted: payload.tokens,
      tokenPrice: property.tokenPrice,
      totalCost,
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("buyTokens error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const requestPurchase = async (req, res) => {
  try {
    const payload = buySchema.parse({
      wallet: String(req.body.wallet || ""),
      propertyId: Number(req.body.propertyId),
      tokens: Number(req.body.tokens),
    });

    const wallet = cleanWallet(payload.wallet);
    const properties = getPropertyStore();
    const property = properties.find((item) => item.id === payload.propertyId);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.status !== "ACTIVE") {
      return res.status(400).json({ error: "Property is not available" });
    }

    const pendingTokens = getPendingTokensForProperty(property.id);
    const available = property.tokensAvailable - pendingTokens;
    if (payload.tokens > available) {
      return res.status(400).json({
        error: `Only ${available} tokens available after pending requests`,
      });
    }

    const kycRegistry = getKYCRegistryContract();
    const isKYCApproved = await kycRegistry.isKYCApproved(wallet);

    const purchase = {
      id: nextPurchaseId++,
      wallet,
      propertyId: property.id,
      tokens: payload.tokens,
      tokenPrice: property.tokenPrice,
      moneyAmount: payload.tokens * property.tokenPrice,
      status: "PENDING",
      isKYCApproved,
      createdAt: new Date().toISOString(),
    };

    purchases.push(purchase);

    return res.json({
      message: "Purchase request submitted",
      purchase: withProperty(purchase, property),
    });
  } catch (err) {
    console.error("requestPurchase error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getPendingPurchases = async (req, res) => {
  try {
    const properties = getPropertyStore();
    const list = purchases
      .filter((item) => item.status === "PENDING")
      .map((item) => withProperty(item, properties.find((p) => p.id === item.propertyId)));

    return res.json({ purchases: list });
  } catch (err) {
    console.error("getPendingPurchases error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const mintPurchase = async (req, res) => {
  try {
    const purchaseId = Number(req.body.purchaseId);
    if (!purchaseId) {
      return res.status(400).json({ error: "purchaseId is required" });
    }

    const purchase = purchases.find((item) => item.id === purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (purchase.status !== "PENDING") {
      return res.status(400).json({ error: "Purchase is not pending" });
    }

    const properties = getPropertyStore();
    const property = properties.find((item) => item.id === purchase.propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.status !== "ACTIVE") {
      return res.status(400).json({ error: "Property is not available" });
    }

    if (purchase.tokens > property.tokensAvailable) {
      return res.status(400).json({
        error: `Only ${property.tokensAvailable} tokens available`,
      });
    }

    const kycRegistry = getKYCRegistryContract();
    const isKYCApproved = await kycRegistry.isKYCApproved(purchase.wallet);
    if (!isKYCApproved) {
      return res.status(403).json({ error: "KYC not approved" });
    }

    const spvToken = getSPVTokenContract();
    const decimals = await getTokenDecimals();
    const amount = ethers.parseUnits(String(purchase.tokens), decimals);
    const tx = await spvToken.mint(purchase.wallet, amount);
    await tx.wait();

    property.tokensAvailable -= purchase.tokens;
    if (property.tokensAvailable <= 0) {
      property.status = "SOLD_OUT";
      property.tokensAvailable = 0;
    }

    purchase.status = "MINTED";
    purchase.isKYCApproved = true;
    purchase.txHash = tx.hash;
    purchase.mintedAt = new Date().toISOString();

    return res.json({
      message: "Tokens minted",
      purchase: withProperty(purchase, property),
    });
  } catch (err) {
    console.error("mintPurchase error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getInvestmentsByWallet = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const holdings = buildHoldings(wallet);
    return res.json({ wallet, holdings });
  } catch (err) {
    console.error("getInvestmentsByWallet error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getInvestorsSummary = async (req, res) => {
  try {
    const walletMap = new Map();

    purchases
      .filter((item) => item.status === "MINTED")
      .forEach((item) => {
        const entry = walletMap.get(item.wallet) || {
          wallet: item.wallet,
          totalTokens: 0,
          totalInvested: 0,
        };
        entry.totalTokens += item.tokens;
        entry.totalInvested += item.moneyAmount;
        walletMap.set(item.wallet, entry);
      });

    const investors = Array.from(walletMap.values()).map((entry) => ({
      ...entry,
      holdings: buildHoldings(entry.wallet),
    }));

    return res.json({ investors });
  } catch (err) {
    console.error("getInvestorsSummary error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getBalance = async (req, res) => {
  try {
    const wallet = cleanWallet(req.params.wallet);
    const token = getSPVTokenContract();

    const balance = await token.balanceOf(wallet);
    const decimals = await getTokenDecimals();

    return res.json({
      wallet,
      balance: ethers.formatUnits(balance, decimals),
    });
  } catch (err) {
    console.error("getBalance error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getTokenInfo = async (req, res) => {
  try {
    const token = getSPVTokenContract();

    const name = await token.name();
    const symbol = await token.symbol();
    const supply = await token.totalSupply();
    const decimals = await getTokenDecimals();

    return res.json({
      name,
      symbol,
      totalSupply: ethers.formatUnits(supply, decimals),
      decimals,
    });
  } catch (err) {
    console.error("getTokenInfo error:", err);
    return res.status(400).json({ error: err.message });
  }
};
