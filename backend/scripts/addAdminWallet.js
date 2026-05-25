/**
 * Grant admin access to a wallet address.
 * Usage: node scripts/addAdminWallet.js 0xYourWalletAddress
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../src/db.js';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const wallet = process.argv[2]?.trim();

if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
  console.error('Usage: node scripts/addAdminWallet.js 0xYourWalletAddress');
  console.error('Copy your address from MetaMask (Account details → copy).');
  process.exit(1);
}

async function main() {
  await connectDB();
  const normalized = wallet.toLowerCase();

  await User.findOneAndUpdate(
    { walletAddress: normalized },
    { walletAddress: normalized, role: 'admin' },
    { upsert: true, returnDocument: 'after' }
  );

  console.log('Admin role set in database for:', normalized);
  console.log('');
  console.log('Also add this line to backend/.env (comma-separated if multiple):');
  console.log(`ADMIN_WALLETS=...,${wallet}`);
  console.log('');
  console.log('Restart the backend, then in the app: Connect wallet → Approve in MetaMask.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
