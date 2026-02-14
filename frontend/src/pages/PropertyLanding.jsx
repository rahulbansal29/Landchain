import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBalance, getProperties } from "../services/api";

export default function PropertyLanding() {
  const [wallet, setWallet] = useState("");
  const [tokens, setTokens] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);


  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data.properties || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setPropertiesLoaded(true);
      }
    };

    loadProperties();
  }, []);

  const checkTokenBalance = async () => {
    if (!wallet) {
      alert("Please enter wallet address");
      return;
    }
    const data = await getBalance(wallet);
    setTokens(data.balance);
  };

  const propertyList = properties;

  return (
    <div className="page-shell page-stack">
      <div>
        <p className="info-pill">
          <span className="info-pill-dot" />
          Live tokenised offerings
        </p>
        <h1 className="page-title">Curated real-estate properties</h1>
        <p className="page-subtitle">
          Discover assets, check your wallet eligibility, and move straight into
          KYC or token purchase for approved investors.
        </p>
      </div>

      <div className="info-card">
        <div className="form-grid">
          <div>
            <div className="form-label">Check wallet allocation</div>
            <input
              className="form-input"
              placeholder="Enter wallet address to check token allowance"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={checkTokenBalance}>
            Check balance
          </button>
        </div>
        {tokens !== null && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
            You can currently invest up to{" "}
            <strong style={{ color: "#16a34a" }}>{tokens}</strong> tokens from
            this wallet.
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.6rem",
        }}
      >
        {propertyList.map((property) => {
          const title = property.name || property.title || "Property";
          const location = property.address || property.location || "Location unavailable";
          const category = property.status || property.category || "Available";
          const expectedIncome = property.expectedIncome || "--";
          const tokenPrice = property.tokenPrice ?? "--";
          const image =
            property.image || "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg";

          return (
            <article
              key={property.id}
              style={{
                borderRadius: "1.3rem",
                overflow: "hidden",
                background: "#ffffff",
                boxShadow:
                  "0 18px 45px rgba(15,23,42,0.16), 0 0 0 1px rgba(148,163,184,0.4)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  fontWeight: 600,
                  color: "#f9fafb",
                  background:
                    "linear-gradient(to right, #f97316, #ec4899, #8b5cf6)",
                }}
              >
                <span>{category}</span>
                <span style={{ opacity: 0.85 }}>Tokenised</span>
              </div>

              <div style={{ position: "relative" }}>
                <img
                  src={image}
                  alt={title}
                  style={{
                    width: "100%",
                    height: "210px",
                    objectFit: "cover",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    insetInlineEnd: "0.9rem",
                    bottom: "0.9rem",
                    borderRadius: "999px",
                    padding: "0.45rem 0.9rem",
                    background: "rgba(15,23,42,0.85)",
                    color: "#e5e7eb",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                  }}
                >
                  <span style={{ opacity: 0.8 }}>Expected yield</span>
                  <span style={{ fontWeight: 700, color: "#22c55e" }}>
                    {expectedIncome}
                  </span>
                </div>
              </div>

              <div style={{ padding: "1.1rem 1.2rem 1.25rem", flex: 1 }}>
                <h2
                  style={{
                    fontSize: "1.1rem",
                    margin: "0 0 0.2rem",
                    color: "#111827",
                  }}
                >
                  {title}
                </h2>
                <p
                  style={{
                    margin: "0 0 0.9rem",
                    fontSize: "0.9rem",
                    color: "#6b7280",
                  }}
                >
                  {location}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.9rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.11em",
                        color: "#9ca3af",
                        marginBottom: "0.15rem",
                      }}
                    >
                      Token price
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: "#111827",
                      }}
                    >
                      ₹{tokenPrice}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#4b5563",
                      textAlign: "right",
                    }}
                  >
                    <div>Minimum 1 token</div>
                    <div style={{ opacity: 0.7 }}>Instant on-chain settlement</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {tokens !== null && tokens > 0 ? (
                    <>
                      <Link to="/buy" className="btn btn-primary" style={{ flex: 1 }}>
                        Invest tokens
                      </Link>
                      <Link to="/portfolio" className="btn btn-ghost">
                        View portfolio
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/kyc" className="btn btn-primary" style={{ flex: 1 }}>
                        Start KYC
                      </Link>
                      <Link to="/kyc-status" className="btn btn-ghost">
                        Check status
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {propertiesLoaded && properties.length === 0 && (
        <div className="info-card">
          No properties are available yet. Ask an admin to create a listing.
        </div>
      )}
    </div>
  );
}
