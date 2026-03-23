---
name: procesar-lead
description: Registra un nuevo lead capturado en el evento. Úsalo cuando el usuario mencione a alguien que conoció, o cuando llegue un mensaje con prefijo [LEAD].
---

# Procesar Lead

Extrae la información del contacto del mensaje del usuario y regístrala como lead en el sistema.

## Campos a extraer

Analiza el mensaje y extrae todos los campos disponibles:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| `name` | Nombre completo de la persona | ✅ Sí |
| `company` | Nombre de la empresa | No |
| `companyType` | Tipo: `STARTUP`, `CORPORATION`, `AGENCY`, `FREELANCER`, `INVESTOR`, `OTHER` | No |
| `role` | Cargo o rol en la empresa | No |
| `email` | Correo electrónico | No |
| `phone` | Teléfono con prefijo internacional | No |
| `businessAngle` | Qué problema quiere resolver o en qué está interesado | No |
| `notes` | Notas adicionales, próximos pasos, observaciones | No |
| `source` | Siempre usar `TEXT` para mensajes de texto, `AUDIO` si viene de transcripción | No |

## Cómo registrar el lead

Ejecuta el siguiente comando curl con los datos extraídos:

```bash
curl -s -X POST $BACKEND_URL/api/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SECRET_KEY" \
  -d '{
    "name": "<nombre extraído>",
    "company": "<empresa extraída o null>",
    "companyType": "<tipo o OTHER>",
    "role": "<cargo extraído o null>",
    "email": "<email extraído o null>",
    "phone": "<teléfono extraído o null>",
    "businessAngle": "<ángulo de negocio extraído o null>",
    "notes": "<notas extraídas o null>",
    "source": "TEXT",
    "eventId": "'$ACTIVE_EVENT_ID'"
  }'
```

## Respuesta al usuario

Si el registro fue exitoso (HTTP 201), responde con un mensaje breve de confirmación:
> ✅ Lead registrado: **[Nombre]** de **[Empresa]** — [rol si disponible]

Si hubo error, informa al usuario con el mensaje de error retornado.
