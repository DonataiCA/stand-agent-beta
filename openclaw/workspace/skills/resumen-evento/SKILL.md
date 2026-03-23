---
name: resumen-evento
description: Obtiene y presenta las estadísticas del evento activo. Úsalo cuando el usuario pida un resumen, balance o estadísticas del evento.
---

# Resumen de Evento

Consulta las estadísticas del evento activo y presenta un resumen claro al usuario.

## Cuándo usar este skill

- "¿Cuántos leads tenemos?"
- "Dame un resumen del evento"
- "¿Cómo va el evento?"
- "Estadísticas de hoy"
- "¿Cuántos leads por tipo de empresa?"

## Cómo obtener las estadísticas

```bash
curl -s "$BACKEND_URL/api/events/$ACTIVE_EVENT_ID/stats" \
  -H "X-API-Key: $API_SECRET_KEY"
```

## Respuesta al usuario

La respuesta incluye totales y distribuciones. Preséntala de forma clara y visual:

```
📊 Resumen del Evento
─────────────────────
👥 Total leads: [total]

Por tipo de empresa:
  🚀 Startups: [n]
  🏢 Corporaciones: [n]
  🏭 Agencias: [n]
  💼 Freelancers: [n]
  💰 Inversores: [n]
  📦 Otros: [n]

Por fuente de captura:
  💬 Texto: [n]
  🎤 Audio: [n]
  📷 Foto: [n]

✨ Enriquecidos: [n]
```

Adapta el formato según los datos recibidos. Si alguna categoría tiene 0 leads, puedes omitirla.
