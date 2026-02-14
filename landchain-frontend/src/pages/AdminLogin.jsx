import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting admin login with password:", password);
      const response = await api.post("/admin-auth/login", { password });
      console.log("Login response:", response.data);
      
      // Store admin session token
      localStorage.setItem("admin_session", response.data.token);
      
      // Redirect to admin dashboard
      navigate("/dashboard");
      window.location.reload(); // Reload to update admin state
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.error || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              backgroundColor: "#2563eb",
              borderRadius: "50%",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🔐</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Admin Access
          </h1>
          <p style={{ color: "#6b7280" }}>Enter admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                marginBottom: "1rem",
                backgroundColor: "#fee2e2",
                border: "1px solid #ef4444",
                borderRadius: "0.375rem",
                color: "#991b1b",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {loading ? "Verifying..." : "Access Admin Panel"}
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Demo Credentials:</strong>
          </p>
          <p style={{ margin: 0, fontFamily: "monospace" }}>
            Password: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

