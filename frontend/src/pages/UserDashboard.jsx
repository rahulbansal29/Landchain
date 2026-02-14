import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { checkKYCStatus, getInvestmentsByWallet, getProperties } from "../services/api";

export default function UserDashboard() {
  const [kycStatus, setKycStatus] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const wallet = localStorage.getItem("wallet_address") || "";
      const [kycRes, portfolioRes, propertiesRes] = await Promise.all([
        wallet ? checkKYCStatus(wallet) : Promise.resolve({}),
        wallet ? getInvestmentsByWallet(wallet) : Promise.resolve({ holdings: [] }),
        getProperties(),
      ]);

      setKycStatus(kycRes);
      setPortfolio(portfolioRes.holdings || []);
      setProperties(propertiesRes.properties || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = portfolio.reduce(
    (sum, holding) => sum + (holding.totalInvested || 0),
    0
  );

  const totalTokens = portfolio.reduce(
    (sum, holding) => sum + (holding.tokensHeld || 0),
    0
  );

  const activeProperties = properties.filter((p) => p.status === "ACTIVE");
  const isKycPending = kycStatus?.localStatus === "PENDING";
  const isKycApproved = kycStatus?.isApproved;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Welcome, Investor
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
          Manage your real estate investments
        </p>
      </div>

      {/* KYC Status Banner */}
      {!isKycApproved && (
        <div
          style={{
            padding: "1.5rem",
            marginBottom: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: isKycPending ? "#fef3c7" : "#fee2e2",
            border: `2px solid ${isKycPending ? "#f59e0b" : "#ef4444"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "2rem" }}>
              {isKycPending ? "⏳" : "⚠️"}
            </span>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                {isKycPending
                  ? "KYC Pending Approval"
                  : "KYC Verification Required"}
              </h3>
              <p style={{ color: "#374151", marginBottom: "0.75rem" }}>
                {isKycPending
                  ? "Your KYC documents are under review by admin. You'll be able to invest once approved."
                  : "Complete your KYC verification to start investing in properties."}
              </p>
              {!isKycPending && (
                <Link
                  to="/kyc"
                  className="btn btn-primary"
                  style={{ display: "inline-block" }}
                >
                  Complete KYC Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            Total Invested
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>
            ₹{totalInvested.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            Total Tokens
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>
            {totalTokens}
          </div>
        </div>

        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            Properties Owned
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>
            {portfolio.length}
          </div>
        </div>

        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            KYC Status
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            {isKycApproved ? (
              <span style={{ color: "#059669" }}>✓ Verified</span>
            ) : isKycPending ? (
              <span style={{ color: "#d97706" }}>⏳ Pending</span>
            ) : (
              <span style={{ color: "#dc2626" }}>✗ Not Submitted</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn-primary">
            Browse Properties
          </Link>
          <Link to="/portfolio" className="btn btn-secondary">
            View Portfolio
          </Link>
          {!isKycApproved && (
            <Link to="/kyc" className="btn btn-secondary">
              {isKycPending ? "Check KYC Status" : "Submit KYC"}
            </Link>
          )}
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
            Your Properties
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {portfolio.slice(0, 3).map((holding) => (
              <div
                key={holding.propertyId}
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
                    {holding.property?.name || "Unknown Property"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    {holding.tokensHeld} tokens • {holding.ownershipPercent.toFixed(2)}% ownership
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>₹{holding.totalInvested}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Invested</div>
                </div>
              </div>
            ))}
          </div>
          {portfolio.length > 3 && (
            <Link
              to="/portfolio"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              View all {portfolio.length} properties →
            </Link>
          )}
        </div>
      )}

      {/* Available Properties */}
      {activeProperties.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
            Investment Opportunities
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {activeProperties.slice(0, 3).map((property) => {
              const fundedPercent =
                ((property.totalTokens - property.tokensAvailable) /
                  property.totalTokens) *
                100;
              return (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  style={{
                    padding: "1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                        {property.name}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        {property.address}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>₹{property.tokenPrice}/token</div>
                      <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        {property.tokensAvailable} available
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        height: "8px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${fundedPercent}%`,
                          height: "100%",
                          backgroundColor: "#2563eb",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                      {fundedPercent.toFixed(1)}% funded
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {activeProperties.length > 3 && (
            <Link
              to="/"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              View all {activeProperties.length} properties →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
