import React, { useState } from "react";
import { uploadKYC } from "../services/api";

function KYCForm() {
  const [response, setResponse] = useState(null);
  const [wallet, setWallet] = useState(
    localStorage.getItem("wallet_address") || ""
  );
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [documentId, setDocumentId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await uploadKYC({
      wallet,
      metadata: {
        fullName,
        country,
        documentId,
      },
    });
    setResponse(res);
  };

  return (
    <div className="page-shell page-stack" style={{ maxWidth: 520, marginInline: "auto" }}>
      <div>
        <h1 className="page-title">Submit KYC</h1>
        <p className="page-subtitle">
          Register your wallet for this offering so an administrator can
          approve your investor profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label className="form-label">Wallet address</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your legal name"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country of residence"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Document ID</label>
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="Passport / ID reference"
            className="form-input"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Submit KYC
        </button>
      </form>

      {response && (
        <div className="info-card" style={{ marginTop: "0.75rem" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default KYCForm;
