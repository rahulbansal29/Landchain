import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";

import Portfolio from "./pages/Portfolio";
import KYCForm from "./pages/KYCForm";
import KYCStatus from "./pages/KYCStatus";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import BuyTokens from "./pages/BuyTokens";
import PropertyLanding from "./pages/PropertyLanding";
import { signInWithWallet, signOut } from "./services/auth";

export default function App() {
  const [auth, setAuth] = useState(() => {
    const wallet = localStorage.getItem("wallet_address");
    return wallet ? { wallet, role: "user" } : null;
  });
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const handler = () => {
      const wallet = localStorage.getItem("wallet_address");
      setAuth(wallet ? { wallet, role: "user" } : null);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleConnect = async () => {
    setAuthError("");
    try {
      const result = await signInWithWallet();
      setAuth({ wallet: result.wallet, role: result.role });
    } catch (error) {
      const message = error?.message || "Unable to connect wallet";
      setAuthError(message);
    }
  };

  const handleSignOut = () => {
    signOut();
    setAuth(null);
  };

  return (
    <BrowserRouter>
      <div className="app-root">
        <header className="app-navbar">
          <div className="app-navbar-inner">
            <div className="app-brand">
              <span className="app-brand-mark">LC</span>
              <span>
                LandChain
                <span className="app-brand-sub">Tokenised real estate</span>
              </span>
            </div>

            <nav className="app-nav-links">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                Properties
              </NavLink>
              <NavLink
                to="/buy"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                Buy Tokens
              </NavLink>
              <NavLink
                to="/portfolio"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                Portfolio
              </NavLink>
              <NavLink
                to="/kyc"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                KYC
              </NavLink>
              <NavLink
                to="/kyc-status"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                KYC Status
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                }
              >
                Admin
              </NavLink>
            </nav>

            <div className="app-nav-links" style={{ gap: "0.75rem" }}>
              {auth ? (
                <>
                  <span className="app-nav-link" style={{ cursor: "default" }}>
                    {auth.wallet?.slice(0, 6)}...{auth.wallet?.slice(-4)}
                    {auth.role === "admin" ? " (admin)" : ""}
                  </span>
                  <button className="btn btn-ghost" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button className="btn btn-secondary" onClick={handleConnect}>
                    Connect wallet
                  </button>
                  {authError ? (
                    <span style={{ color: "#b91c1c", fontSize: "0.8rem" }}>
                      {authError}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-layout">
          <div className="app-main">
            <Routes>
              <Route path="/kyc" element={<KYCForm />} />
              <Route path="/kyc-status" element={<KYCStatus />} />
              <Route path="/buy" element={<BuyTokens />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/" element={<PropertyLanding />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              {/* ✅ Protected Admin Route */}
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
