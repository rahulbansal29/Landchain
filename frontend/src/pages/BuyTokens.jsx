import { useEffect, useState } from "react";
import { getProperties, getQuote, buyTokensOnChain } from "../services/api";

export default function BuyTokens() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [tokens, setTokens] = useState("");
  const [wallet, setWallet] = useState("");
  const [quote, setQuote] = useState(null);
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

  // Fetch a live price quote whenever the property or token count changes.
  useEffect(() => {
    const id = Number(propertyId);
    const amount = Number(tokens);
    if (!id || !amount || amount <= 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q = await getQuote(id, amount);
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setQuote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, tokens]);

  const handleBuy = async () => {
    setMessage("");

    if (!propertyId) return setMessage("Please select a property.");
    if (!tokens || Number(tokens) <= 0) return setMessage("Please enter a valid token amount.");
    if (!wallet) return setMessage("Please enter the wallet address to receive tokens.");
    if (!window.ethereum) return setMessage("MetaMask not detected. Install/enable it to pay.");

    setLoading(true);
    try {
      // 1. Get the current price (INR + ETH) and the treasury address.
      setMessage("Getting price quote…");
      const q = await getQuote(Number(propertyId), Number(tokens));
      setQuote(q);

      if (!q.treasury) {
        setMessage("Blockchain is not available, so on-chain payment can't be processed right now.");
        return;
      }

      // 2. The paying MetaMask account must match the receiving wallet.
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const payer = accounts[0];
      if (!payer || payer.toLowerCase() !== wallet.toLowerCase()) {
        setMessage(
          `Your active MetaMask account (${payer || "none"}) must match the receiving wallet (${wallet}). Switch accounts in MetaMask and try again.`
        );
        return;
      }

      // 3. Send the ETH payment to the treasury (buyer confirms in MetaMask).
      setMessage(`Confirm the payment in MetaMask: ${q.priceEth} ETH (₹${q.moneyAmount})…`);
      const valueHex = "0x" + BigInt(q.priceWei).toString(16);
      const paymentTxHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: payer, to: q.treasury, value: valueHex }],
      });

      // 4. Backend verifies the payment on-chain, then mints the tokens.
      setMessage("Payment sent. Verifying on-chain and minting your tokens…");
      const data = await buyTokensOnChain({
        wallet,
        propertyId: Number(propertyId),
        tokens: Number(tokens),
        paymentTxHash,
      });

      setMessage(
        `✅ Success!\n\nTokens minted: ${data.tokensMinted}\nPaid: ${data.priceEth} ETH (₹${data.moneyAmount})\nPayment tx: ${data.paymentTxHash}\nToken mint tx: ${data.txHash || "(recorded in database)"}`
      );
      setTokens("");
      setQuote(null);
    } catch (e) {
      // MetaMask user-rejected code is 4001.
      if (e?.code === 4001) {
        setMessage("You cancelled the payment in MetaMask.");
      } else {
        setMessage(
          e.response?.data?.error || e.message || "Purchase failed. Is the backend and Anvil running?"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <h1 className="page-title">Buy tokens</h1>
      <p className="page-subtitle">
        Choose a property, pay with test ETH from your wallet, and receive tokens
        instantly once the payment is verified on-chain. You must be KYC-approved first.
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

          {quote && (
            <div
              className="info-card"
              style={{ gridColumn: "1 / -1", background: "#f8fafc" }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Price</div>
              <div style={{ color: "#4b5563", fontSize: "0.9rem" }}>
                {quote.tokens} tokens × ₹{quote.tokenPrice} = <strong>₹{quote.moneyAmount}</strong>
                {"  →  "}
                <strong>{quote.priceEth} ETH</strong> (test)
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.25rem", fontFamily: "monospace" }}>
                Pay to treasury: {quote.treasury || "blockchain unavailable"}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-primary" onClick={handleBuy} disabled={loading}>
              {loading ? "Processing…" : "Pay with ETH & buy"}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setPropertyId("");
                setTokens("");
                setQuote(null);
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
