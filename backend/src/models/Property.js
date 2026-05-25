import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  propertyId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  address: { type: String, default: '' },
  description: { type: String, default: '' },
  totalValue: { type: Number, default: 0 },
  totalTokens: { type: Number, required: true },
  tokenPrice: { type: Number, required: true },
  tokensAvailable: { type: Number, required: true },
  status: { type: String, enum: ['ACTIVE', 'SOLD_OUT'], default: 'ACTIVE' },
  metadataURI: { type: String, default: '' },
  tokenAddress: { type: String, default: '' },
  tokenName: { type: String, default: '' },
  tokenSymbol: { type: String, default: '' },
  deploymentTxHash: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

PropertySchema.methods.toAPI = function toAPI() {
  const tokensSold = this.totalTokens - this.tokensAvailable;
  return {
    id: this.propertyId,
    name: this.name,
    address: this.address,
    description: this.description,
    totalValue: this.totalValue,
    totalTokens: this.totalTokens,
    tokenPrice: this.tokenPrice,
    tokensAvailable: this.tokensAvailable,
    status: this.status,
    metadataURI: this.metadataURI,
    tokenAddress: this.tokenAddress,
    tokenName: this.tokenName,
    tokenSymbol: this.tokenSymbol,
    deploymentTxHash: this.deploymentTxHash,
    createdAt: this.createdAt?.toISOString?.() || this.createdAt,
    tokensSold,
    percentageFunded: this.totalTokens ? (tokensSold / this.totalTokens) * 100 : 0,
    ownershipPerToken: this.totalTokens
      ? (100 / this.totalTokens).toFixed(4)
      : '0',
  };
};

export default mongoose.model('Property', PropertySchema);
