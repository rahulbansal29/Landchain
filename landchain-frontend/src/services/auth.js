import api, { setAuthToken } from "./api";

export const getWalletAddress = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || !accounts.length) {
    throw new Error("No wallet account available");
  }

  return accounts[0];
};

export const signInWithWallet = async () => {
  try {
    const wallet = await getWalletAddress();

    console.log("Requesting nonce for wallet:", wallet);
    const nonceResponse = await api.post("/auth/nonce", { wallet });
    const { wallet: checksummedWallet, nonce, issuedAt } = nonceResponse.data;
    console.log("Nonce received:", nonce);

    const message = [
      "LandChain login",
      `Wallet: ${checksummedWallet}`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join("\n");

    console.log("Requesting signature...");
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, wallet],
    });
    console.log("Signature received");

    console.log("Verifying signature...");
    const verifyResponse = await api.post("/auth/verify", {
      wallet: checksummedWallet,
      signature,
    });
    console.log("Verification successful");

    setAuthToken(verifyResponse.data.token);
    localStorage.setItem("wallet_address", verifyResponse.data.wallet);

    return verifyResponse.data;
  } catch (error) {
    console.error("Wallet sign-in failed:", error);
    if (error.response) {
      console.error("Response error:", error.response.data);
      throw new Error(error.response.data.error || "Server error");
    } else if (error.request) {
      console.error("Network error - no response received");
      throw new Error("Cannot connect to server. Is the backend running?");
    } else {
      throw error;
    }
  }
};

export const signOut = () => {
  setAuthToken(null);
  localStorage.removeItem("wallet_address");
};
