import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveKYC,
  createProperty,
  getProperties,
  deleteProperty,
  getPendingPurchases,
  mintPurchase,
  getInvestorsSummary,
  getPendingKYC,
} from "../services/api";
import { jwtDecode } from "jwt-decode";

function AdminPanel() {
  const [wallet, setWallet] = useState("");
  const [result, setResult] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [properties, setProperties] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    description: "",
    totalTokens: "",
    tokenPrice: "",
  });

  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem("auth_token");
      const adminSession = localStorage.getItem("admin_session");
      if (!token) {
        if (!adminSession) {
          setIsAdmin(false);
          return;
        }
      }
      try {
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.role === "admin") {
            setIsAdmin(true);
            return;
          }
        }
        if (adminSession) {
          const decoded = jwtDecode(adminSession);
          setIsAdmin(decoded.type === "admin_session");
          return;
        }
        setIsAdmin(false);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
    window.addEventListener("storage", checkAdmin);
    return () => window.removeEventListener("storage", checkAdmin);
  }, []);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      setLoadingAdminData(true);
      const [props, purchases, investorData, kycData] = await Promise.all([
        getProperties(),
        getPendingPurchases(),
        getInvestorsSummary(),
        getPendingKYC(),
      ]);
      setProperties(props.properties || []);
      setPendingPurchases(purchases.purchases || []);
      setInvestors(investorData.investors || []);
      setPendingKYC(kycData.applications || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  const handleApprove = async () => {
    setResult(null);

    if (!wallet) {
      setResult({ error: "Wallet address is required" });
      return;
    }

    try {
      const response = await approveKYC(wallet);
      setResult(response);
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Failed to approve KYC" });
    }
  };

  const handleCreateProperty = async () => {
    setResult(null);

    if (
      !propertyForm.name ||
      !propertyForm.address ||
      !propertyForm.description ||
      !propertyForm.totalTokens ||
      !propertyForm.tokenPrice
    ) {
      setResult({ error: "All property fields are required" });
      return;
    }

    try {
      const response = await createProperty({
        name: propertyForm.name,
        address: propertyForm.address,
        description: propertyForm.description,
        totalTokens: Number(propertyForm.totalTokens),
        tokenPrice: Number(propertyForm.tokenPrice),
      });

      setResult({
        success: "Property created successfully!",
        property: response.property,
      });
      setPropertyForm({
        name: "",
        address: "",
        description: "",
        totalTokens: "",
        tokenPrice: "",
      });
      setShowPropertyForm(false);
      
      const props = await getProperties();
      setProperties(props.properties || []);
      await loadAdminData();
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Failed to create property" });
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      await deleteProperty(propertyId);
      const props = await getProperties();
      setProperties(props.properties || []);
      await loadAdminData();
      setResult({ success: "Property deleted successfully" });
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Failed to delete property" });
    }
  };

  const handleMintPurchase = async (purchaseId) => {
    setResult(null);
    try {
      const response = await mintPurchase(purchaseId);
      setResult({ success: "Tokens minted successfully", purchase: response.purchase });
      await loadAdminData();
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Failed to mint tokens" });
    }
  };

  const handleApproveWallet = async (walletAddress) => {
    setResult(null);
    try {
      const response = await approveKYC(walletAddress);
      setResult({ success: "KYC approved", approval: response });
      await loadAdminData();
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Failed to approve KYC" });
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-shell page-stack" style={{ maxWidth: 520, marginInline: "auto" }}>
        <h1 className="page-title">Admin access</h1>
        <p className="page-subtitle">Connect your admin wallet to access this panel.</p>
      </div>
    );
  }

  return (
    <div className="page-shell page-stack" style={{ maxWidth: 900, marginInline: "auto" }}>
      <div>
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">
          Manage KYC approvals and create properties for investors.
        </p>
      </div>

      <div className="info-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            Create New Property
          </h2>
          <button onClick={() => setShowPropertyForm(!showPropertyForm)} className="btn btn-ghost">
            {showPropertyForm ? "Hide Form" : "Show Form"}
          </button>
        </div>

        {showPropertyForm && (
          <div className="form-grid" style={{ gap: "1rem" }}>
            <div>
              <label className="form-label">Property Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Luxury Apartment Mumbai"
                value={propertyForm.name}
                onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Bandra West, Mumbai"
                value={propertyForm.address}
                onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="Property description..."
                rows={4}
                value={propertyForm.description}
                onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Total Tokens</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 10000"
                value={propertyForm.totalTokens}
                onChange={(e) => setPropertyForm({ ...propertyForm, totalTokens: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Price per Token (INR)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 100"
                value={propertyForm.tokenPrice}
                onChange={(e) => setPropertyForm({ ...propertyForm, tokenPrice: e.target.value })}
              />
            </div>

            <button onClick={handleCreateProperty} className="btn btn-primary" style={{ gridColumn: "1 / -1" }}>
              Create Property
            </button>
          </div>
        )}
      </div>

      <div className="info-card">
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>
          Existing Properties
        </h2>
        {properties.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No properties created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {properties.map((property) => (
              <div
                key={property.id}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    {property.name}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    {property.tokensAvailable}/{property.totalTokens} tokens available - 
                    ₹{property.tokenPrice} per token - Status: {property.status}
                  </div>
                  {property.tokenAddress && (
                    <div style={{ color: "#8b5cf6", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      Token: {property.tokenSymbol} | {property.tokenAddress.slice(0, 10)}...{property.tokenAddress.slice(-8)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteProperty(property.id)}
                  className="btn btn-ghost"
                  style={{ color: "#dc2626" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-card">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>
          KYC Approval
        </h3>
        <div className="form-grid">
          <div>
            <label className="form-label">Investor wallet address</label>
            <input
              type="text"
              placeholder="0x..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="form-input"
            />
          </div>

          <button onClick={handleApprove} className="btn btn-secondary" style={{ marginTop: "2rem" }}>
            Approve KYC
          </button>
        </div>
      </div>

      <div className="info-card" id="kyc">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>
          Pending KYC Applications
        </h3>
        {loadingAdminData && pendingKYC.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Loading KYC applications...</p>
        ) : pendingKYC.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No pending KYC applications.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {pendingKYC.map((app) => (
              <div
                key={app.wallet}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{app.wallet}</div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Updated: {app.updatedAt ? new Date(app.updatedAt).toLocaleString() : "N/A"}
                  </div>
                </div>
                <button
                  onClick={() => handleApproveWallet(app.wallet)}
                  className="btn btn-secondary"
                >
                  Approve KYC
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-card" id="purchases">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>
          Pending Purchase Requests
        </h3>
        {loadingAdminData && pendingPurchases.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Loading purchase requests...</p>
        ) : pendingPurchases.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No pending purchase requests.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {pendingPurchases.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {purchase.property?.name || "Unknown Property"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Wallet: {purchase.wallet}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Tokens: {purchase.tokens} | Total: {purchase.moneyAmount}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    KYC: {purchase.isKYCApproved ? "Approved" : "Pending"}
                  </div>
                </div>
                <button
                  onClick={() => handleMintPurchase(purchase.id)}
                  className="btn btn-primary"
                >
                  Mint Tokens
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-card">
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: 600 }}>
          Investor Overview
        </h3>
        {loadingAdminData && investors.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Loading investors...</p>
        ) : investors.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No investor holdings yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {investors.map((investor) => (
              <div
                key={investor.wallet}
                style={{
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{investor.wallet}</div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Tokens: {investor.totalTokens} | Invested: {investor.totalInvested}
                  </div>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  Holdings: {investor.holdings?.length || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div
          className="info-card"
          style={{
            marginTop: "0.75rem",
            background: result.error ? "#fee2e2" : "#f0fdf4",
            border: `1px solid ${result.error ? "#fca5a5" : "#86efac"}`,
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              color: result.error ? "#991b1b" : "#166534",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
