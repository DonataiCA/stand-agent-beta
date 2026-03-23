---
name: consultar-leads
description: Responde preguntas sobre los leads del evento usando búsqueda semántica con IA. Úsalo cuando el usuario haga preguntas sobre leads, busque contactos, o quiera analizar su pipeline.
---

# Consultar Leads

Usa el endpoint RAG del sistema para responder preguntas sobre los leads capturados en el evento.

## Cuándo usar este skill

- "¿Quién estaba interesado en pagos?"
- "¿Qué leads tienen presupuesto disponible?"
- "Muéstrame los contactos de startups"
- "¿Quién era el CTO de esa empresa de logística?"
- "¿Con quién debería hacer seguimiento primero?"

## Cómo ejecutar la consulta

```bash
curl -s -X POST $BACKEND_URL/api/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENCLAW_JWT" \
  -d '{
    "query": "<pregunta del usuario exactamente como la escribió>",
    "eventId": "'$ACTIVE_EVENT_ID'",
    "limit": 5
  }'
```

> **Nota:** Si `OPENCLAW_JWT` no está disponible, usa `X-API-Key: $API_SECRET_KEY` como header de autenticación.

## Respuesta al usuario

El endpoint retorna:
```json
{
  "answer": "Respuesta generada por IA...",
  "sources": [{ "id": "...", "name": "...", "company": "...", "similarity": 85.3 }]
}
```

Presenta el campo `answer` directamente al usuario. Si hay fuentes relevantes, menciona los nombres de los leads citados al final.
