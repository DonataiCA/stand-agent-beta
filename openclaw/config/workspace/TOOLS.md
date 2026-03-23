# TOOLS.md - Backend API

## Backend API

El backend corre en `http://host.docker.internal:3000` y requiere autenticación por API Key.

### Registrar un lead (POST /api/leads)

```bash
curl -s -X POST http://host.docker.internal:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 605aed86a6c73becff2840acb74b5e6270c92621253b54499c96d7bde3f8fc81" \
  -d '{
    "name": "<nombre>",
    "company": "<empresa>",
    "companyType": "<STARTUP|CORPORATION|AGENCY|FREELANCER|INVESTOR|OTHER>",
    "role": "<cargo>",
    "businessAngle": "<qué problema quiere resolver>",
    "source": "TEXT",
    "eventId": "9c526033-e9dd-49eb-899e-333f373d78ed"
  }'

⚠️ Nota: No enviar campos con valor null — omitirlos si no se tienen datos.
```

Respuesta exitosa: HTTP 201 con el objeto lead creado.

### Consultar leads con RAG (POST /api/rag/query)

```bash
curl -s -X POST http://host.docker.internal:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 605aed86a6c73becff2840acb74b5e6270c92621253b54499c96d7bde3f8fc81" \
  -d '{
    "query": "<pregunta sobre leads>",
    "eventId": "9c526033-e9dd-49eb-899e-333f373d78ed",
    "limit": 5
  }'
```

Respuesta: `{ "answer": "<respuesta>", "sources": [...] }`

### Enriquecer un lead (POST /api/leads/:id/enrich)

```bash
curl -s -X POST http://host.docker.internal:3000/api/leads/<leadId>/enrich \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 605aed86a6c73becff2840acb74b5e6270c92621253b54499c96d7bde3f8fc81" \
  -d '{
    "linkedinUrl": "<url o null>",
    "websiteUrl": "<url o null>",
    "additionalNotes": "<notas adicionales>"
  }'
```

### Listar leads del evento (GET /api/leads)

```bash
curl -s "http://host.docker.internal:3000/api/leads?eventId=9c526033-e9dd-49eb-899e-333f373d78ed" \
  -H "X-API-Key: 605aed86a6c73becff2840acb74b5e6270c92621253b54499c96d7bde3f8fc81"
```

### Stats del evento (GET /api/events/:id/stats)

```bash
curl -s http://host.docker.internal:3000/api/events/9c526033-e9dd-49eb-899e-333f373d78ed/stats \
  -H "X-API-Key: 605aed86a6c73becff2840acb74b5e6270c92621253b54499c96d7bde3f8fc81"
```
