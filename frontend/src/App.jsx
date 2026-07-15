import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "./App.css";

import Portfolio from "./pages/Portfolio";
import KYCForm from "./pages/KYCForm";
import KYCStatus from "./pages/KYCStatus";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import BuyTokens from "./pages/BuyTokens";
import PropertyLanding from "./pages/PropertyLanding";
import { signInWithWallet, signOut } from "./services/auth";

// Single source of truth for "who is logged in and are they an admin".
// The real role lives inside the signed JWT — we decode it instead of trusting
// a hardcoded value. (Security is still enforced by the backend; this only
// controls what the UI shows.)
function readAuth() {
  const token = localStorage.getItem("auth_token");        // wallet login (user_session)
  const adminSession = localStorage.getItem("admin_session"); // password login (admin_session)
  let wallet = localStorage.getItem("wallet_address") || "";
  let role = "user";
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      wallet = wallet || decoded.wallet || "";
      if (decoded.role === "admin") {
        isAdmin = true;
        role = "admin";
      }
    } catch {
      // ignore malformed/expired token
    }
  }

  if (adminSession) {
    try {
      const decoded = jwtDecode(adminSession);
      if (decoded.type === "admin_session") {
        isAdmin = true;
        role = "admin";
        wallet = wallet || decoded.wallet || "";
      }
    } catch {
      // ignore malformed/expired token
    }
  }

  if (!wallet && !isAdmin) return null;
  return { wallet, role, isAdmin };
}

// Route guard: only admins may see the wrapped element; everyone else is
// bounced to the home page ("fully hidden" admin section).
function RequireAdmin({ isAdmin, children }) {
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [auth, setAuth] = useState(readAuth);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const handler = () => setAuth(readAuth());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleConnect = async () => {
    setAuthError("");
    try {
      await signInWithWallet();
      setAuth(readAuth());
    } catch (error) {
      const message = error?.message || "Unable to connect wallet";
      setAuthError(message);
    }
  };

  const handleSignOut = () => {
    signOut();
    localStorage.removeItem("admin_session");
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
              {auth?.isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                  }
                >
                  Admin
                </NavLink>
              )}
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

              {/* ✅ Protected Admin Route — non-admins are redirected home */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin isAdmin={auth?.isAdmin}>
                    <AdminPanel />
                  </RequireAdmin>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
