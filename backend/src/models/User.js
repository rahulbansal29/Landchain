import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
});

export default model('User', UserSchema);
