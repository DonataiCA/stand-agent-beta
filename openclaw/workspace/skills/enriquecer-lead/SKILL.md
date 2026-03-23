---
name: enriquecer-lead
description: Enriquece un lead existente con información pública de la empresa y la persona. Úsalo cuando el usuario pida investigar, enriquecer o completar datos de un lead.
---

# Enriquecer Lead

Busca información pública sobre la empresa y la persona, luego actualiza el lead con los datos encontrados.

## Paso 1: Obtener el lead a enriquecer

Si el usuario no especifica el ID, busca el lead por nombre. Primero consulta los leads del evento:

```bash
curl -s "$BACKEND_URL/api/leads?eventId=$ACTIVE_EVENT_ID&search=<nombre_del_lead>&limit=5" \
  -H "X-API-Key: $API_SECRET_KEY"
```

Extrae el `id` del lead de la respuesta.

## Paso 2: Investigar con búsqueda web

Usa tus capacidades de búsqueda web para encontrar:
- Sitio web oficial de la empresa
- Descripción del negocio de la empresa
- Tamaño aproximado de la empresa (empleados o facturación)
- Rondas de inversión o funding conocido
- Perfil de LinkedIn de la persona
- Cargo verificado en LinkedIn u otras fuentes
- Menciones en prensa, blogs o redes

## Paso 3: Registrar el enriquecimiento

Con los datos encontrados, llama al endpoint de enriquecimiento:

```bash
curl -s -X PATCH $BACKEND_URL/api/leads/<lead_id>/enrich \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SECRET_KEY" \
  -d '{
    "companyWebsite": "<URL del sitio web o null>",
    "companyDescription": "<descripción breve de la empresa o null>",
    "companySize": "<tamaño aproximado o null>",
    "companyFunding": "<ronda de inversión y monto o null>",
    "linkedinUrl": "<URL del perfil LinkedIn o null>",
    "verifiedRole": "<cargo verificado en LinkedIn o null>",
    "otherMentions": "<menciones relevantes en prensa u otras fuentes o null>"
  }'
```

## Respuesta al usuario

Si el enriquecimiento fue exitoso, resume los datos más relevantes encontrados:
> ✅ Lead enriquecido: **[Nombre]**
> 🏢 [Empresa]: [descripción breve]
> 💰 Funding: [si disponible]
> 🔗 LinkedIn: [si disponible]

Si no se encontró información relevante, informa al usuario.
