import { z } from "zod";

const createPropertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  totalValue: z.number().int().positive().optional(),
  totalTokens: z.number().int().positive(),
  tokenPrice: z.number().int().positive(),
  metadataURI: z.string().optional(),
});

const properties = [];
let nextId = 1;

const withStats = (property) => {
  const tokensSold = property.totalTokens - property.tokensAvailable;
  return {
    ...property,
    tokensSold,
    percentageFunded: property.totalTokens
      ? (tokensSold / property.totalTokens) * 100
      : 0,
    ownershipPerToken: property.totalTokens
      ? (100 / property.totalTokens).toFixed(4)
      : "0",
  };
};

export const createProperty = async (req, res) => {
  try {
    const payload = createPropertySchema.parse(req.body);
    const property = {
      id: nextId++,
      name: payload.name,
      address: payload.address || "",
      description: payload.description || "",
      totalValue: payload.totalValue || payload.totalTokens * payload.tokenPrice,
      totalTokens: payload.totalTokens,
      tokenPrice: payload.tokenPrice,
      metadataURI: payload.metadataURI || "",
      tokensAvailable: payload.totalTokens,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    properties.push(property);

    return res.json({
      message: "Property created",
      property: withStats(property),
    });
  } catch (err) {
    console.error("createProperty error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getAllProperties = async (req, res) => {
  const list = properties.map(withStats);
  return res.json({ properties: list });
};

export const getPropertyById = async (req, res) => {
  const propertyId = Number(req.params.id);
  const property = properties.find((item) => item.id === propertyId);
  if (!property) {
    return res.status(404).json({ error: "Property not found" });
  }
  return res.json({ property: withStats(property) });
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const index = properties.findIndex((item) => item.id === propertyId);
    
    if (index === -1) {
      return res.status(404).json({ error: "Property not found" });
    }

    const deleted = properties.splice(index, 1)[0];
    return res.json({ 
      message: "Property deleted",
      property: deleted
    });
  } catch (err) {
    console.error("deleteProperty error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getPropertyStore = () => properties;
