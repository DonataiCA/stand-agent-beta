# Stand Agent — Setup Guide

Setup completo para levantar el proyecto de captura de leads desde cero.

## Requisitos previos

- Node.js v20+ (recomendado v25)
- Docker + Docker Compose
- Git
- Cuenta de Telegram (para crear un bot)

### API Keys necesarias

| Servicio | Para qué | Dónde obtenerla |
|---|---|---|
| Anthropic | LLM (Claude Haiku) — OpenClaw + RAG | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI | Whisper — transcripción de audio | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Gemini | Embeddings (gemini-embedding-001) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Telegram | Bot token | Crear bot con [@BotFather](https://t.me/BotFather) en Telegram |

---

## 1. Clonar el repositorio

```bash
git clone <repo-url> stand-agent
cd stand-agent
```

## 2. Configurar variables de entorno

### 2.1 Root `.env` (para Docker Compose / OpenClaw)

Crea el archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` con tus keys:

```env
# Anthropic API (OpenClaw LLM + RAG)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Telegram Bot token (de @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:AAF...

# API Secret Key — autenticación OpenClaw → Backend (genera uno con: openssl rand -hex 32)
API_SECRET_KEY=<tu-secret-key-hex>

# OpenAI API Key (Whisper audio transcription)
OPENAI_API_KEY=sk-proj-...

# Active Event UUID (se llena después del seed, con el ID del evento activo)
ACTIVE_EVENT_ID=
```

### 2.2 Backend `.env`

```bash
cp backend/env.example backend/.env
```

Edita `backend/.env`:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5433/standagent
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# Debe coincidir con el API_SECRET_KEY del root .env
API_SECRET_KEY=<mismo-valor-que-root>

# Gemini — para generación de embeddings
GEMINI_API_KEY=AI...

# Anthropic — para respuestas RAG
ANTHROPIC_API_KEY=sk-ant-api03-...

# (Opcional) AWS S3 para almacenamiento de archivos
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_S3_BUCKET=
```

---

## 3. Levantar servicios Docker

Esto inicia PostgreSQL (con pgvector), Redis y OpenClaw:

```bash
docker compose up -d
```

Verifica que estén corriendo:

```bash
docker compose ps
```

Deberías ver:
- `standagent-postgres` — puerto 5433
- `standagent-redis` — puerto 6379
- `standagent-openclaw` — conectado a Telegram

---

## 4. Configurar el Backend

```bash
cd backend
npm install
```

### 4.1 Ejecutar migraciones

```bash
npm run db:migrate
```

### 4.2 Seed (usuario admin + evento de prueba)

```bash
npm run seed
```

Esto crea:
- **Usuario admin**: `admin@standagent.com` / `develop`
- **Evento de prueba**: "Test Event 2026"

### 4.3 Obtener el Event ID

```bash
# Consulta el ID del evento creado
docker exec standagent-postgres psql -U admin -d standagent -c "SELECT id, name FROM \"Event\";"
```

Copia el UUID del evento y pégalo en:
- Root `.env` → `ACTIVE_EVENT_ID=<uuid>`
- `openclaw/config/workspace/TOOLS.md` → reemplaza el `eventId` en los curls

### 4.4 Iniciar el backend

```bash
npm run dev
```

El backend corre en `http://localhost:3000`.

---

## 5. Configurar OpenClaw

### 5.1 Reiniciar con el Event ID actualizado

Después de actualizar `ACTIVE_EVENT_ID` en el root `.env`:

```bash
cd ..  # volver al root
docker compose up openclaw -d --force-recreate --no-deps
```

### 5.2 Verificar conexión

```bash
docker logs standagent-openclaw --tail 20
```

Deberías ver:
```
[gateway] agent model: anthropic/claude-haiku-4-5
[telegram] [default] starting provider (@tu_bot)
```

### 5.3 Configurar TOOLS.md

El archivo `openclaw/config/workspace/TOOLS.md` contiene los endpoints y API keys que OpenClaw usa para comunicarse con el backend. Actualiza:

- `X-API-Key` → debe coincidir con tu `API_SECRET_KEY`
- `eventId` → el UUID de tu evento activo

### 5.4 Probar

Envía un mensaje al bot en Telegram:
```
Conocí a Juan Pérez, CTO de TechCorp, interesado en IA generativa
```

El bot debería registrar el lead en el backend.

---

## 6. Configurar el Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`.

### Login

- **Email**: `admin@standagent.com`
- **Password**: `develop`

---

## 7. Puertos y servicios

| Servicio | Puerto | Descripción |
|---|---|---|
| Backend API | 3000 | Express + Prisma |
| Frontend | 5173 | Vite dev server |
| PostgreSQL | 5433 | pgvector (mapeado de 5432 interno) |
| Redis | 6379 | Cola de embeddings (Bull) |
| OpenClaw | Docker interno | Telegram bot + AI agent |

---

## 8. Arquitectura

```
Telegram (texto/audio) → OpenClaw (Claude Haiku + Whisper)
                              ↓
                        Backend API (Express, :3000)
                              ↓
                      PostgreSQL + pgvector
                              ↓
                       React Dashboard (:5173)
```

### Flujo de un lead:
1. Usuario envía mensaje o audio al bot de Telegram
2. OpenClaw transcribe el audio (OpenAI Whisper) y extrae datos del lead
3. OpenClaw llama `POST /api/leads` en el backend
4. El backend guarda el lead y encola generación de embedding (Bull + Gemini)
5. El embedding se almacena en pgvector para búsqueda semántica
6. El dashboard muestra los leads y permite consultas RAG

---

## 9. Comandos útiles

```bash
# Backend
cd backend
npm run dev              # Dev server con hot-reload
npm run db:migrate       # Ejecutar migraciones
npm run db:reset         # Reset de DB (destructivo)
npm run seed             # Seed de usuario admin + evento

# Frontend
cd frontend
npm run dev              # Dev server Vite
npm run build            # Build de producción

# Docker
docker compose up -d              # Levantar todos los servicios
docker compose logs -f openclaw   # Ver logs de OpenClaw
docker compose restart openclaw   # Reiniciar OpenClaw

# OpenClaw en Telegram
/restart                 # Reiniciar sesión del agente (recarga SOUL.md, TOOLS.md)
```

---

## 10. Troubleshooting

| Problema | Solución |
|---|---|
| OpenClaw no responde en Telegram | Verificar `TELEGRAM_BOT_TOKEN` en `.env` y reiniciar: `docker compose restart openclaw` |
| Error 401 en leads desde OpenClaw | Verificar que `API_SECRET_KEY` coincida en root `.env` y `backend/.env` |
| Embedding falla | Verificar `GEMINI_API_KEY` en `backend/.env` |
| RAG no responde | Verificar `ANTHROPIC_API_KEY` en `backend/.env` |
| Audio no se transcribe | Verificar `OPENAI_API_KEY` en root `.env` y que `tools.media.audio.enabled: true` en `openclaw.json` |
| Puerto 5433 en uso | Cambiar el puerto de PostgreSQL en `docker-compose.yml` y actualizar `DATABASE_URL` |
| Frontend no conecta al backend | Verificar que el backend corra en puerto 3000 y que CORS esté habilitado |
