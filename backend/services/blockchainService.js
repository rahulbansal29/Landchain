import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spvTokenPath = path.join(__dirname, '../../foundry/out/SPVToken.sol/SPVToken.json');
const kycRegistryPath = path.join(__dirname, '../../foundry/out/KYCRegistry.sol/KYCRegistry.json');

let provider;
let wallet;
let SPVTokenABI;
let SPVTokenBytecode;
let KYCRegistryABI;
let ready = false;
let initError = null;

const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== 'false';

function loadArtifacts() {
  if (!fs.existsSync(spvTokenPath)) {
    throw new Error(`Missing SPVToken ABI. Run: cd foundry && forge build`);
  }
  if (!fs.existsSync(kycRegistryPath)) {
    throw new Error(`Missing KYCRegistry ABI. Run: cd foundry && forge build`);
  }

  const SPVTokenJSON = JSON.parse(fs.readFileSync(spvTokenPath, 'utf8'));
  const KYCRegistryJSON = JSON.parse(fs.readFileSync(kycRegistryPath, 'utf8'));
  SPVTokenABI = SPVTokenJSON.abi;
  SPVTokenBytecode = SPVTokenJSON.bytecode?.object || SPVTokenJSON.bytecode;
  KYCRegistryABI = KYCRegistryJSON.abi;
}

function ensureReady() {
  if (!BLOCKCHAIN_ENABLED) {
    throw new Error('Blockchain is disabled. Set BLOCKCHAIN_ENABLED=true in .env after configuring RPC and contracts.');
  }
  if (!ready) {
    throw initError || new Error('Blockchain service not initialized');
  }
}

export function isBlockchainReady() {
  return ready && BLOCKCHAIN_ENABLED;
}

export function getBlockchainStatus() {
  return {
    enabled: BLOCKCHAIN_ENABLED,
    ready,
    error: initError?.message || null,
  };
}

export async function initBlockchain() {
  if (ready) return true;
  if (!BLOCKCHAIN_ENABLED) {
    initError = new Error('BLOCKCHAIN_ENABLED=false');
    return false;
  }

  try {
    const providerUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const privateKey = process.env.PRIVATE_KEY;
    const kycRegistryAddress = process.env.KYC_REGISTRY_ADDRESS;

    if (!privateKey) throw new Error('PRIVATE_KEY missing in .env');
    if (!kycRegistryAddress) throw new Error('KYC_REGISTRY_ADDRESS missing in .env');

    loadArtifacts();

    provider = new ethers.JsonRpcProvider(providerUrl, {
      name: 'anvil',
      chainId: 31337,
    });
    wallet = new ethers.Wallet(privateKey, provider);

    // Verify local chain is actually running (avoids ECONNREFUSED on deploy)
    await provider.getBlockNumber();

    ready = true;
    initError = null;
    console.log('Blockchain service ready at', providerUrl);
    return true;
  } catch (err) {
    ready = false;
    initError = err;
    console.warn(
      'Blockchain not available (properties/KYC still work in database mode):',
      err.message
    );
    return false;
  }
}

const safeContract = (address, abi) => {
  if (!address || !ethers.isAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
  return new ethers.Contract(address, abi, wallet);
};

export const getSPVTokenContract = (tokenAddress) => {
  ensureReady();
  return safeContract(tokenAddress, SPVTokenABI);
};

export const getKYCRegistryContract = () => {
  ensureReady();
  return safeContract(process.env.KYC_REGISTRY_ADDRESS, KYCRegistryABI);
};

const decimalsCache = new Map();

export const getTokenDecimals = async (tokenAddress) => {
  ensureReady();
  if (decimalsCache.has(tokenAddress)) {
    return decimalsCache.get(tokenAddress);
  }
  const token = getSPVTokenContract(tokenAddress);
  const decimals = Number(await token.decimals());
  decimalsCache.set(tokenAddress, decimals);
  return decimals;
};

export const deploySPVToken = async (name, symbol) => {
  ensureReady();
  const kycRegistryAddress = process.env.KYC_REGISTRY_ADDRESS;
  const admin = wallet.address;
  const factory = new ethers.ContractFactory(SPVTokenABI, SPVTokenBytecode, wallet);

  console.log(`Deploying SPVToken: ${name} (${symbol})...`);
  const contract = await factory.deploy(name, symbol, kycRegistryAddress, admin);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  return {
    address,
    txHash: deployTx?.hash || '',
  };
};

export async function isKYCApprovedOnChain(walletAddress) {
  if (!isBlockchainReady()) return false;
  try {
    const kycRegistry = getKYCRegistryContract();
    return await kycRegistry.isKYCApproved(walletAddress);
  } catch {
    return false;
  }
}

export async function approveKYCOnChain(walletAddress) {
  ensureReady();
  const kycRegistry = getKYCRegistryContract();
  const tx = await kycRegistry.approveKYC(walletAddress);
  await tx.wait();
  return tx.hash;
}

export async function revokeKYCOnChain(walletAddress) {
  ensureReady();
  const kycRegistry = getKYCRegistryContract();
  const tx = await kycRegistry.revokeKYC(walletAddress);
  await tx.wait();
  return tx.hash;
}

export async function mintTokensOnChain(tokenAddress, walletAddress, tokenAmount) {
  ensureReady();
  const spvToken = getSPVTokenContract(tokenAddress);
  const decimals = await getTokenDecimals(tokenAddress);
  const amount = ethers.parseUnits(String(tokenAmount), decimals);
  const tx = await spvToken.mint(walletAddress, amount);
  await tx.wait();
  return tx.hash;
}

export { provider, wallet };
