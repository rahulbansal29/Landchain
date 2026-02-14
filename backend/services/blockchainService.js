// backend/services/blockchainService.js
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// file path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust if your Foundry project lives elsewhere
const spvTokenPath = path.join(
  __dirname,
  "../../foundry/out/SPVToken.sol/SPVToken.json"
);
const kycRegistryPath = path.join(
  __dirname,
  "../../foundry/out/KYCRegistry.sol/KYCRegistry.json"
);

// Ensure ABI files exist
if (!fs.existsSync(spvTokenPath)) {
  throw new Error(`❌ Missing SPVToken ABI at ${spvTokenPath}. Run 'forge build' in the foundry folder.`);
}
if (!fs.existsSync(kycRegistryPath)) {
  throw new Error(`❌ Missing KYCRegistry ABI at ${kycRegistryPath}. Run 'forge build' in the foundry folder.`);
}

// Load ABIs
const SPVTokenJSON = JSON.parse(fs.readFileSync(spvTokenPath, "utf8"));
const KYCRegistryJSON = JSON.parse(fs.readFileSync(kycRegistryPath, "utf8"));
const SPVTokenABI = SPVTokenJSON.abi;
const SPVTokenBytecode = SPVTokenJSON.bytecode;
const KYCRegistryABI = KYCRegistryJSON.abi;

// Env
const providerUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY;
const spvTokenAddress = process.env.SPV_TOKEN_ADDRESS;
const kycRegistryAddress = process.env.KYC_REGISTRY_ADDRESS;

// Validate critical envs
if (!privateKey) throw new Error("❌ PRIVATE_KEY missing in .env file");
if (!kycRegistryAddress) console.warn("⚠️ KYC_REGISTRY_ADDRESS not set in .env — set after deployment");

// Explicit provider setup for local network (prevents ENS lookups)
const provider = new ethers.JsonRpcProvider(providerUrl, {
  name: "anvil",
  chainId: 31337,
});

// Connect wallet
const wallet = new ethers.Wallet(privateKey, provider);

// Helper to safely create contract instances
const safeContract = (address, abi) => {
  if (!address || !ethers.isAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
  return new ethers.Contract(address, abi, wallet);
};

// Exported factory functions
export const getSPVTokenContract = (tokenAddress) => safeContract(tokenAddress, SPVTokenABI);

export const getKYCRegistryContract = () => safeContract(kycRegistryAddress, KYCRegistryABI);

const decimalsCache = new Map();
export const getTokenDecimals = async (tokenAddress) => {
  if (decimalsCache.has(tokenAddress)) {
    return decimalsCache.get(tokenAddress);
  }
  const token = getSPVTokenContract(tokenAddress);
  const decimals = Number(await token.decimals());
  decimalsCache.set(tokenAddress, decimals);
  return decimals;
};

/**
 * Deploy a new SPVToken contract for a property
 * @param {string} name - Token name (e.g., "Luxury Villa Token")
 * @param {string} symbol - Token symbol (e.g., "LVT")
 * @returns {Promise<{address: string, txHash: string}>}
 */
export const deploySPVToken = async (name, symbol) => {
  try {
    if (!kycRegistryAddress) {
      throw new Error("KYC_REGISTRY_ADDRESS not set in .env");
    }

    const admin = wallet.address;
    const factory = new ethers.ContractFactory(SPVTokenABI, SPVTokenBytecode, wallet);
    
    console.log(`🚀 Deploying SPVToken: ${name} (${symbol})...`);
    const contract = await factory.deploy(name, symbol, kycRegistryAddress, admin);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();
    
    console.log(`✅ SPVToken deployed at: ${address}`);
    
    return {
      address,
      txHash: deployTx?.hash || "",
    };
  } catch (err) {
    console.error("deploySPVToken error:", err);
    throw err;
  }
};

// Exports for reuse
export {
  provider,
  wallet,
  SPVTokenABI,
  KYCRegistryABI,
};
