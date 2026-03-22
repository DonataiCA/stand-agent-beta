# API Reference

Base URL: `http://localhost:3000`

## Health Check
```
GET /health → { "status": "ok" }
```

## Authentication

### JWT Token (Dashboard users)
```
Authorization: Bearer <token>
```
- Obtained from `/api/users/login` or `/api/users` (register)
- Per-user secrets stored in database, expires in 1 day

### API Key (OpenClaw / services)
```
X-API-Key: <key>
```
- Value matches `API_SECRET_KEY` env var
- For machine-to-machine communication

### Dual Auth
Some endpoints accept either JWT or API Key. The `authenticateAny` middleware tries API key first, falls back to JWT.

---

## Users `/api/users`

```
POST   /api/users                  # Register (public)
Body: { "firstName", "lastName", "email", "phoneNumber", "password" }
→ 201 { "user": User, "token": "jwt..." }

POST   /api/users/login            # Login (public)
Body: { "phoneNumber", "password" }
→ { "user": User, "token": "jwt..." }

POST   /api/users/logout           # Logout (JWT)
→ { "message": "Logged out successfully" }

POST   /api/users/check-phone      # Check phone exists (public)
Body: { "phoneNumber" }
→ { "exists": boolean }

GET    /api/users                  # List users (JWT, paginated)
Query: ?page=1&limit=10&search=string
→ { "data": User[], "pagination": {...} }

GET    /api/users/profile          # Current user (JWT)
→ User

GET    /api/users/:id              # User by ID (JWT)
PUT    /api/users/:id              # Update user (JWT)
DELETE /api/users/:id              # Delete user (JWT) → 204
```

## Events `/api/events`

All endpoints accept JWT or API Key (dual auth).

```
GET    /api/events                 # List events (paginated)
Query: ?page=1&limit=10&search=string&isActive=true
→ { "data": Event[], "pagination": {...} }

GET    /api/events/:id             # Event detail
→ { "data": Event }

POST   /api/events                 # Create event
Body: {
    "name": "string (required)",
    "date": "2026-04-15T00:00:00.000Z (ISO)",
    "location": "string",
    "description": "string"
}
→ 201 { "data": Event }

PUT    /api/events/:id             # Update event
Body: { "name?", "date?", "location?", "description?", "isActive?" }
→ { "data": Event }

DELETE /api/events/:id             # Delete event → 204

GET    /api/events/:id/stats       # Event statistics
→ {
    "data": {
        "event": { "id", "name", "date", "location" },
        "totalLeads": number,
        "byCompanyType": { "STARTUP": n, ... },
        "bySource": { "AUDIO": n, "TEXT": n, "PHOTO": n },
        "topBusinessAngles": [{ "angle": string, "count": number }],
        "timeline": { "2026-04-15": n, ... }
    }
}
```

## Leads `/api/leads`

```
POST   /api/leads                  # Create lead (API Key)
Body: {
    "name": "string (required)",
    "company": "string",
    "companyType": "STARTUP|CORPORATION|AGENCY|FREELANCER|INVESTOR|OTHER",
    "role": "string",
    "email": "string (email)",
    "phone": "string",
    "businessAngle": "string",
    "notes": "string",
    "source": "AUDIO|TEXT|PHOTO",
    "eventId": "uuid (required)"
}
→ 201 { "data": Lead }

GET    /api/leads                  # List leads (dual auth, paginated)
Query: ?page=1&limit=10&search=string&eventId=uuid&companyType=STARTUP&source=AUDIO
→ { "data": Lead[], "pagination": {...} }

GET    /api/leads/:id              # Lead detail (dual auth)
→ { "data": Lead }

PUT    /api/leads/:id              # Update lead (dual auth)
Body: { "name?", "company?", "companyType?", ... }
→ { "data": Lead }

PATCH  /api/leads/:id/enrich       # Enrich lead (API Key)
Body: {
    "companyWebsite": "url",
    "companyDescription": "string",
    "companySize": "string",
    "companyFunding": "string",
    "linkedinUrl": "url",
    "verifiedRole": "string",
    "otherMentions": "string"
}
→ { "data": Lead }

DELETE /api/leads/:id              # Delete lead (dual auth) → 204
```

### Lead Response Shape
```json
{
    "id": "uuid",
    "name": "María García",
    "company": "Fintech Solutions",
    "companyType": "STARTUP",
    "role": "COO",
    "email": "maria@fintech.com",
    "phone": "+34...",
    "businessAngle": "Integrar IA en pagos",
    "notes": "Muy interesada",
    "source": "AUDIO",
    "enrichment": {
        "companyWebsite": "https://fintech.com",
        "companyDescription": "Plataforma de pagos B2B",
        "companySize": "45 empleados",
        "companyFunding": "Serie A",
        "linkedinUrl": "https://linkedin.com/in/...",
        "verifiedRole": "COO",
        "otherMentions": null,
        "enrichedAt": "2026-03-22T..."
    },
    "event": { "id": "uuid", "name": "Tech Event 2026" },
    "createdAt": "...",
    "updatedAt": "..."
}
```

## Media `/api/media`
```
POST   /api/media/upload           # Upload file to S3 (JWT)
```

## Queue `/api/queue`
```
POST   /api/queue/jobs             # Create background job
Body: { "text": "string (max 10000)" }
→ { "message": "Job added", "jobId": "..." }
```

---

## Planned Endpoints (not yet implemented)

### Embeddings `/api/embeddings`
```
POST   /api/embeddings/generate    # Generate embedding for a lead
POST   /api/embeddings/query       # Vector similarity search
```

### RAG `/api/rag`
```
POST   /api/rag/query              # Full RAG query (embed + search + LLM)
```

---

## Response Formats

### Success (single): `{ "data": {...} }`
### Success (list): `{ "data": [...], "pagination": { "page", "limit", "total", "pages" } }`
### Error: `{ "error": "message" }`

## Status Codes
| Code | Usage |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Validation / bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |
