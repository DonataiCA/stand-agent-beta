# Development Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 16 with pgvector extension
- Redis (for Bull queues)
- Docker & Docker Compose (recommended)

## Initial Setup

```bash
# 1. Clone and install
cd backend
cp env.example .env    # Edit with your values
npm install

# 2. Start infrastructure
docker-compose up -d   # PostgreSQL + Redis

# 3. Database setup
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run seed:admin     # Create admin user (admin@example.com / develop)

# 4. Start dev server
npm run dev            # http://localhost:3000
```

## Adding a New Domain Checklist

When adding a new resource (e.g., leads, events):

- [ ] Add model to `prisma/schema.prisma`
- [ ] Run `npm run db:migrate` (name the migration descriptively)
- [ ] Create validators in `src/validators/{domain}/`
- [ ] Create repository in `src/repositories/{domain}.repository.ts`
- [ ] Create transformer in `src/transformers/{domain}.transformer.ts`
- [ ] Create controller in `src/controllers/{domain}.controller.ts`
- [ ] Create routes in `src/routes/{domain}.routes.ts`
- [ ] Register routes in `src/app.ts`
- [ ] Test with Postman/curl
- [ ] Update API-REFERENCE.md if needed

## Database Workflow

```bash
# After modifying schema.prisma:
npm run db:migrate     # Creates migration + applies it

# After pulling with new migrations:
npm run db:generate    # Regenerate client from current schema

# Nuclear option (destroys all data):
npm run db:reset       # Reset + re-run all migrations
```

### Prisma Conventions
- IDs: `String @id @default(uuid())`
- Timestamps: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- Enums: Defined in schema, PascalCase values
- Relations: Always specify `onDelete` behavior
- Use `@unique` for natural keys

## Queue/Worker Workflow

For background processing (e.g., embedding generation):

1. **Define queue** in `src/config/queue.ts`:
   ```typescript
   export const EMBEDDING_QUEUE = 'embedding-generation';
   export const embeddingQueue = new Queue<{ leadId: string }>(EMBEDDING_QUEUE, { redis: redisUrl });
   ```

2. **Create processor** in `src/workers/embedding.processor.ts`:
   ```typescript
   export function startEmbeddingProcessor(): void {
       embeddingQueue.process(async (job) => {
           // Generate embedding, save to DB
       });
   }
   ```

3. **Start in server.ts**:
   ```typescript
   startEmbeddingProcessor();
   ```

4. **Enqueue from controller**:
   ```typescript
   await embeddingQueue.add({ leadId: lead.id });
   ```

## Testing Endpoints

Use the Postman collection in `postman/`:
- Import `api-collection.json`
- Import `environment.json`
- Set `base_url` variable to `http://localhost:3000`

Or use curl:
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "password": "develop"}'

# Protected endpoint
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer <token>"
```

## pgvector Setup (for embeddings)

After the initial PostgreSQL setup:

```sql
-- Enable the extension (run once)
CREATE EXTENSION IF NOT EXISTS vector;

-- Prisma migration will handle column creation
-- Column type: vector(768) for Gemini embedding-001
```

In Prisma schema, pgvector columns require raw SQL in migrations since Prisma doesn't natively support `vector` type. Use `Unsupported("vector(768)")` in schema or manage via raw migration SQL.

## Project-Specific Environment Variables

```env
# Required for stand-agent features (add to .env)
GEMINI_API_KEY=your_gemini_api_key          # For embedding generation
TELEGRAM_BOT_TOKEN=your_bot_token           # For notifications (future)
OPENCLAW_API_KEY=your_openclaw_key          # For OpenClaw auth (future)
```

## Code Style

- TypeScript strict mode enabled
- No explicit `any` unless unavoidable (use proper types)
- Async/await over raw promises
- Object literal pattern for repositories and controllers (not classes)
- One export per file for main entities, named exports for utilities
- Spanish comments are OK (existing codebase uses both)
