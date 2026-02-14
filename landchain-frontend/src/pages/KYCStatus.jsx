import React, { useState } from "react";
import { checkKYCStatus } from "../services/api";

function KYCStatus() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState(null);

  const handleCheck = async () => {
    if (!wallet) {
      setStatus({ error: "Wallet address is required" });
      return;
    }

    const res = await checkKYCStatus(wallet);
    setStatus(res);
  };

  return (
    <div className="page-shell page-stack" style={{ maxWidth: 520, marginInline: "auto" }}>
      <div>
        <h1 className="page-title">KYC status</h1>
        <p className="page-subtitle">
          Track whether a given wallet has been approved by the admin team.
        </p>
      </div>

      <div className="form-grid">
        <div>
          <label className="form-label">Wallet address</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="Enter wallet address"
            className="form-input"
          />
        </div>

        <button onClick={handleCheck} className="btn btn-secondary">
          Check status
        </button>
      </div>

      {status && (
        <div className="info-card" style={{ marginTop: "0.75rem" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default KYCStatus;
