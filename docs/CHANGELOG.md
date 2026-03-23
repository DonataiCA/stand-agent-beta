# Changelog

Registro de cambios del proyecto Stand-Agent. Versión más reciente primero.

---

## [v0.1.0] — 2026-03-22

**Base del proyecto.** Backend funcional con infraestructura, modelos de datos y CRUD completo para leads y eventos.

### Added
- **Docker Compose** (`docker-compose.yml`): PostgreSQL 16 con pgvector + Redis 7
- **Prisma schema**: Modelos `Lead`, `Event` con enums `CompanyType`, `LeadSource` y soporte para pgvector (`vector(768)`)
- **Lead CRUD completo**: Validators (Zod), repository, transformer, controller, routes
  - `POST /api/leads` — crear lead (auth: API Key)
  - `GET /api/leads` — listar con filtros y paginación (auth: dual)
  - `GET /api/leads/:id` — detalle (auth: dual)
  - `PUT /api/leads/:id` — actualizar (auth: dual)
  - `PATCH /api/leads/:id/enrich` — enriquecer con datos web (auth: API Key)
  - `DELETE /api/leads/:id` — eliminar (auth: dual)
- **Event CRUD completo**: Validators, repository, transformer, controller, routes
  - CRUD estándar + `GET /api/events/:id/stats` con estadísticas agregadas
- **API Key middleware** (`authenticateApiKey`): Auth por `X-API-Key` header para comunicación OpenClaw → Backend
- **Dual auth middleware** (`authenticateAny`): Acepta JWT o API Key, para endpoints usados por dashboard y OpenClaw
- **Seed script**: Crea usuario admin (`admin@standagent.com` / `develop`) + evento de prueba
- **Documentación**: ARCHITECTURE.md, BACKEND-PATTERNS.md, API-REFERENCE.md, DEVELOPMENT-GUIDE.md, DOCUMENTATION-GUIDELINES.md
- **CLAUDE.md**: Guía del proyecto con arquitectura, convenciones y status

### Changed
- **Rutas migradas** a prefijo `/api/`: `/users` → `/api/users`, `/media` → `/api/media`, `/queue` → `/api/queue`
- **User model simplificado**: Removidos campos `gender`, `providerId`, `authProvider` (ya no hay OAuth)
- **Register/Login**: Simplificados para auth email/password únicamente
- **package.json**: Renombrado a `stand-agent-backend`, script `seed:admin` → `seed`

### Removed
- **Google OAuth**: Rutas, controller methods, validadores (`google-auth.validator.ts` pendiente de eliminar del disco)
- **Apple OAuth**: Rutas, controller methods, validadores (`apple-auth.validator.ts` pendiente de eliminar del disco)
- **Enum `AuthProvider`**: Ya no se usa en el schema de Prisma

### Pendiente de limpieza
- Archivos huérfanos por eliminar: `src/validators/user/google-auth.validator.ts`, `src/validators/user/apple-auth.validator.ts`, `src/utils/google-auth.ts`, `src/utils/apple-auth.ts`
- Dependencias sin uso en `package.json`: `google-auth-library`, `jwks-rsa`
- `npm install` no se ha corrido (no existe `node_modules/`)
- Migración de Prisma no se ha ejecutado aún

### Notas
- **Backend base** proviene de un template genérico de Express+TypeScript+Prisma, adaptado para este proyecto
- **n8n** es una instancia externa ya desplegada, no está en el docker-compose
- **OpenClaw** se integrará en fases posteriores (skills via SKILL.md + curl al backend)

---

## Próximas versiones planificadas

### v0.2.0 — Embeddings + pgvector
- Integración con Gemini Embedding API
- Worker de Bull para generación automática de embeddings al crear leads
- Endpoint de búsqueda por similitud vectorial

### v0.3.0 — RAG
- Endpoint `POST /api/rag/query` (embed + search + LLM)
- Integración con Claude/GPT para generar respuestas contextuales

### v0.4.0 — OpenClaw
- Setup de OpenClaw en Docker
- Skills: Procesar Lead, Enriquecer Lead, Consultar Leads, Resumen de Evento
- Integración con Telegram Bot

### v0.5.0 — Dashboard
- React + Vite + TailwindCSS
- Vistas: tabla de leads, detalle, estadísticas

### v1.0.0 — Release
- Integration testing end-to-end
- Preparación para evento real
