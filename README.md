# AgreeStellar Monorepo

Turborepo monorepo for the AgreeStellar platform.

## Structure

```
apps/
  frontend/   # Next.js 14 app
  backend/    # Node.js / Express API
contracts/
  agreestellar/  # Soroban (Rust) smart contract
packages/
  types/      # Shared TypeScript types
```

## Getting Started

```bash
npm install
npm run dev       # start frontend + backend
npm run build     # build all apps
```

## Contracts

Requires [Rust](https://rustup.rs/) and the `wasm32-unknown-unknown` target:

```bash
rustup target add wasm32-unknown-unknown
cd contracts
cargo test
cargo build --release --target wasm32-unknown-unknown
```
