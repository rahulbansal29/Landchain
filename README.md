# LandChain

Tokenized real estate platform with a **MongoDB** backend (persistent data) and optional **Ethereum** integration.

## Quick start (database only)

### 1. Start MongoDB

```bash
cd backend
docker compose up -d
```

Or install [MongoDB Community](https://www.mongodb.com/try/download/community) locally.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:3000`  
Health: `http://localhost:3000/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Admin login

1. Run `npm run seed` in `backend` (creates admin from `ADMIN_WALLET` + `ADMIN_PASSWORD`).
2. Open **Admin** → use password from `.env` (`ADMIN_PASSWORD`, default `admin123`).

## Enable blockchain (optional)

1. Install [Foundry](https://book.getfoundry.sh/getting-started/installation).
2. `cd foundry && forge build`
3. Start local chain: `anvil`
4. Deploy contracts and set in `backend/.env`:
   - `BLOCKCHAIN_ENABLED=true`
   - `PRIVATE_KEY=...`
   - `KYC_REGISTRY_ADDRESS=0x...`
5. Restart backend.

## What is stored in MongoDB

| Collection | Data |
|------------|------|
| Users | Wallet logins, admin password |
| Properties | Listings, token supply |
| KYC | Submissions and approval status |
| Purchases | Buy requests and minted tokens |

Data survives server restarts.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with auto-reload |
| `npm run db:up` | Start MongoDB (Docker) |
| `npm run seed` | Create admin user |
