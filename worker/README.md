# Memocho Worker — Cloudflare Backend

Cloudflare Workers + D1 backend for the Memocho desktop app.

## Quick start

```powershell
# 1. Install dependencies
cd worker
npm install

# 2. Create local secrets file
Copy-Item .dev.vars.example .dev.vars
# Edit .dev.vars and set JWT_SECRET to a strong random value

# 3. Apply database migrations locally
npm run db:migrate:local

# 4. Start local dev server (port 8787)
npm run dev
```

The frontend reads `VITE_API_URL` — create `.env.local` in the project root:
```
VITE_API_URL=http://localhost:8787
```

## Project structure

```
worker/
├── src/
│   ├── index.ts              ← Hono app entry point
│   ├── routes/
│   │   ├── auth.ts           ← POST /api/auth/{register,login,refresh,logout}
│   │   ├── notes.ts          ← CRUD /api/notes
│   │   ├── tasks.ts          ← CRUD /api/tasks
│   │   ├── settings.ts       ← /api/settings
│   │   └── sync.ts           ← POST /api/sync
│   ├── services/
│   │   ├── auth.ts           ← Register/login/token business logic
│   │   ├── notes.ts          ← Note CRUD + tag handling
│   │   ├── tasks.ts          ← Task CRUD + auto-position
│   │   └── sync.ts           ← Delta push/pull orchestration
│   ├── middleware/
│   │   └── auth.ts           ← JWT verification middleware
│   ├── db/
│   │   └── queries.ts        ← All D1 SQL (typed wrappers)
│   ├── lib/
│   │   ├── auth.ts           ← PBKDF2 hashing + JWT sign/verify
│   │   ├── validation.ts     ← Request body validators
│   │   └── response.ts       ← Consistent JSON response helpers
│   ├── types/
│   │   └── index.ts          ← Shared TypeScript types
│   └── test/
│       ├── helpers.ts        ← Shared test setup
│       ├── auth.test.ts
│       ├── notes.test.ts
│       ├── tasks.test.ts
│       └── sync.test.ts
├── db/
│   ├── schema.sql            ← Reference schema
│   └── migrations/
│       └── 0001_initial.sql  ← Wrangler migration
├── wrangler.toml
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## API reference

All endpoints return `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get tokens |
| POST | `/api/auth/refresh` | No | Rotate refresh token |
| POST | `/api/auth/logout` | Yes | Revoke all refresh tokens |

### Notes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List (supports `?since=ISO`) |
| POST | `/api/notes` | Create |
| GET | `/api/notes/:id` | Get by ID |
| PUT | `/api/notes/:id` | Update |
| DELETE | `/api/notes/:id` | Soft-delete |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List (supports `?date=YYYY-MM-DD`, `?since=ISO`) |
| POST | `/api/tasks` | Create |
| GET | `/api/tasks/:id` | Get by ID |
| PUT | `/api/tasks/:id` | Update |
| DELETE | `/api/tasks/:id` | Soft-delete |

### Settings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Get cross-device settings |
| PUT | `/api/settings` | Upsert settings |

### Sync
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sync` | Push local deltas, pull server changes |

**Sync request:**
```json
{
  "lastSyncedAt": "2025-01-01T10:00:00.000Z",
  "notes": [...],
  "tasks": [...]
}
```

**Sync response:**
```json
{
  "notes": [...],
  "tasks": [...],
  "deletedNoteIds": ["uuid", ...],
  "deletedTaskIds": ["uuid", ...],
  "syncedAt": "2025-01-15T10:00:00.000Z"
}
```

## Running tests

```powershell
cd worker
npm test
```

## Deploying

```powershell
# 1. Create D1 database on Cloudflare
npx wrangler d1 create memocho-db

# 2. Update wrangler.toml with the returned database_id

# 3. Set the JWT_SECRET as a Cloudflare secret
npx wrangler secret put JWT_SECRET

# 4. Apply migrations to production
npm run db:migrate:prod

# 5. Deploy
npm run deploy
```

## Security notes

- Passwords hashed with PBKDF2 (100,000 iterations, SHA-256, 32-byte key)
- Refresh tokens stored as SHA-256 hashes — raw token never persisted
- Every query includes `WHERE user_id = ?` — impossible to access another user's data
- JWT secrets loaded from Cloudflare secrets — never in source code or logs
- CORS restricted to `tauri://localhost` in production
