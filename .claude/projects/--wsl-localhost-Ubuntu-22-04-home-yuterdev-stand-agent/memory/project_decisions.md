---
name: Project Decisions Phase 1
description: Key architecture and implementation decisions made during Phase 1 setup — port, auth, routes, OAuth removal, OpenClaw integration approach
type: project
---

Decisions made on 2026-03-22:

- **Port**: 3000 (not 3001 as original plan stated)
- **Route prefix**: All routes migrated to `/api/` prefix
- **OAuth**: Removed Google/Apple OAuth — email/password only for dashboard users
- **OpenClaw auth**: API Key via `X-API-Key` header (compatible with OpenClaw's curl-based skills)
- **Dual auth middleware**: `authenticateAny` accepts either JWT or API key
- **Docker**: PostgreSQL+pgvector + Redis via docker-compose.yml in project root
- **n8n**: External instance (already deployed by user), NOT in docker-compose
- **OpenClaw**: New to user, will be set up from scratch via Docker
- **Development approach**: Linear by phases, adapting as needed

**Why:** User confirmed these decisions in conversation. OpenClaw research showed it uses curl in skills to call backends, making API key the natural auth choice.

**How to apply:** All new endpoints should use `authenticateAny` (dual auth) unless they're exclusively for OpenClaw (use `authenticateApiKey`) or exclusively for dashboard (use `authenticate`).
