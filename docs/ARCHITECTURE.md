# Architecture Overview

## System Flow

```
┌──────────────┐
│   Telegram   │ ◄── User sends audio/text/photo/query
└──────┬───────┘
       │
       ├── Voice message ──► ┌──────────┐    "[LEAD] transcripción"    ┌──────────┐
       │                     │   n8n    │ ─────────────────────────► │ Telegram │
       │                     │ (Whisper)│                             │  (chat)  │
       │                     └──────────┘                             └────┬─────┘
       │                                                                   │
       ├── Text/Photo/[LEAD] ──────────────────────────────────────────────┤
       │                                                                   │
       ▼                                                                   ▼
┌──────────────┐                                                  ┌──────────────┐
│   OpenClaw   │ ◄────────────────────────────────────────────── │   OpenClaw   │
│  (AI Agent)  │ ── reads all Telegram messages ──────────────► │   Skills     │
└──────┬───────┘                                                  └──────┬───────┘
       │                                                                  │
       │  HTTP REST calls                                                 │
       ▼                                                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Backend API (Express + TS)                        │
│  POST /api/leads         → Create lead + auto-generate embedding        │
│  PATCH /api/leads/:id/enrich → Update with web enrichment data         │
│  POST /api/embeddings/query  → Vector similarity search                 │
│  POST /api/rag/query         → Full RAG (embed + search + LLM)         │
│  GET  /api/events/:id/stats  → Event statistics                         │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL + pgvector                                   │
│  Tables: Lead, Event, User, JWT                                          │
│  Vector: lead_embedding (768-dim, Gemini embedding-001)                  │
└──────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   React Dashboard (Vite + Tailwind)                       │
│  Views: Lead table, Lead detail, Event statistics                        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Lead Capture (Audio)

1. User records voice message in Telegram
2. n8n Telegram Trigger intercepts voice messages only
3. n8n downloads audio → OpenAI Whisper transcription → sends `[LEAD] {text}` back to chat
4. OpenClaw sees `[LEAD]` prefix → activates "Procesar Lead" skill
5. OpenClaw extracts structured data (name, company, role, businessAngle, etc.)
6. OpenClaw calls `POST /api/leads` on the backend
7. Backend saves lead + generates Gemini embedding + stores in pgvector
8. OpenClaw auto-triggers "Enriquecer Lead" skill → web search → `PATCH /api/leads/:id/enrich`
9. OpenClaw confirms in Telegram with lead summary

## Data Flow: RAG Query

1. User types `?question` or `/consulta question` in Telegram
2. OpenClaw detects query intent → calls `POST /api/rag/query`
3. Backend generates embedding of the question (Gemini API)
4. pgvector finds similar leads by cosine distance
5. Backend composes context from matched leads → sends to LLM
6. LLM generates answer citing specific leads
7. Response sent back to Telegram

## Intent Detection (OpenClaw)

| Input Pattern | Action |
|---|---|
| `[LEAD] ...` | Audio transcription from n8n → process as lead |
| Text describing a contact | Process as lead |
| Photo of business card | OCR via LLM vision → process as lead |
| `?...` or `/consulta ...` | RAG query |
| `/resumen` | Event summary statistics |
| `/stats` | Quick statistics |

## Component Responsibilities

| Component | Does | Does NOT |
|---|---|---|
| **Telegram** | User interface, message routing | Processing, storage |
| **n8n** | Audio transcription (Whisper) | Lead processing, text handling, queries |
| **OpenClaw** | Intent detection, data extraction, web enrichment, RAG answers | Direct DB access, embedding generation |
| **Backend API** | CRUD, embedding generation, vector search, RAG orchestration | Telegram interaction, AI reasoning |
| **PostgreSQL** | Persistent storage, vector similarity search | Business logic |
| **Dashboard** | Visualization, filtering, export | Lead capture, AI processing |

## Embedding Strategy

- **Model**: Gemini embedding-001 (free tier)
- **Dimensions**: 768
- **Storage**: pgvector extension in PostgreSQL
- **Text composed from**: `{name} {company} {role} {businessAngle} {notes}`
- **Search**: Cosine distance (`<=>` operator in pgvector)
- **Generation**: Server-side on lead creation (automatic)
