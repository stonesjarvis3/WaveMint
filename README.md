# WaveMint
# WaveMint 🌊

> Create and launch Stellar-native tokens with built-in price discovery, liquidity generation, and decentralized market access — powered by Soroban smart contracts.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Built on Stellar](https://img.shields.io/badge/built%20on-Stellar-7C3AED)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/smart%20contracts-Soroban-00E5FF)](https://soroban.stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-64%25-3178C6)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-32%25-CE422B)](https://www.rust-lang.org)

---

## Overview

Launching a token on most blockchains is a multi-step process requiring deep technical knowledge, upfront liquidity, and centralised exchange access. WaveMint removes every one of those barriers.

Any wallet holder on Stellar can deploy a new token in minutes: configure supply, set a bonding curve for price discovery, and WaveMint's Soroban contract handles the rest — minting, distribution, and automated liquidity migration to the Stellar native DEX when the fundraising target is reached. No seed liquidity required. No market makers needed. The contract is the market maker.

WaveMint also ships a Telegram bot that alerts subscribers to new token launches, migration events, and price milestones in real time — bringing the launchpad experience directly into group chats and communities.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Freighter                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Frontend  (Next.js / React)             │  │
│  │  /          Token launchpad + explore                │  │
│  │  /launch    Create new token wizard                  │  │
│  │  /token/[id] Price chart + buy/sell panel            │  │
│  │  /portfolio  My tokens + positions                   │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                        │ REST API                           │
└────────────────────────┼───────────────────────────────────┘
                         │
          ┌──────────────▼──────────────────────┐
          │       Backend  (Express / TS)        │
          │                                      │
          │  POST /tokens                        │
          │  GET  /tokens                        │
          │  GET  /tokens/:id                    │
          │  POST /tokens/:id/buy                │
          │  POST /tokens/:id/sell               │
          │  POST /tokens/:id/migrate            │
          │  GET  /health                        │
          └───────────┬──────────────────────────┘
                      │
         ┌────────────▼─────────────────────────┐
         │      Soroban Contract (wavemint)      │
         │                                      │
         │  create_token()                      │
         │  buy()                               │
         │  sell()                              │
         │  migrate()        ──────────────────►│──► Stellar DEX
         │  current_price()                     │
         │  get_token()                         │
         └────────────┬─────────────────────────┘
                      │
               Stellar Network
               (Testnet / Mainnet)

┌──────────────────────────────────┐
│    Telegram Bot  (telegram-bot/) │
│                                  │
│  /new     — new launch alerts    │
│  /price   — price queries        │
│  /migrate — migration alerts     │
│  Horizon polling every 30s       │
└──────────────────────────────────┘
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js / React, TypeScript, Tailwind CSS |
| Backend | Node.js 20, Express, TypeScript |
| Smart Contract | Rust, Soroban SDK `22.0.0` |
| Telegram Bot | Node.js / TypeScript (`node-telegram-bot-api`) |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Stellar SDK | `@stellar/stellar-sdk` |
| Network | Stellar Testnet / Mainnet |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Rust stable + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-stellar-cli)
- [Freighter wallet extension](https://freighter.app)

### 1. Clone and configure

```bash
git clone https://github.com/stonesjarvis3/WaveMint.git
cd WaveMint
cp .env.example .env.local
# Fill in CONTRACT_ID, TELEGRAM_BOT_TOKEN, DATABASE_URL
```

### 2. Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Telegram bot
cd ../telegram-bot && npm install
```

### 3. Build and test the contract

```bash
cd contracts
rustup target add wasm32-unknown-unknown
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### 4. Deploy to Stellar testnet

```bash
# Fund a testnet identity
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# Deploy
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/wavemint.wasm \
  --source deployer \
  --network testnet

# Copy the returned contract ID into .env.local as CONTRACT_ID
```

### 5. Run the stack

```bash
# Terminal 1 — Frontend (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2 — Backend (http://localhost:3001)
cd backend && npm run start:dev

# Terminal 3 — Telegram bot
cd telegram-bot && npm run start
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `CONTRACT_ID` | Deployed Soroban WaveMint contract ID | Yes |
| `NEXT_PUBLIC_CONTRACT_ID` | Contract ID for frontend | Yes |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` | Yes |
| `NEXT_PUBLIC_HORIZON_URL` | Horizon API endpoint | Yes |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot API token from @BotFather | Yes |
| `PORT` | Backend server port (default: 3001) | No |

---

## Contract API

The `wavemint` Soroban contract exposes the following public functions:

| Function | Arguments | Description |
|---|---|---|
| `create_token(creator, name, ticker, total_supply, target_xlm)` | `Address, String, String, i128, i128` | Deploy a new token with bonding curve parameters |
| `buy(buyer, token_id, xlm_in)` | `Address, BytesN<32>, i128` | Buy tokens along the bonding curve; returns tokens received |
| `sell(seller, token_id, tokens_in)` | `Address, BytesN<32>, i128` | Sell tokens back along the curve; returns XLM received |
| `migrate(token_id)` | `BytesN<32>` | Permissionless migration to Stellar DEX when `xlm_raised ≥ target_xlm`; burns unsold tokens |
| `current_price(token_id)` | `BytesN<32>` | Returns current price in XLM per token (7 decimal precision) |
| `get_token(token_id)` | `BytesN<32>` | Returns full token metadata, raise progress, and status |

### Token Status Lifecycle

```
Created → Fundraising → Migrated (trading on Stellar DEX)
```

### Bonding Curve

WaveMint uses a constant-product AMM for price discovery:

```
k = virtual_xlm × virtual_tokens   (constant throughout lifecycle)
tokens_out = virtual_tokens - k / (virtual_xlm + xlm_in)
price = virtual_xlm / virtual_tokens  (at any point)
```

Virtual reserves are seeded at contract initialisation. Price rises with every buy and falls with every sell — ensuring fair price discovery from block one.

---

## Pages

| Route | Description |
|---|---|
| `/` | Token launchpad — browse all launches (live + migrated), stats, filter + sort |
| `/launch` | Create new token wizard — name, ticker, supply, target, confirm + sign |
| `/token/[id]` | Token detail — bonding curve chart, buy/sell panel, migration progress, activity feed |
| `/portfolio` | My tokens — launched and held positions, earnings, migration history |

---

## Telegram Bot Commands

| Command | Description |
|---|---|
| `/start` | Subscribe to WaveMint alerts |
| `/new` | List the latest token launches |
| `/price [ticker]` | Get current price and raise progress for a token |
| `/migrate [ticker]` | Check if a token is eligible for DEX migration |
| `/stop` | Unsubscribe from alerts |

The bot polls Horizon `contract_events` every 30 seconds and pushes notifications for: new launches, buy/sell events above a threshold, and DEX migrations.

---

## Project Structure

```
WaveMint/
├── frontend/                    # Next.js / React app
│   ├── app/                     # App Router pages
│   ├── components/              # UI components
│   └── lib/                     # Stellar SDK helpers, bonding curve math
├── backend/                     # Express API server
│   └── src/
│       ├── routes/              # REST endpoints
│       └── services/            # Soroban RPC calls, event indexing
├── contracts/                   # Rust Soroban contract
│   └── src/
│       ├── lib.rs               # Contract entry points
│       └── test.rs              # Cargo test suite
├── telegram-bot/                # Telegram notification bot
│   └── src/
│       ├── bot.ts               # Bot setup and commands
│       └── poller.ts            # Horizon event polling
└── README.md
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change, then submit a pull request against `main`.

**Quick rules:**
- One concern per PR
- For contract changes, include `cargo test` output in the PR description
- No TypeScript `any` types
- Follow Conventional Commits for commit messages

---

## Stellar Testnet Resources

- [Stellar Laboratory](https://laboratory.stellar.org) — inspect accounts, transactions, and contracts
- [Friendbot](https://friendbot.stellar.org) — fund a testnet account with free XLM
- [Soroban Testnet RPC](https://soroban-testnet.stellar.org) — RPC endpoint for contract calls
- [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet) — block explorer

---

## License

MIT © [stonesjarvis3](https://github.com/stonesjarvis3)
