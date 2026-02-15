import { getPropertyStore } from "./propertyController.js";
import { getPurchasesStore } from "./tokenController.js";
import { getKYCStore } from "./KYCController.js";
import { getUserStore } from "./authController.js";

const countByStatus = (entries, status) =>
  entries.filter((entry) => entry.status === status).length;

export const getAdminAnalytics = async (req, res) => {
  try {
    const properties = getPropertyStore();
    const purchases = getPurchasesStore();
    const kycStore = getKYCStore();
    const userStore = getUserStore();

    const purchaseWallets = purchases.map((item) => item.wallet);
    const allWallets = new Set([
      ...userStore.keys(),
      ...kycStore.keys(),
      ...purchaseWallets,
    ]);

    const pendingPurchases = purchases.filter((item) => item.status === "PENDING");
    const mintedPurchases = purchases.filter((item) => item.status === "MINTED");

    const tokensMinted = mintedPurchases.reduce(
      (sum, item) => sum + (item.tokens || 0),
      0
    );
    const amountMinted = mintedPurchases.reduce(
      (sum, item) => sum + (item.moneyAmount || 0),
      0
    );

    const kycEntries = Array.from(kycStore.values());

    return res.json({
      lastUpdated: new Date().toISOString(),
      users: {
        total: allWallets.size,
        loggedIn: userStore.size,
        uniqueInvestors: new Set(mintedPurchases.map((item) => item.wallet)).size,
      },
      kyc: {
        submissions: kycStore.size,
        pending: countByStatus(kycEntries, "PENDING"),
        approved: countByStatus(kycEntries, "APPROVED"),
        revoked: countByStatus(kycEntries, "REVOKED"),
      },
      purchases: {
        totalRequests: purchases.length,
        pending: pendingPurchases.length,
        minted: mintedPurchases.length,
        tokensMinted,
        amountMinted,
      },
      properties: {
        total: properties.length,
        active: properties.filter((item) => item.status === "ACTIVE").length,
        soldOut: properties.filter((item) => item.status === "SOLD_OUT").length,
      },
    });
  } catch (err) {
    console.error("getAdminAnalytics error:", err);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
};
