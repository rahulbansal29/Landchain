import User from '../src/models/User.js';
import Property from '../src/models/Property.js';
import KYC from '../src/models/KYC.js';
import Purchase from '../src/models/Purchase.js';

export const getAdminAnalytics = async (req, res) => {
  try {
    const [userCount, properties, kycCounts, purchaseStats] = await Promise.all([
      User.countDocuments(),
      Property.find(),
      KYC.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Purchase.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            tokens: { $sum: '$tokens' },
            amount: { $sum: '$moneyAmount' },
          },
        },
      ]),
    ]);

    const kycByStatus = Object.fromEntries(kycCounts.map((r) => [r._id, r.count]));
    const purchasesByStatus = Object.fromEntries(
      purchaseStats.map((r) => [r._id, { count: r.count, tokens: r.tokens, amount: r.amount }])
    );

    const minted = purchasesByStatus.MINTED || { count: 0, tokens: 0, amount: 0 };
    const pending = purchasesByStatus.PENDING || { count: 0, tokens: 0, amount: 0 };
    const uniqueInvestors = await Purchase.distinct('wallet', { status: 'MINTED' });

    return res.json({
      lastUpdated: new Date().toISOString(),
      users: {
        total: userCount,
        uniqueInvestors: uniqueInvestors.length,
      },
      kyc: {
        submissions: Object.values(kycByStatus).reduce((a, b) => a + b, 0),
        pending: kycByStatus.PENDING || 0,
        approved: kycByStatus.APPROVED || 0,
        revoked: kycByStatus.REVOKED || 0,
      },
      purchases: {
        totalRequests: (minted.count || 0) + (pending.count || 0),
        pending: pending.count || 0,
        minted: minted.count || 0,
        tokensMinted: minted.tokens || 0,
        amountMinted: minted.amount || 0,
      },
      properties: {
        total: properties.length,
        active: properties.filter((item) => item.status === 'ACTIVE').length,
        soldOut: properties.filter((item) => item.status === 'SOLD_OUT').length,
      },
    });
  } catch (err) {
    console.error('getAdminAnalytics error:', err);
    return res.status(500).json({ error: 'Failed to load analytics' });
  }
};
