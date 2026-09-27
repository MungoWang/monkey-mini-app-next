# Mohou monorepo source pack

Version: 1.0.0
Packed: 2026-09-27T06:25:11.044Z
Files: 1282

## Unpack

```sh
mkdir -p monkey-mini-app-next && tar -xzf monkey-mini-app-next-1.0.0-source-20260927.tgz -C monkey-mini-app-next
cd monkey-mini-app-next
```

## Run on the other machine

Needs **Node.js ^22.19 || >=24**, **pnpm 11.7**, and (for the window) **Rust + cargo**.

```sh
pnpm install
pnpm build:panel
pnpm build:window
pnpm dev:host
```

Optional ship tracks after install:

```sh
pnpm dist:local   # folder app under artifacts/local-app
pnpm dist:app     # macOS Mohou.app + dmg (darwin only)
```

This archive excludes `node_modules`, `artifacts/`, Cargo `target/`, coverage, vendor, and other gitignored build output. It does not embed secrets (`.env` stays out via gitignore).
