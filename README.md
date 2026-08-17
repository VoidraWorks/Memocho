# Memocho

A lightweight, local-first Windows productivity app for notes and tasks — built with Tauri, React, and Cloudflare Workers.

## Monorepo structure

```
Memocho/
├── frontend/          ← Tauri desktop app (React + Vite + Rust)
│   ├── src/           ← React source (components, stores, services)
│   ├── src-tauri/     ← Rust Tauri shell
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── worker/            ← Cloudflare Workers backend (Hono + D1)
    ├── src/           ← Routes, services, middleware
    ├── db/            ← Schema + migrations
    └── package.json
```

## Getting started

### Frontend (Tauri desktop app)

```powershell
cd frontend
npm install
npm run tauri dev
```

### Backend (Cloudflare Worker)

```powershell
cd worker

# First-time setup
Copy-Item .dev.vars.example .dev.vars   # then set JWT_SECRET
npm install
npm run db:migrate:local

# Start local dev server on :8787
npm run dev
```

Set `VITE_API_URL=http://localhost:8787` in `frontend/.env.local` to connect them.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 + Rust |
| Frontend | React 19 + TypeScript + TipTap |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT + PBKDF2 (SubtleCrypto) |
| Sync | Delta sync via `/api/sync` |

## Running tests (worker)

```powershell
cd worker && npm test
```

## Deploying the worker

See [`worker/README.md`](./worker/README.md) for the full Cloudflare deployment guide.
