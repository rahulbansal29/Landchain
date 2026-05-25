import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../src/db.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  try {
    await connectDB();

    let adminWallet = process.env.ADMIN_WALLET;
    if (!adminWallet && process.env.ADMIN_WALLETS) {
      adminWallet = process.env.ADMIN_WALLETS.split(',')[0].trim();
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!adminWallet) {
      console.error('Set ADMIN_WALLET or ADMIN_WALLETS in backend/.env');
      process.exit(1);
    }

    const normalized = adminWallet.toLowerCase();
    const existing = await User.findOne({ walletAddress: normalized });

    if (existing?.password) {
      console.log('Admin already exists:', existing.walletAddress);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.findOneAndUpdate(
      { walletAddress: normalized },
      { walletAddress: normalized, password: hashed, role: 'admin' },
      { upsert: true, returnDocument: 'after' }
    );

    console.log('Admin user ready:', normalized);
    console.log('Password:', adminPassword);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
