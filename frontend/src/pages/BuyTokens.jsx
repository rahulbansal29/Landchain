import { useEffect, useState } from "react";
import { buyTokens, getProperties } from "../services/api";

export default function BuyTokens() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [tokens, setTokens] = useState("");
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data.properties || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    };

    setWallet(localStorage.getItem("wallet_address") || "");
    loadProperties();
  }, []);

  const handleBuy = async () => {
    if (!propertyId) {
      setMessage("Please select a property.");
      return;
    }

    if (!tokens || Number(tokens) <= 0) {
      setMessage("Please enter a valid token amount.");
      return;
    }

    if (!wallet) {
      setMessage("Please enter the wallet address you want to receive tokens.");
      return;
    }

    setMessage("Processing...");
    setLoading(true);

    try {
      const data = await buyTokens({
        wallet,
        propertyId: Number(propertyId),
        tokens: Number(tokens),
      });
      const purchase = data.purchase;
      setMessage(
        `✅ Purchase request submitted!\n\nProperty ID: ${purchase.propertyId}\nTokens: ${purchase.tokens}\nTotal cost: ₹${purchase.moneyAmount}\nKYC Approved: ${purchase.isKYCApproved ? "Yes" : "No"}\nStatus: ${purchase.status}\n\nAn admin will review and mint tokens after approval.`
      );
    } catch (e) {
      setMessage(
        e.response?.data?.error ||
          "Unable to reach backend. Please check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <h1 className="page-title">Buy tokens</h1>
      <p className="page-subtitle">
        Choose a property and request tokens. An admin will review and mint to
        your wallet after KYC approval.
      </p>

      <div className="page-stack">
        <div className="form-grid">
          <div>
            <label className="form-label">Select property</label>
            <select
              className="form-input"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">Choose a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - ₹{property.tokenPrice}/token
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tokens to buy</label>
            <input
              type="number"
              className="form-input"
              placeholder="For example: 10"
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Wallet address to receive tokens</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-primary" onClick={handleBuy} disabled={loading}>
              {loading ? "Processing" : "Request tokens"}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setPropertyId("");
                setTokens("");
                setWallet("");
                setMessage("");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {message && (
          <div className="info-card" style={{ whiteSpace: "pre-wrap" }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
