# LandChain 🏗️

**Tokenized Real Estate Platform** - Fractional ownership of properties through blockchain tokens

## 📖 Overview

LandChain is a blockchain-based platform that enables fractional ownership of real estate properties through ERC20 tokens. Each property is tokenized with its own SPVToken contract (Special Purpose Vehicle Token), allowing multiple investors to own portions of real estate assets with KYC compliance built into the system.

## 🎯 What It Does

- **Property Tokenization**: Each real estate property gets its own dedicated ERC20 token contract
- **Fractional Ownership**: Multiple investors can purchase tokens representing shares in individual properties
- **KYC Compliance**: Shared KYC registry ensures only verified addresses can hold and transfer tokens
- **Admin Management**: Administrators approve KYC applications and mint tokens for each purchase request
- **Investment Platform**: Users can buy tokens, view their portfolio, and track holdings across multiple properties

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend │  ← User Interface (Vite + React Router)
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│  Express Backend │  ← API Server (Node.js + Express)
└────────┬────────┘
         │ ethers.js
┌────────▼────────┐
│  Smart Contracts │  ← Blockchain (Foundry + Solidity)
│  - Property A Token  │    - Each property = separate SPVToken
│  - Property B Token  │    - Shared KYC Registry
│  - KYCRegistry   │     - Admin minting control
└─────────────────┘
```

## 🛠️ Technology Stack

### Smart Contracts
- **Framework**: Foundry (Forge, Anvil)
- **Language**: Solidity ^0.8.20
- **Libraries**: OpenZeppelin Contracts

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Blockchain**: ethers.js v6
- **File Upload**: Multer

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: CSS + Tailwind PostCSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios

## 📁 Project Structure

```
LandChain/
├── foundry/              # Smart Contracts (Solidity + Foundry)
│   ├── src/
│   │   ├── tokens/
│   │   │   └── SPVToken.sol           # ERC20 token with KYC
│   │   └── registries/
│   │       └── KYCRegistry.sol        # KYC approval registry
│   └── script/
│       └── DeploySPVToken.s.sol       # Deployment script
│
├── backend/              # API Server (Node.js + Express)
│   ├── controllers/      # Request handlers
│   │   ├── KYCController.js
│   │   ├── tokenController.js
│   │   ├── propertyController.js
│   │   ├── authController.js
│   │   └── adminAuthController.js
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & admin guards
│   ├── services/
│   │   └── blockchainService.js       # Ethers.js integration
│   └── server.js
│
└── frontend/             # React App (Vite + React Router)
    ├── src/
    │   ├── pages/       # Route components
    │   │   ├── PropertyLanding.jsx
    │   │   ├── BuyTokens.jsx
    │   │   ├── Portfolio.jsx
    │   │   ├── KYCForm.jsx
    │   │   ├── KYCStatus.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── AdminLogin.jsx
    │   ├── services/    # API client & auth
    │   │   ├── api.js
    │   │   └── auth.js
    │   └── App.jsx
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Foundry (Forge, Anvil)
- MetaMask or Web3 wallet

### 1. Start Local Blockchain
```bash
cd foundry
anvil
```

### 2. Deploy KYC Registry
```bash
cd foundry
forge build
forge script script/DeploySPVToken.s.sol:DeploySPVToken \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <your_private_key> \
  --broadcast
```
**Note:** This deploys the KYCRegistry (and initially LandChain Token). Each property created by admin will automatically deploy its own SPVToken contract.

### 3. Setup Backend
```bash
cd backend
npm install
# Create .env file with contract addresses and keys
npm start
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal)

## 📋 Current Features (MVP)

✅ **User Flow**
- Submit KYC applications
- Request token purchases for specific properties
- View portfolio with holdings across multiple properties

✅ **Admin Flow**  
- Approve/reject KYC applications
- Create properties (auto-deploys dedicated SPVToken for each)
- Mint property-specific tokens for approved purchases
- View investor summaries across all properties

✅ **Smart Contracts**
- One ERC20 token per property (true SPV model)
- Shared KYC registry for all properties
- Transfer restrictions for compliance
- Admin minting control

## 🗺️ Next Steps

### Immediate Priorities
1. **Database Integration** - PostgreSQL/MongoDB for KYC documents and user data
2. **Payment Gateway** - Fiat on-ramp integration for token purchases
3. **Enhanced UI/UX** - Improved responsiveness and user flows
4. **Testing** - Comprehensive test coverage for contracts and APIs

### Planned Features
- Multi-property support with marketplace
- Dividend distribution system
- Secondary market for token trading
- Mobile application
- Advanced analytics dashboard

## 📚 Documentation

- **[FOLLOW_THESE_STEPS.md](./FOLLOW_THESE_STEPS.md)** - Quick start guide
- [Foundry Documentation](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ethers.js Docs](https://docs.ethers.org/)
- [React Documentation](https://react.dev/)

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=3000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key
KYC_REGISTRY_ADDRESS=0x...
JWT_SECRET=replace_with_strong_secret
ADMIN_WALLETS=0xAdminAddress1,0xAdminAddress2
DATABASE_URL=postgresql://user:password@localhost:5432/landchain
CORS_ORIGINS=http://localhost:5173

# Note: SPVToken addresses are deployed per-property automatically
# and stored with each property in the backend
```

### Frontend (.env)
```env
VITE_API_BASE=http://localhost:3000/api
```

## 📝 API Endpoints

### KYC
- `POST /api/kyc/upload` - Submit KYC application
- `GET /api/kyc/status/:wallet` - Check KYC status
- `POST /api/kyc/approve` - Approve KYC (admin)

### Auth
- `POST /api/auth/nonce` - Get wallet login nonce
- `POST /api/auth/verify` - Verify signature and receive JWT

### Tokens
- `POST /api/token/buy` - Create a purchase intent (requires wallet login)
- `POST /api/token/mint` - Mint purchase intent (admin)
- `GET /api/token/balance/:wallet` - Get token balance
- `GET /api/token/info` - Get token information

## 🎓 Key Concepts

### SPV (Special Purpose Vehicle)
A legal entity created to hold a specific property. Each SPV has its own token (SPVToken) representing fractional ownership.

### KYC (Know Your Customer)
Regulatory requirement for financial services. Users must be verified before they can hold tokens. Enforced at the smart contract level.

### Tokenization Flow
1. Property registered → SPV created
2. SPVToken contract deployed
3. Tokens minted and sold to investors
4. Investors hold tokens = property ownership
5. Revenue distributed to token holders

## ⚠️ Current Limitations

- In-memory storage (properties and purchases reset on backend restart)
- Single SPV token (multi-property support planned)
- No payment gateway integration yet
- Local blockchain only (not deployed to testnet/mainnet)

## 🔮 Future Considerations

- Layer 2 solutions (Polygon, Arbitrum) for lower gas fees
- IPFS for property documents and images
- Oracle integration for price feeds
- DAO governance for property decisions
- Multi-chain support

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

---

**Status**: MVP Complete - Enhancement Phase  
**Last Updated**: 2025

For detailed development plan, see [PROJECT_PLAN.md](./PROJECT_PLAN.md)

