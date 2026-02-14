import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw, UserCheck, UserX } from "lucide-react";
import { checkKYCStatus, getInvestmentsByWallet } from "../services/api";

export default function Portfolio() {
  const [wallet, setWallet] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const validateAddress = (value) => value && value.trim().length >= 6;

  const formatAddress = (addr) =>
    !addr ? "" : addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const fetchPortfolio = async () => {
    setError("");
    if (!validateAddress(wallet)) {
      setError("Please enter a valid wallet address (min 6 characters).");
      return;
    }

    setLoading(true);
    setPortfolio(null);

    try {
      const [kyc, investments] = await Promise.all([
        checkKYCStatus(wallet),
        getInvestmentsByWallet(wallet),
      ]);

      setPortfolio({
        wallet,
        kyc: !!(kyc && kyc.isApproved),
        holdings: investments?.holdings || [],
      });
    } catch (err) {
      console.error(err);
      setError("Error fetching portfolio. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell page-stack">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div>
          <h1 className="page-title">Investor portfolio</h1>
          <p className="page-subtitle">
            Enter a wallet address to view balance, KYC status, and token info
            for this offering.
          </p>
        </div>

        <div className="info-card">
          <div className="form-grid">
            <div>
              <label className="form-label">Wallet address</label>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input
                  type="text"
                  placeholder="0x1234..."
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPortfolio()}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(wallet)}
                  className="btn btn-ghost"
                  aria-label="Copy wallet"
                >
                  {copied ? "Copied" : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setWallet("");
                  setPortfolio(null);
                  setError("");
                }}
              >
                Reset
              </button>

              <button
                type="button"
                onClick={fetchPortfolio}
                disabled={!validateAddress(wallet) || loading}
                className="btn btn-primary"
                style={{ opacity: !validateAddress(wallet) || loading ? 0.6 : 1 }}
              >
                <RefreshCw size={16} />
                {loading ? "Loading" : "View portfolio"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ color: "#b91c1c", fontSize: "0.95rem" }}>{error}</p>
        )}

        {!portfolio && !error && (
          <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
            Enter a wallet and click <strong>View portfolio</strong> to see
            on-chain balances and approval state.
          </p>
        )}

        {portfolio && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: "1.4rem",
              padding: "1.5rem 1.4rem 1.7rem",
              background:
                "radial-gradient(circle at top left,#eff6ff,#ffffff 45%,#f9fafb)",
              boxShadow:
                "0 22px 65px rgba(15,23,42,0.18),0 0 0 1px rgba(148,163,184,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.8rem",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Portfolio Holdings
                </h2>
                <p
                  style={{
                    margin: "0.3rem 0 0",
                    fontSize: "0.92rem",
                    color: "#6b7280",
                  }}
                >
                  {formatAddress(portfolio.wallet)}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    padding: "0.55rem 0.9rem",
                    borderRadius: "999px",
                    background: portfolio.kyc ? "#ecfdf3" : "#fef2f2",
                    color: portfolio.kyc ? "#166534" : "#b91c1c",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {portfolio.kyc ? <UserCheck size={18} /> : <UserX size={18} />}
                  <span>{portfolio.kyc ? "KYC approved" : "Not approved"}</span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(portfolio.wallet)}
                  className="btn btn-ghost"
                >
                  {copied ? "Copied" : <Copy size={16} />}
                </button>
              </div>
            </div>

            {portfolio.holdings.length === 0 && (
              <p style={{ color: "#6b7280", fontSize: "0.95rem", textAlign: "center", padding: "2rem 0" }}>
                No property holdings found for this wallet.
              </p>
            )}

            {portfolio.holdings && portfolio.holdings.length > 0 && (
              <div>
                <h3
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Property Investments
                </h3>

                <div
                  style={{
                    display: "grid",
                    gap: "1rem",
                  }}
                >
                  {portfolio.holdings.map((holding, index) => (
                    <div
                      key={index}
                      style={{
                        borderRadius: "1rem",
                        border: "1px solid rgba(148,163,184,0.4)",
                        background: "white",
                        padding: "1.2rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "1rem",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 0.25rem 0",
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {holding.property?.name || "Unknown Property"}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            📍 {holding.property?.address || "N/A"}
                          </p>
                        </div>
                        <div
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "999px",
                            background: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        >
                          {holding.ownershipPercent.toFixed(2)}%
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Your Tokens
                          </div>
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {holding.tokensHeld.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Total Invested
                          </div>
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            ₹{holding.totalInvested.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Property Total
                          </div>
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {holding.property?.totalTokens.toLocaleString()} tokens
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
