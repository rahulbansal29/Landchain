import { z } from 'zod';
import Property from '../src/models/Property.js';
import { getNextSequence } from '../src/models/Counter.js';
import { deploySPVToken, initBlockchain, isBlockchainReady } from '../services/blockchainService.js';

const createPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  totalValue: z.number().int().positive().optional(),
  totalTokens: z.number().int().positive(),
  tokenPrice: z.number().int().positive(),
  metadataURI: z.string().optional(),
});

export const createProperty = async (req, res) => {
  try {
    const payload = createPropertySchema.parse(req.body);
    const propertyId = await getNextSequence('property');

    const tokenName = `${payload.name} Token`;
    const tokenSymbol = `${payload.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 5)}T`;

    let tokenAddress = '';
    let deploymentTxHash = '';

    await initBlockchain();
    let deployedOnChain = false;

    if (isBlockchainReady()) {
      try {
        const deployment = await deploySPVToken(tokenName, tokenSymbol);
        tokenAddress = deployment.address;
        deploymentTxHash = deployment.txHash;
        deployedOnChain = true;
      } catch (chainErr) {
        console.warn('On-chain token deploy skipped:', chainErr.message);
      }
    }

    const doc = await Property.create({
      propertyId,
      name: payload.name,
      address: payload.address || '',
      description: payload.description || '',
      totalValue: payload.totalValue || payload.totalTokens * payload.tokenPrice,
      totalTokens: payload.totalTokens,
      tokenPrice: payload.tokenPrice,
      tokensAvailable: payload.totalTokens,
      status: 'ACTIVE',
      metadataURI: payload.metadataURI || '',
      tokenAddress,
      tokenName,
      tokenSymbol,
      deploymentTxHash,
    });

    let message = 'Property saved to database';
    if (deployedOnChain) {
      message = 'Property created and token deployed on-chain';
    } else if (isBlockchainReady()) {
      message = 'Property saved (on-chain deploy failed — check Anvil is running)';
    } else {
      message =
        'Property saved (no blockchain). Start Anvil on port 8545 or set BLOCKCHAIN_ENABLED=true when ready.';
    }

    return res.json({ message, property: doc.toAPI() });
  } catch (err) {
    console.error('createProperty error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const getAllProperties = async (req, res) => {
  const docs = await Property.find().sort({ propertyId: 1 });
  return res.json({ properties: docs.map((d) => d.toAPI()) });
};

export const getPropertyById = async (req, res) => {
  const propertyId = Number(req.params.id);
  const doc = await Property.findOne({ propertyId });
  if (!doc) {
    return res.status(404).json({ error: 'Property not found' });
  }
  return res.json({ property: doc.toAPI() });
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const doc = await Property.findOneAndDelete({ propertyId });
    if (!doc) {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.json({
      message: 'Property deleted',
      property: doc.toAPI(),
    });
  } catch (err) {
    console.error('deleteProperty error:', err);
    return res.status(400).json({ error: err.message });
  }
};

export const findPropertyById = async (propertyId) => {
  return Property.findOne({ propertyId });
};
