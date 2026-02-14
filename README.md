# LandChain 🏗️

**Tokenized Real Estate Platform** - Fractional ownership of properties through blockchain tokens

## 📖 Overview

LandChain is a blockchain-based platform that enables fractional ownership of real estate properties through ERC20 tokens. Properties are tokenized as SPVTokens (Special Purpose Vehicle Tokens), allowing multiple investors to own portions of real estate assets with KYC compliance built into the system.

## 🎯 What It Does

- **Property Tokenization**: Real estate properties are represented as ERC20 tokens
- **Fractional Ownership**: Multiple investors can purchase tokens representing shares in properties
- **KYC Compliance**: Only verified (KYC-approved) addresses can hold and transfer tokens
- **Admin Management**: Administrators can approve KYC applications and manage token operations
- **Investment Platform**: Users can buy tokens, view their portfolio, and track property investments

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
│  - SPVToken      │     - ERC20 tokens with KYC
│  - KYCRegistry   │     - KYC management
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
├── foundry/              # Smart Contracts
│   ├── src/
│   │   ├── tokens/SPVToken.sol
│   │   └── registries/KYCRegistry.sol
│   └── script/DeploySPVToken.s.sol
│
├── backend/              # API Server
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Blockchain integration
│   └── server.js
│
└── landchain-frontend/   # React App
    ├── src/
    │   ├── pages/       # Route pages
    │   ├── components/  # Reusable components
    │   └── services/    # API client
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Foundry (Forge, Anvil)
- MetaMask or Web3 wallet (for production)

### 1. Start Local Blockchain
```bash
cd foundry
anvil
```

### 2. Deploy Contracts
```bash
cd foundry
forge build
forge script script/DeploySPVToken.s.sol:DeploySPVToken \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <your_private_key> \
  --broadcast
```

### 3. Setup Backend
```bash
cd backend
npm install
# Create .env file with:
# RPC_URL=http://127.0.0.1:8545
# PRIVATE_KEY=your_private_key
# SPV_TOKEN_ADDRESS=<from deployment>
# KYC_REGISTRY_ADDRESS=<from deployment>
# TOKEN_PRICE=100
# JWT_SECRET=replace_with_strong_secret
# ADMIN_WALLETS=0xAdminAddress1,0xAdminAddress2
# DATABASE_URL=postgresql://user:password@localhost:5432/landchain
# CORS_ORIGINS=http://localhost:5173

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

npm start
```

### 4. Setup Frontend
```bash
cd landchain-frontend
npm install
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal)

## 📋 Current Features (MVP)

✅ **KYC System**
- Submit KYC applications
- Check KYC status
- Admin approval workflow

✅ **Token Management**
- Buy tokens (money → tokens conversion)
- Check token balance
- View token information

✅ **Admin Panel**
- Approve/reject KYC applications
- Mint tokens manually
- System management

✅ **Property Display**
- Browse available properties
- View property details
- Check token holdings

## 🗺️ Development Roadmap

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed roadmap and next steps.

### Immediate Priorities
1. Database integration (KYC documents, user data)
2. Wallet connection (MetaMask/Web3)
3. File upload for KYC documents
4. Comprehensive testing

### Planned Features
- Multi-property support
- Payment gateway integration
- Dividend distribution
- Secondary market for tokens
- Mobile app

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Comprehensive project plan and roadmap
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
SPV_TOKEN_ADDRESS=0x...
KYC_REGISTRY_ADDRESS=0x...
TOKEN_PRICE=100
JWT_SECRET=replace_with_strong_secret
ADMIN_WALLETS=0xAdminAddress1,0xAdminAddress2
DATABASE_URL=postgresql://user:password@localhost:5432/landchain
CORS_ORIGINS=http://localhost:5173
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

- KYC submission is placeholder (no document storage)
- Wallet login is implemented, but some views still allow manual address input
- Single property support (one SPV token)
- Database only covers KYC metadata and purchase intents (no document storage yet)
- Limited test coverage

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

