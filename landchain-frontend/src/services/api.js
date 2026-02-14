import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  const adminSession = localStorage.getItem("admin_session");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (adminSession) {
    config.headers.Authorization = `Bearer ${adminSession}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
};

export async function uploadKYC({ wallet, metadata = {} }) {
  const res = await api.post("/kyc/submit", { wallet, metadata });
  return res.data;
}

export async function checkKYCStatus(wallet) {
  const res = await api.get(`/kyc/status/${wallet}`);
  return res.data;
}

export async function approveKYC(wallet) {
  const res = await api.post("/kyc/approve", { wallet });
  return res.data;
}

export async function getBalance(wallet) {
  const res = await api.get(`/token/balance/${wallet}`);
  return res.data;
}

export async function getTokenInfo() {
  const res = await api.get("/token/info");
  return res.data;
}

export async function buyTokens({ wallet, propertyId, tokens }) {
  const res = await api.post("/token/request", { wallet, propertyId, tokens });
  return res.data;
}

export async function requestPurchase({ wallet, propertyId, tokens }) {
  const res = await api.post("/token/request", { wallet, propertyId, tokens });
  return res.data;
}

export async function createProperty(payload) {
  const res = await api.post("/properties", payload);
  return res.data;
}

export async function getProperties() {
  const res = await api.get("/properties");
  return res.data;
}

export async function deleteProperty(propertyId) {
  const res = await api.delete(`/properties/${propertyId}`);
  return res.data;
}

export async function getPendingPurchases() {
  try {
    const res = await api.get("/token/purchases/pending");
    return res.data;
  } catch {
    return { purchases: [] };
  }
}

export async function mintPurchase(purchaseId) {
  const res = await api.post("/token/mint", { purchaseId });
  return res.data;
}

export async function getInvestmentsByWallet(wallet) {
  const res = await api.get(`/token/investments/${wallet}`);
  return res.data;
}

export async function getInvestorsSummary() {
  const res = await api.get("/token/investors");
  return res.data;
}

export async function getPendingKYC() {
  const res = await api.get("/kyc/pending");
  return res.data;
}

export default api;
