---
name: Stand-Agent Project Overview
description: Lead capture agent for tech events — Telegram + OpenClaw + Express backend + pgvector + React dashboard
type: project
---

Stand-Agent is a lead capture system for tech events. Users record leads via Telegram (audio, text, photos), OpenClaw AI agent processes them, backend stores with embeddings for RAG queries, React dashboard for visualization.

**Why:** The user attends tech events and needs rapid lead capture from conversations, enriched with web data and queryable via natural language.

**How to apply:** All development decisions should prioritize speed of capture (Telegram-first UX), data quality (structured extraction + enrichment), and queryability (RAG via pgvector). n8n is external (already deployed), not local Docker.
