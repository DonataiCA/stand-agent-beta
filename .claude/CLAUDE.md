# Stand-Agent — Project Guide

## Overview
Lead capture agent for tech events. Users capture leads via Telegram (audio, text, photos), an AI agent (OpenClaw) processes and enriches them, data is stored in PostgreSQL+pgvector, and a React dashboard provides visualization.

## Architecture

```
Telegram → n8n (audio transcription only) → OpenClaw (AI brain)
                                                  ↓
                                           Backend API (Express)
                                                  ↓
                                         PostgreSQL + pgvector
                                                  ↓
                                          React Dashboard (Vite)
```

### Components
- **Telegram Bot**: Single entry point for all inputs (audio, text, photo, queries)
- **n8n**: External instance (already deployed), handles ONLY audio→text transcription via OpenAI Whisper
- **OpenClaw**: AI agent in Docker, connects to Telegram, uses Claude/GPT as LLM backend. Skills defined via SKILL.md files, calls backend via curl.
- **Backend API**: Node.js + Express + TypeScript + Prisma — bridges OpenClaw ↔ database
- **PostgreSQL + pgvector**: Data storage with vector similarity search (768-dim Gemini embeddings)
- **Frontend**: React + Vite + TailwindCSS dashboard

## Tech Stack
| Component | Tool |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 4.x |
| ORM | Prisma 6.x (with postgresqlExtensions preview) |
| Validation | Zod 3.x |
| Queue | Bull 4.x + Redis |
| Auth | JWT (per-user secrets) + API Key (service-to-service) |
| DB | PostgreSQL 16 + pgvector |
| Embeddings | Gemini Embedding API (gemini-embedding-001, 768-dim) |
| File Storage | AWS S3 (optional) |
| Logging | Winston |

## Backend Structure (backend/src/)
```
config/          → Singleton configs (prisma client, queue instances)
controllers/     → HTTP handlers, orchestrate validators→repos→transformers
middlewares/     → Auth (JWT, API key, dual), error handling
repositories/    → Database access layer (Prisma queries)
routes/          → Express Router definitions, middleware application
transformers/    → Shape DB objects → API response format
utils/           → Helpers: jwt, s3, logger, error
validators/      → Zod schemas + validation functions (grouped by domain/)
workers/         → Bull queue processors
```

## Route Prefix
All routes use `/api/` prefix: `/api/users`, `/api/leads`, `/api/events`, `/api/media`, `/api/queue`

## Authentication
- **Dashboard (users)**: JWT with per-user secrets in DB → `authenticate` middleware
- **OpenClaw (services)**: API key via `X-API-Key` header → `authenticateApiKey` middleware
- **Dual access**: `authenticateAny` tries API key first, falls back to JWT
- Port: 3000

## Conventions

### Adding a New Domain
1. **Prisma model** → `prisma/schema.prisma`, then `npm run db:migrate`
2. **Validators** → `src/validators/{domain}/` — one file per operation
3. **Repository** → `src/repositories/{domain}.repository.ts`
4. **Transformer** → `src/transformers/{domain}.transformer.ts`
5. **Controller** → `src/controllers/{domain}.controller.ts`
6. **Routes** → `src/routes/{domain}.routes.ts`
7. **Register** → `src/app.ts` → `app.use('/api/{domain}', domainRoutes)`

### Patterns (see docs/BACKEND-PATTERNS.md for full examples)
- Validators: Zod schemas, `schema.parse(req.body)`, throw on failure
- Repositories: Object literal with methods, return Prisma promises
- Controllers: Object literal with async methods, try/catch + sendError()
- Transformers: Strip internal fields, use `?? null` for optionals
- Routes: Express Router, apply middleware per-route

### Error Response: `{ "error": "message" }`
### List Response: `{ "data": [...], "pagination": { page, limit, total, pages } }`

## Commands
```bash
cd backend
npm run dev            # Hot-reload dev server (port 3000)
npm run build          # Compile TypeScript → dist/
npm start              # Production
npm run db:migrate     # Prisma migrations
npm run db:reset       # Reset DB (destructive!)
npm run db:generate    # Regenerate Prisma client
npm run seed           # Seed admin user + test event
docker-compose up -d   # Start PostgreSQL+pgvector + Redis (from project root)
```

## Environment Variables (backend/env.example)
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/standagent
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
API_SECRET_KEY=...             # OpenClaw→Backend service auth
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION / AWS_S3_BUCKET
GEMINI_API_KEY=...             # For embedding generation
```

## Key Decisions
- n8n is an **external instance** (already deployed), not local Docker
- Embeddings use **Gemini API free tier** (768-dim), NOT local Ollama
- OpenClaw communicates with backend via HTTP REST + API key
- Audio: n8n → Telegram `[LEAD]` prefix → OpenClaw
- No Google/Apple OAuth — email/password auth only
- Per-user JWT secrets (not a single app secret)

## Project Status
- [x] Backend scaffold (auth, users, media, queues)
- [x] Lead + Event Prisma models with pgvector support
- [x] Lead CRUD + enrich endpoint
- [x] Event CRUD + stats endpoint
- [x] API key middleware for OpenClaw
- [x] Dual auth middleware (JWT or API key)
- [x] Docker Compose (PostgreSQL+pgvector + Redis)
- [x] Routes migrated to /api/ prefix
- [x] Google/Apple OAuth removed
- [ ] Embeddings generation (Gemini API integration)
- [ ] Vector similarity search (pgvector queries)
- [ ] RAG query endpoint
- [ ] OpenClaw setup + skills
- [ ] n8n audio transcription workflow
- [ ] React dashboard
