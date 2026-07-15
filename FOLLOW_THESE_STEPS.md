# 🎯 LandChain - Quick Start Guide

## ✅ Running the Platform

### Step 1: Start Blockchain (persistent)
```powershell
cd foundry
anvil --state anvil-state.json
```
Keep this terminal open. The `--state` flag saves the whole chain to
`anvil-state.json` on exit and reloads it on the next start — so deployed
contracts, KYC approvals, and token balances **survive restarts**.
(Shortcut: from the `backend` folder you can run `npm run chain`, which does the same thing.)

### Step 2: Deploy KYC Registry (First Time Only)
```powershell
cd foundry
forge build
forge script script/DeploySPVToken.s.sol:DeploySPVToken --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```
Copy the **KYCRegistry address** to `backend/.env`.  
**Note:** SPVToken contracts are deployed automatically when admin creates properties.

**Because the chain now persists, you only do Step 2 once.** As long as you keep
`anvil-state.json` and always start Anvil with `--state`, you never redeploy or
recreate properties again. If you ever delete `anvil-state.json`, the chain
resets — then clear stale data (`db.properties`, `db.purchases`, `db.kycs` in
MongoDB) and redo Step 2.

### Step 3: Start Backend
```powershell
cd backend
npm start
```
Backend runs on http://localhost:3000

### Step 4: Start Frontend
```powershell
cd frontend
npm run dev
```  
Frontend runs on http://localhost:5173

### Step 5: Access the Platform
1. Open browser at **http://127.0.0.1:5173**  
2. Click **"Connect Wallet"** → Use MetaMask with admin wallet: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. Navigate to **Admin Panel** to manage properties and KYC approvals

---

## 🧪 Testing the Flow

### Complete User Journey

**1. Admin Setup (First Time)**
- Go to Admin Panel → Create Property
- Fill in property details and submit
- Backend automatically deploys a new SPVToken contract for this property
- Each property gets its own unique token (e.g., "Luxury Villa Token" - LVT)

**2. User KYC Submission**
- Go to KYC Form → Submit wallet and details
- Admin approves via Admin Panel → Pending KYC Applications

**3. User Token Purchase**
- Go to Buy Tokens → Select property and enter amount
- Submit purchase request
- Admin mints tokens via Admin Panel → Pending Purchase Requests

**4. View Portfolio**
- Go to Portfolio → Enter wallet address → View holdings

---

## 🔧 Troubleshooting

### Backend Not Starting
- Check `.env` file has all required variables
- Ensure Anvil blockchain is running
- Contract addresses match deployment output

### Frontend Not Loading
- Clear browser cache: `Ctrl + Shift + Delete`
- Use `http://127.0.0.1:5173` (not localhost)
- Check console for errors (F12)

### Wallet Connection Issues
- Use correct admin wallet address
- Check MetaMask is connected to local network (Chain ID: 31337)
- Import Anvil test account if needed

### Admin Panel Not Accessible
- Ensure wallet is connected
- Admin wallet must be in `ADMIN_WALLETS` env variable
- Clear localStorage and reconnect wallet

---

## 📂 Project Structure

```
LandChain/
├── foundry/              # Smart contracts
├── backend/              # API server
├── frontend/             # React app
├── README.md             # Full documentation
└── FOLLOW_THESE_STEPS.md # This guide
```

---

## 🆘 Quick Reset

If everything breaks, run these commands:

```powershell
# Stop all Node processes
Get-Process -Name node | Stop-Process -Force

# Restart Anvil (persistent — reloads your saved chain)
cd foundry
anvil --state anvil-state.json

# Restart backend
cd backend
npm start

# Restart frontend
cd frontend
npm run dev
```

**Full wipe (only if you want a truly clean chain):** stop Anvil, delete
`foundry/anvil-state.json`, clear stale MongoDB data, then start Anvil with
`--state` again and redo Step 2 (deploy KYC Registry):

```powershell
# clear stale DB records that referenced the old chain
mongosh "mongodb://localhost:27017/landchain" --eval "db.properties.deleteMany({}); db.purchases.deleteMany({}); db.kycs.deleteMany({});"
```

---

**Need more details?** See [README.md](./README.md)
