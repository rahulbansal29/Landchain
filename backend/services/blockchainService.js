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
const KYCRegistryABI = KYCRegistryJSON.abi;

// Env
const providerUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY;
const spvTokenAddress = process.env.SPV_TOKEN_ADDRESS;
const kycRegistryAddress = process.env.KYC_REGISTRY_ADDRESS;

// Validate critical envs
if (!privateKey) throw new Error("❌ PRIVATE_KEY missing in .env file");
if (!spvTokenAddress) console.warn("⚠️ SPV_TOKEN_ADDRESS not set in .env — set after deployment");
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
export const getSPVTokenContract = () => safeContract(spvTokenAddress, SPVTokenABI);

export const getKYCRegistryContract = () => safeContract(kycRegistryAddress, KYCRegistryABI);

let cachedDecimals = null;
export const getTokenDecimals = async () => {
  if (cachedDecimals !== null) {
    return cachedDecimals;
  }
  const token = getSPVTokenContract();
  cachedDecimals = Number(await token.decimals());
  return cachedDecimals;
};

// Exports for reuse
export {
  provider,
  wallet,
  SPVTokenABI,
  KYCRegistryABI,
};
