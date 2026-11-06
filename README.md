# VoucherBox – BOT Chain Digital Voucher dApp 🎟️

**VoucherBox** is a decentralized Web3 application on **BOT Chain** that enables businesses to launch promotional digital discount voucher campaigns, and customers to claim, store, and present verifiable voucher QR passes for instant redemption.

The application interacts directly with an on-chain Solidity smart contract (`VoucherBox.sol`) deployed to BOT Chain.

---

## 🌐 BOT Chain Network Parameters

Per official BOT Chain network specifications:

### **BOT Chain Testnet**
* **Network Name:** BOT Chain Testnet
* **Chain ID:** `968` (`0x3c8`)
* **RPC Endpoint:** `https://rpc.bohr.life`
* **Native Token:** `BOT`
* **Total Supply:** 150 Million
* **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)

### **BOT Chain Mainnet**
* **Network Name:** BOT Chain
* **Chain ID:** `677` (`0x2a5`)
* **RPC Endpoint:** `https://rpc.botchain.ai`
* **Native Token:** `BOT`
* **Block Explorer:** [https://scan.botchain.ai/](https://scan.botchain.ai/)

---

## 🚀 Core Features

1. **Wallet Connection & Network Detection**
   * Multi-wallet connection powered by **Reown AppKit (Web3Modal) + Wagmi v2 + Viem**.
   * Real-time network detection with a 1-click **"Switch to BOT Chain"** prompt if connected to an unsupported network.
   * Native BOT token balance display.

2. **Explore & Claim Vouchers**
   * Real-time list of all active merchant campaigns directly from the contract.
   * Filter by discount type (% percentage or fixed BOT) or claimable status.
   * Interactive progress bar for claimed quota vs. maximum claims.
   * Countdown timer to campaign expiration.
   * Enforced duplicate-claim prevention per wallet address.

3. **My Vouchers & QR Code Passes**
   * Personal customer ticket drawer displaying all claimed discount passes.
   * Live status tracking: `Active`, `Redeemed`, `Expired`, `Cancelled`.
   * Dynamic high-contrast QR Code generation (`qrcode.react`) embedding cryptographic voucher verification data.
   * 1-click Voucher ID copy for manual entry at checkout.

4. **Business Dashboard (Merchant Center)**
   * **Campaign Launchpad**: Create campaigns with custom title, discount type (% or fixed units), maximum claims limit, and validity period.
   * **Live Ticket Preview**: Real-time visualization before submitting the transaction to the blockchain.
   * **Merchant Analytics**: Track total campaigns launched, total claims, redemptions, and conversion rate.
   * **Campaign Management**: Cancel active campaigns directly from the table.

5. **Voucher Verification & Redemption Scanner**
   * Merchant lookup tool: enter Voucher ID or paste scanned QR code JSON.
   * Live on-chain status query (`getVoucher`).
   * Strict access control: **Only the authorized campaign owner wallet can redeem vouchers**.
   * Instant status feedback (`VALID & REDEEMABLE`, `ALREADY REDEEMED`, `EXPIRED`, `CANCELLED`).
   * Direct block explorer transaction links (`scan.bohr.life`).

---

## 🛠️ Smart Contract Architecture (`VoucherBox.sol`)

The contract is written in Solidity `^0.8.20` with custom errors for gas efficiency:

* `createCampaign(string name, DiscountType type, uint256 value, uint256 maxClaims, uint256 expiryDate)`
* `claimVoucher(uint256 campaignId)`
* `redeemVoucher(uint256 voucherId)`
* `cancelCampaign(uint256 campaignId)`
* `getCampaign(uint256 campaignId)`
* `getUserVouchers(address customer)`
* `getOwnerCampaigns(address merchant)`
* `getAllCampaigns()`
* `getVoucher(uint256 voucherId)`

### Events Emitted
* `event CampaignCreated(uint256 indexed campaignId, address indexed owner, string name, ...)`
* `event VoucherClaimed(uint256 indexed voucherId, uint256 indexed campaignId, address indexed customer, uint256 timestamp)`
* `event VoucherRedeemed(uint256 indexed voucherId, uint256 indexed campaignId, address indexed customer, address business, uint256 timestamp)`
* `event CampaignCancelled(uint256 indexed campaignId, address indexed owner, uint256 timestamp)`

---

## 📦 Getting Started

### 1. Prerequisites
* Node.js v18+ (tested on Node v20/v24)
* A Web3 wallet (such as MetaMask or OKX Wallet)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Smart Contract Tests
Run the comprehensive Hardhat test suite (20 unit tests covering all features, edge cases, and access controls):
```bash
npm test
```

### 4. Configure Environment
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Add your deployer private key (without `0x`):
```ini
PRIVATE_KEY=your_private_key_here
BOTCHAIN_TESTNET_RPC=https://rpc.bohr.life
BOTCHAIN_MAINNET_RPC=https://rpc.botchain.ai
VITE_REOWN_PROJECT_ID=b56e18d47c72ab683b10814fe9495694
```

### 5. Deploy Smart Contract to BOT Chain Testnet
```bash
npm run deploy:testnet
```
*The deployment script automatically compiles `VoucherBox.sol`, deploys it to BOT Chain Testnet (Chain ID 968), and exports the deployed contract address and ABI to `src/contracts/` for immediate frontend use.*

*(Optional)* Seed sample campaigns on-chain:
```bash
npm run seed:testnet
```

### 6. Start the Frontend Application
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 In-App Contract Configuration
You can also change or update the contract address directly within the web app at runtime:
1. Click the **Contract** pill in the top navbar.
2. Paste any deployed contract address (`0x...`).
3. Click **Save Address** (persists in `localStorage`).

---

## 📜 License
MIT

