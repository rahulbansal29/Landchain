import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const MONGO_URL = 'mongodb://localhost:27017/landchain';
const envText = fs.readFileSync('./.env', 'utf8');
const m = envText.match(/^ADMIN_WALLETS=(.*)$/m) || envText.match(/^ADMIN_WALLET=(.*)$/m);
const adminWallet = m ? m[1].split(',')[0].trim() : null;
const adminPasswordMatch = envText.match(/^ADMIN_PASSWORD=(.*)$/m);
const adminPassword = (adminPasswordMatch && adminPasswordMatch[1]) ? adminPasswordMatch[1].trim() : 'admin123';

if (!adminWallet) {
  console.error('No admin wallet found in .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({ walletAddress: String, password: String, role: String }, { timestamps: true });
const User = mongoose.model('UserManual', UserSchema);

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to Mongo for manual seed');
  const existing = await User.findOne({ walletAddress: adminWallet.toLowerCase() });
  if (existing) {
    console.log('Admin already exists:', existing.walletAddress);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(adminPassword, 10);
  const u = new User({ walletAddress: adminWallet.toLowerCase(), password: hashed, role: 'admin' });
  await u.save();
  console.log('Created admin:', u.walletAddress);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
