# API Reference

Base URL: `http://localhost:3000` (current) / `http://localhost:3001` (planned)

## Existing Endpoints

### Health Check
```
GET /health
→ { "status": "ok" }
```

### Users (Authentication)

```
POST /users                    # Register
POST /users/login              # Login (phone + password)
POST /users/google             # Google OAuth
POST /users/apple              # Apple OAuth
POST /users/logout             # Logout (protected)
POST /users/check-phone        # Check phone exists
GET  /users                    # List users (protected, paginated)
GET  /users/profile            # Current user profile (protected)
GET  /users/:id                # User by ID (protected)
PUT  /users/:id                # Update user (protected)
DELETE /users/:id              # Delete user (protected)
```

### Media
```
POST /media/upload             # Upload file to S3 (protected, multipart)
```

### Queue
```
POST /queue/jobs               # Create background job
Body: { "text": "string (max 10000 chars)" }
→ { "message": "Job added", "jobId": "..." }
```

---

## Planned Endpoints (from stand-agent-plan-v2)

### Leads CRUD

```
POST   /api/leads
Body: {
    "name": "string (required)",
    "company": "string",
    "companyType": "STARTUP|CORPORATION|AGENCY|FREELANCER|INVESTOR|OTHER",
    "role": "string",
    "email": "string (email format)",
    "phone": "string",
    "businessAngle": "string",
    "notes": "string",
    "source": "AUDIO|TEXT|PHOTO",
    "eventId": "uuid (required)"
}
→ 201 { "data": Lead, "embeddingGenerated": boolean }

GET    /api/leads?eventId=uuid&search=string&page=1&limit=10
→ { "data": Lead[], "pagination": {...} }

GET    /api/leads/:id
→ { "data": Lead }

PATCH  /api/leads/:id/enrich
Body: {
    "companyWebsite": "string",
    "companyDescription": "string",
    "companySize": "string",
    "companyFunding": "string",
    "linkedinUrl": "string",
    "verifiedRole": "string",
    "otherMentions": "string"
}
→ { "data": Lead }
```

### Events

```
GET    /api/events
→ { "data": Event[] }

POST   /api/events
Body: {
    "name": "string (required)",
    "date": "ISO date",
    "location": "string",
    "description": "string"
}
→ 201 { "data": Event }

GET    /api/events/:id/stats
→ {
    "totalLeads": number,
    "byCompanyType": { "STARTUP": n, "CORPORATION": n, ... },
    "topBusinessAngles": string[],
    "topLeads": Lead[],
    "timeline": { "date": "count" }[]
}
```

### Embeddings

```
POST   /api/embeddings/generate
Body: { "leadId": "uuid" }
→ { "success": true, "dimensions": 768 }

POST   /api/embeddings/query
Body: {
    "query": "string (required)",
    "eventId": "uuid (optional)",
    "limit": number (default 5)
}
→ { "results": [{ "lead": Lead, "similarity": number }] }
```

### RAG

```
POST   /api/rag/query
Body: {
    "question": "string (required)",
    "eventId": "uuid (optional)"
}
→ {
    "answer": "string (LLM response)",
    "sources": Lead[],
    "confidence": number
}
```

## Authentication

### JWT Token
```
Authorization: Bearer <token>
```
- Token obtained from login/register/OAuth endpoints
- Per-user secrets stored in database
- Expires in 1 day
- Middleware: `authenticate` for protected routes

### API Key (planned for OpenClaw)
```
X-API-Key: <key>
```
- For machine-to-machine communication (OpenClaw → Backend)
- Simpler than JWT for service calls

## Response Formats

### Success (single item)
```json
{ "data": { ... } }
```

### Success (list)
```json
{
    "data": [...],
    "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```

### Error
```json
{ "error": "Human-readable error message" }
```

## Status Codes
| Code | Usage |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Validation error / bad request |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 500 | Server error |
