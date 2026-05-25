import mongoose from 'mongoose';

const KYCSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REVOKED'], default: 'PENDING' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

KYCSchema.pre('save', function preSave(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('KYC', KYCSchema);
