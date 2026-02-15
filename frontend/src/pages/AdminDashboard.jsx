import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getAdminAnalytics } from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    pendingPurchases: 0,
    pendingKYC: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentKYC, setRecentKYC] = useState([]);
  const [usage, setUsage] = useState({
    users: { total: 0, loggedIn: 0, uniqueInvestors: 0 },
    kyc: { submissions: 0, pending: 0, approved: 0, revoked: 0 },
    purchases: { totalRequests: 0, pending: 0, minted: 0, tokensMinted: 0, amountMinted: 0 },
    properties: { total: 0, active: 0, soldOut: 0 },
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, purchasesRes, kycRes, analyticsRes] = await Promise.all([
        api.get("/properties"),
        api.get("/token/purchases/pending"),
        api.get("/kyc/pending"),
        getAdminAnalytics(),
      ]);

      const properties = propertiesRes.data.properties || [];
      const purchases = purchasesRes.data.purchases || [];
      const kycApps = kycRes.data.applications || [];

      setStats({
        totalProperties: properties.length,
        activeProperties: properties.filter((p) => p.status === "ACTIVE").length,
        pendingPurchases: purchases.length,
        pendingKYC: kycApps.length,
      });

      setUsage({
        users: analyticsRes?.users || { total: 0, loggedIn: 0, uniqueInvestors: 0 },
        kyc: analyticsRes?.kyc || { submissions: 0, pending: 0, approved: 0, revoked: 0 },
        purchases:
          analyticsRes?.purchases ||
          { totalRequests: 0, pending: 0, minted: 0, tokensMinted: 0, amountMinted: 0 },
        properties: analyticsRes?.properties || { total: 0, active: 0, soldOut: 0 },
        lastUpdated: analyticsRes?.lastUpdated || null,
      });

      setRecentPurchases(purchases.slice(0, 5));
      setRecentKYC(kycApps.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
          Manage properties, approvals, and token minting
        </p>
      </div>

      {/* Alert Banners */}
      {(stats.pendingPurchases > 0 || stats.pendingKYC > 0) && (
        <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {stats.pendingPurchases > 0 && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fef3c7",
                border: "2px solid #f59e0b",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔔</span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {stats.pendingPurchases} purchase{stats.pendingPurchases !== 1 ? "s" : ""} awaiting approval
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#374151" }}>
                    Review and mint tokens for approved investors
                  </div>
                </div>
              </div>
              <Link to="/admin#purchases" className="btn btn-primary">
                Review Purchases
              </Link>
            </div>
          )}

          {stats.pendingKYC > 0 && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#dbeafe",
                border: "2px solid #2563eb",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>📋</span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {stats.pendingKYC} KYC application{stats.pendingKYC !== 1 ? "s" : ""} pending review
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#374151" }}>
                    Approve users to enable their investments
                  </div>
                </div>
              </div>
              <Link to="/admin#kyc" className="btn btn-primary">
                Review KYC
              </Link>
            </div>
          )}
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
            Total Properties
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>
            {stats.totalProperties}
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
            Active Properties
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#059669" }}>
            {stats.activeProperties}
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
            Pending Purchases
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#d97706" }}>
            {stats.pendingPurchases}
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
            Pending KYC
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>
            {stats.pendingKYC}
          </div>
        </div>
      </div>

      {/* Usage Analytics */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Usage Overview
          </h2>
          {usage.lastUpdated && (
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Updated {new Date(usage.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Users</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.users.total}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Logged-in Users</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.users.loggedIn}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Unique Investors</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.users.uniqueInvestors}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>KYC Submissions</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.kyc.submissions}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>KYC Approved</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.kyc.approved}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Purchase Requests</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.purchases.totalRequests}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Tokens Minted</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{usage.purchases.tokensMinted}</div>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Minted Value</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              {usage.purchases.amountMinted.toLocaleString()}
            </div>
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
          <Link to="/admin#create" className="btn btn-primary">
            Create Property
          </Link>
          <Link to="/admin#purchases" className="btn btn-secondary">
            Review Purchases
          </Link>
          <Link to="/admin#kyc" className="btn btn-secondary">
            Approve KYC
          </Link>
          <Link to="/" className="btn btn-secondary">
            View Properties
          </Link>
        </div>
      </div>

      {/* Recent Purchases */}
      {recentPurchases.length > 0 && (
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
            Recent Purchase Requests
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Property</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Wallet</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Tokens</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>KYC</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase) => (
                  <tr key={purchase.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {purchase.property ? purchase.property.name : "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {purchase.wallet.slice(0, 6)}...{purchase.wallet.slice(-4)}
                    </td>
                    <td style={{ padding: "0.75rem" }}>₹{purchase.moneyAmount}</td>
                    <td style={{ padding: "0.75rem" }}>{purchase.tokens}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: purchase.isKYCApproved ? "#d1fae5" : "#fee2e2",
                          color: purchase.isKYCApproved ? "#065f46" : "#991b1b",
                        }}
                      >
                        {purchase.isKYCApproved ? "✓" : "✗"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            to="/admin#purchases"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            View all pending purchases →
          </Link>
        </div>
      )}

      {/* Recent KYC */}
      {recentKYC.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
            Recent KYC Applications
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Wallet</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.75rem", fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentKYC.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {app.wallet.slice(0, 6)}...{app.wallet.slice(-4)}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            to="/admin#kyc"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            View all KYC applications →
          </Link>
        </div>
      )}

      {/* Empty State */}
      {stats.pendingPurchases === 0 && stats.pendingKYC === 0 && (
        <div
          style={{
            padding: "3rem",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>✨</span>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            All Caught Up!
          </h3>
          <p style={{ color: "#6b7280" }}>No pending purchases or KYC approvals at the moment.</p>
        </div>
      )}
    </div>
  );
}
