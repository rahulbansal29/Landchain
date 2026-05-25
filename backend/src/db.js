import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/landchain';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(MONGO_URL);
  console.log('MongoDB connected:', MONGO_URL.replace(/\/\/.*@/, '//***@'));
  return mongoose.connection;
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

export default mongoose;
