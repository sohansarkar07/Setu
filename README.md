# Setu — RWA Invoice Tokenization on Stellar

A production-ready decentralized application for Real-World Asset (RWA) invoice tokenization built on the Stellar blockchain. Setu enables suppliers to tokenize invoices, buyers to verify them, and investors to fund them — all on-chain via Soroban smart contracts.

**Live Demo:** https://setu-gray-delta.vercel.app

## 📋 Challenge Submission

### Contract Deployment Addresses (Testnet)
| Contract | Address |
|----------|---------|
| **Invoice Contract** | `CDWDT2VG2LSHG6D2JIEPN43UWF6NF3K5VV5RGDNIT2KF5NJJ3BWZEZIM` |
| **Token Contract** | `CCMEDRG2QBTQA27BPU4DAFOEWW2Q7WNINN6NZX4UUEBYBDJUG47THZP7` |

### Transaction Hashes (Verifiable on Stellar Expert)
| Action | Transaction Hash |
|--------|----------------|
| **Token Contract Initialized** | `59004728b4f2741782ec32f7f0d9a7b372ce0b754c2340c4b180adfe204b08d0` |
| **Invoice Contract Initialized** | `6b1abd80675bb62d09e69a1296ac256d26d71210cc5128407f2e674da02536e6` |

🔍 Verify on [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

---

## 🏗️ Architecture

```
Setu/
├── app/                    # Next.js 16 frontend
│   ├── app/
│   │   ├── mint/          # Supplier: Tokenize invoices
│   │   ├── requests/      # Buyer: Verify invoices
│   │   ├── marketplace/   # Investor: Fund invoices
│   │   ├── portfolio/     # Track investments
│   │   └── admin/         # Admin: KYC management
│   └── lib/
│       ├── soroban.ts     # Real blockchain integration
│       ├── stellar.ts     # Stellar utilities
│       └── wallet-context.tsx  # Freighter wallet connection
├── contracts/
│   ├── invoice/           # Soroban invoice smart contract (Rust)
│   └── token/             # Soroban token smart contract (Rust)
└── packages/
    ├── invoice-client/    # Auto-generated TS bindings
    └── token-client/      # Auto-generated TS bindings
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Rust + `wasm32v1-none` target
- Stellar CLI (`cargo install stellar-cli`)
- [Freighter Wallet](https://freighter.app) browser extension

### 1. Clone & Install
```bash
git clone https://github.com/sohansarkar07/Setu.git
cd Setu
npm install
```

### 2. Environment Setup
Create `.env.local` in the root:
```env
NEXT_PUBLIC_INVOICE_CONTRACT_ID=CDWDT2VG2LSHG6D2JIEPN43UWF6NF3K5VV5RGDNIT2KF5NJJ3BWZEZIM
NEXT_PUBLIC_TOKEN_CONTRACT_ID=CCMEDRG2QBTQA27BPU4DAFOEWW2Q7WNINN6NZX4UUEBYBDJUG47THZP7
```

### 3. Run the App
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Build Smart Contracts (Optional)
```bash
# Install Rust target
rustup target add wasm32v1-none

# Compile contracts
cd contracts
stellar contract build

# Deploy to testnet
stellar keys generate deployer --network testnet --fund
stellar contract deploy --wasm target/wasm32v1-none/release/setu_invoice.wasm --source deployer --network testnet
```

---

## 🔗 Smart Contract Interaction

The frontend uses **auto-generated TypeScript bindings** (via `stellar contract bindings typescript`) to call on-chain functions:

```typescript
// Real on-chain transaction example
const txHash = await mintInvoiceOnChain(
  supplierPublicKey,
  buyerPublicKey,
  BigInt(1000_0000000n), // 1000 USDC (7 decimals)
  "Invoice for web design services",
  BigInt(Math.floor(Date.now() / 1000) + 86400 * 30) // 30 days
);
```

All transactions go through Freighter for user signing — no private keys are ever stored!

---

## ⚠️ Error Handling (3 Types)

| Error Type | Example | Handling |
|-----------|---------|----------|
| **User Rejected** | User clicks "Cancel" in Freighter | Shows error notification |
| **KYC Not Approved** | Investor not approved | Blocks funding, prompts KYC |
| **Contract Error** | Invalid status / duplicate | Shows specific on-chain error |

---

## 🌐 Multi-Wallet Support

- **Freighter** — Primary Stellar wallet (fully integrated)
- Add xBull or other wallets via `@stellar/freighter-api` compatibility layer

---

## 📱 Mobile Responsive

The UI uses a mobile-first responsive design with a bottom navigation bar on small screens and a sidebar on desktop.

---

## 🔄 CI/CD Pipeline

GitHub Actions automatically builds and lints on every push to `main`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 📄 License

MIT
