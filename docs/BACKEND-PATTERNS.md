# Backend Patterns & Conventions

## Layer Stack

```
Route → Middleware → Controller → Validator → Repository → Prisma → DB
                                                    ↓
                                              Transformer → Response
```

Each layer has a single responsibility. Never skip layers.

## File Naming

```
src/
├── controllers/{domain}.controller.ts
├── repositories/{domain}.repository.ts
├── transformers/{domain}.transformer.ts
├── validators/{domain}/{operation}.validator.ts
├── routes/{domain}.routes.ts
├── middlewares/{name}.middleware.ts
├── workers/{name}.processor.ts
├── config/{name}.ts
└── utils/{name}.ts
```

## Adding a New Feature (Step by Step)

### Example: Adding "Lead" domain

#### 1. Prisma Model

```prisma
// prisma/schema.prisma
model Lead {
  id            String      @id @default(uuid())
  name          String
  company       String?
  companyType   CompanyType @default(OTHER)
  role          String?
  email         String?
  phone         String?
  businessAngle String?
  notes         String?
  source        LeadSource  @default(TEXT)
  enrichmentData Json?

  event         Event       @relation(fields: [eventId], references: [id])
  eventId       String

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

Then: `npm run db:migrate`

#### 2. Validators

Create `src/validators/lead/create.validator.ts`:
```typescript
import { z } from 'zod';
import { Request } from 'express';

export const createLeadSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    company: z.string().optional(),
    companyType: z.enum(['STARTUP', 'CORPORATION', 'AGENCY', 'FREELANCER', 'INVESTOR', 'OTHER']).optional(),
    role: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    businessAngle: z.string().optional(),
    notes: z.string().optional(),
    source: z.enum(['AUDIO', 'TEXT', 'PHOTO']).optional(),
    eventId: z.string().uuid('Invalid event ID'),
});

export function validateCreateLead(req: Request) {
    return createLeadSchema.parse(req.body);
}
```

**Rules:**
- One validator file per operation (create, update, list, params)
- Use `z.object({...}).parse(req.body)` for body validation
- Use `z.object({...}).parse(req.query)` for query params
- Use `z.object({...}).parse(req.params)` for route params
- Validators throw ZodError on failure — controller catches it
- For async validation (DB lookups), return response directly like `register.validator.ts`

#### 3. Repository

Create `src/repositories/lead.repository.ts`:
```typescript
import { prisma } from '../config/prisma';

export const LeadRepository = {
    findAll: (skip: number, take: number, filters?: { eventId?: string; search?: string }) => {
        const where: Record<string, unknown> = {};
        if (filters?.eventId) where.eventId = filters.eventId;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { company: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return prisma.lead.findMany({ skip, take, where, orderBy: { createdAt: 'desc' } });
    },
    // ... findById, create, update, delete, count
};
```

**Rules:**
- Repository = object literal with methods (not a class)
- Always return Prisma promises directly (no `async/await` unless needed)
- Use `select` when you need to exclude fields (like password)
- Search uses `contains` + `mode: 'insensitive'`
- Pagination: `skip` + `take` pattern

#### 4. Transformer

Create `src/transformers/lead.transformer.ts`:
```typescript
export const transformLead = (lead: LeadDbType) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    // ... include only client-safe fields
});
export const transformLeads = (leads: LeadDbType[]) => leads.map(transformLead);
```

**Rules:**
- Strip internal/sensitive fields
- Use `?? null` for optional fields
- Keep flat (no nesting unless needed)

#### 5. Controller

Create `src/controllers/lead.controller.ts`:
```typescript
export const LeadController = {
    index: async (req: Request, res: Response) => {
        try {
            const pagination = validatePagination(req);
            const filters = validateLeadFilters(req);
            const [leads, total] = await Promise.all([
                LeadRepository.findAll(skip, take, filters),
                LeadRepository.count(filters),
            ]);
            res.json({ data: transformLeads(leads), pagination: { page, limit, total, pages } });
        } catch (error) {
            return sendError(res, 400, 'Invalid parameters', error);
        }
    },
    // ... create, show, update, delete
};
```

**Rules:**
- Controller = object literal with async methods
- Always wrap in try/catch
- Use `sendError()` for all error responses
- Check ZodError by name: `error.name === 'ZodError'` → 400
- Use `Promise.all` for parallel DB queries
- Return paginated list responses with `{ data, pagination }` shape

#### 6. Routes

Create `src/routes/lead.routes.ts`:
```typescript
import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate } from '../middlewares/auth.middleware';
const router = Router();

router.get('/', authenticate, LeadController.index);
router.get('/:id', authenticate, LeadController.show);
router.post('/', LeadController.create);          // OpenClaw calls this
router.patch('/:id/enrich', LeadController.enrich); // OpenClaw calls this
router.delete('/:id', authenticate, LeadController.delete);

export default router;
```

#### 7. Register in App

```typescript
// src/app.ts
import leadRoutes from './routes/lead.routes';
app.use('/api/leads', leadRoutes);
```

## Queue Pattern

For background jobs (embedding generation, enrichment):

```
Controller → queue.add(jobData) → Redis → Worker processes → DB update
```

1. Define queue in `src/config/queue.ts` with unique QUEUE_NAME
2. Create processor in `src/workers/{name}.processor.ts`
3. Start processor in `src/server.ts`
4. Add jobs from controllers or other workers

## Error Response Format

All errors follow:
```json
{ "error": "Human-readable message" }
```

## List Response Format

```json
{
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 42,
        "pages": 5
    }
}
```

## Auth for OpenClaw Endpoints

Endpoints called by OpenClaw (create lead, enrich, RAG) should use either:
- API key middleware (simpler, recommended)
- Or no auth (if backend is only accessible from localhost)

This is a design decision to confirm with the team.
