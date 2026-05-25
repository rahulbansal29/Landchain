import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  purchaseId: { type: Number, required: true, unique: true, index: true },
  wallet: { type: String, required: true, lowercase: true, index: true },
  propertyId: { type: Number, required: true, index: true },
  tokens: { type: Number, required: true },
  tokenPrice: { type: Number, required: true },
  moneyAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'MINTED'], default: 'PENDING' },
  isKYCApproved: { type: Boolean, default: false },
  txHash: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  mintedAt: { type: Date },
});

export default mongoose.model('Purchase', PurchaseSchema);
