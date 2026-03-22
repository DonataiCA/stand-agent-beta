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
- **OpenClaw**: AI agent in Docker, connects to Telegram, uses Claude/GPT as LLM backend
- **Backend API**: Node.js + Express + TypeScript + Prisma — bridges OpenClaw ↔ database
- **PostgreSQL + pgvector**: Data storage with vector similarity search (768-dim Gemini embeddings)
- **Frontend**: React + Vite + TailwindCSS dashboard

## Tech Stack
| Component | Tool |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 4.x |
| ORM | Prisma 6.x |
| Validation | Zod 3.x |
| Queue | Bull 4.x + Redis |
| Auth | JWT (per-user secrets) + bcrypt |
| DB | PostgreSQL 16 + pgvector |
| Embeddings | Gemini Embedding API (gemini-embedding-001, 768-dim) |
| File Storage | AWS S3 |
| Logging | Winston |

## Backend Structure (backend/src/)
```
config/          → Singleton configs (prisma client, queue instances)
controllers/     → HTTP handlers, orchestrate validators→repos→transformers
middlewares/     → Auth (JWT), error handling
repositories/    → Database access layer (Prisma queries)
routes/          → Express Router definitions, middleware application
transformers/    → Shape DB objects → API response format
utils/           → Helpers: jwt, s3, logger, oauth, error
validators/      → Zod schemas + validation functions (grouped by domain)
workers/         → Bull queue processors
```

## Conventions

### Adding a New Domain (e.g., "leads")

1. **Prisma model** → `prisma/schema.prisma`, then run `npm run db:migrate`
2. **Validator** → `src/validators/{domain}/` — one file per operation
3. **Repository** → `src/repositories/{domain}.repository.ts`
4. **Transformer** → `src/transformers/{domain}.transformer.ts`
5. **Controller** → `src/controllers/{domain}.controller.ts`
6. **Routes** → `src/routes/{domain}.routes.ts`
7. **Register route** → `src/app.ts` → `app.use('/{domain}', domainRoutes)`

### Validator Pattern (Zod)
```typescript
// src/validators/{domain}/{operation}.validator.ts
import { z } from 'zod';
import { Request } from 'express';

export const mySchema = z.object({
    field: z.string().min(1, 'Field is required'),
});

export function validateMyOperation(req: Request) {
    return mySchema.parse(req.body);  // throws ZodError on failure
}
```

### Repository Pattern
```typescript
// src/repositories/{domain}.repository.ts
import { prisma } from '../config/prisma';

export const DomainRepository = {
    findAll: (skip: number, take: number, filters?: { search?: string }) => {
        const where: Record<string, unknown> = {};
        // build where clause from filters
        return prisma.domain.findMany({ skip, take, where });
    },
    findById: (id: string) => prisma.domain.findUnique({ where: { id } }),
    create: (data: CreateInput) => prisma.domain.create({ data }),
    update: (id: string, data: Partial<UpdateInput>) => prisma.domain.update({ where: { id }, data }),
    delete: (id: string) => prisma.domain.delete({ where: { id } }),
    count: (filters?: { search?: string }) => prisma.domain.count({ where }),
};
```

### Controller Pattern
```typescript
// src/controllers/{domain}.controller.ts
export const DomainController = {
    index: async (req: Request, res: Response) => {
        try {
            const validated = validateSomething(req);
            const data = await DomainRepository.findAll(...);
            res.json({ data: transformMany(data), pagination: {...} });
        } catch (error) {
            return sendError(res, 400, 'Error message', error);
        }
    },
};
```

### Transformer Pattern
```typescript
// src/transformers/{domain}.transformer.ts
export const transformDomain = (item: DbType) => ({
    id: item.id,
    // map only fields needed by the client, exclude sensitive data
});
export const transformDomains = (items: DbType[]) => items.map(transformDomain);
```

### Route Pattern
```typescript
// src/routes/{domain}.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
const router = Router();
router.get('/', authenticate, Controller.index);        // protected
router.post('/', Controller.create);                     // public (or protected)
export default router;
```

### Queue/Worker Pattern
```typescript
// 1. Define queue in src/config/queue.ts
export const QUEUE_NAME = 'my-queue';
export const myQueue = new Queue<JobData>(QUEUE_NAME, { redis: redisUrl });

// 2. Process in src/workers/{name}.processor.ts
export function startMyProcessor(): void {
    myQueue.process(async (job) => { /* logic */ });
}

// 3. Start in src/server.ts
startMyProcessor();
```

### Error Handling
- Use `sendError(res, statusCode, message, error?)` from `src/utils/error.ts`
- Catch ZodError specifically for validation: `if (error.name === 'ZodError')`
- Global error handler in `src/middlewares/error.middleware.ts`

### Auth
- JWT with per-user secrets stored in DB (JWT model)
- `authenticate` middleware extracts userId → `(req as Request & { userId?: string }).userId`
- `requireAdmin` checks `user.role === 'ADMIN'`

## Commands
```bash
# Development
cd backend && npm run dev          # Start with hot-reload (nodemon + ts-node)
npm run build                      # Compile TypeScript → dist/
npm start                          # Run compiled (production)

# Database
npm run db:migrate                 # Run Prisma migrations
npm run db:reset                   # Reset DB (destructive!)
npm run db:generate                # Regenerate Prisma client
npm run seed:admin                 # Seed admin user

# Infrastructure
docker-compose up -d               # Start PostgreSQL + Redis (+ pgvector)
```

## Environment Variables (backend/env.example)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/standagent
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION / AWS_S3_BUCKET
GOOGLE_CLIENT_ID / APPLE_CLIENT_ID
GEMINI_API_KEY                     # For embeddings (to be added)
```

## Key Decisions
- n8n is an **external instance** (already deployed), not local Docker
- Embeddings use **Gemini API free tier** (768-dim vectors), NOT local Ollama
- OpenClaw communicates with backend via HTTP REST, not direct DB access
- Audio transcription goes through n8n → Telegram message with `[LEAD]` prefix → OpenClaw
- Per-user JWT secrets (not a single app secret) for enhanced security
- Backend port: 3000 (plan says 3001, to be aligned)

## Project Status
- [x] Backend scaffold (auth, users, media, queues)
- [ ] Lead/Event models and CRUD
- [ ] Embeddings + pgvector integration
- [ ] RAG query endpoints
- [ ] OpenClaw setup and skills
- [ ] n8n audio transcription workflow
- [ ] React dashboard
