---
name: transcribir-audio
description: Transcribe un mensaje de voz o audio recibido por Telegram. Úsalo cuando el usuario envíe un audio o nota de voz.
---

# Transcribir Audio

Cuando recibas un mensaje de voz o audio de Telegram, sigue estos pasos:

## Paso 1 — Identificar la ruta local del audio

El archivo de voz está descargado localmente en una ruta como:
`/home/node/.openclaw/media/inbound/file_N---<uuid>.ogg`

Usa la ruta exacta del attachment del mensaje.

## Paso 2 — Enviar el archivo al servicio de transcripción

```bash
curl -s -F "data=@<RUTA_LOCAL_DEL_AUDIO>;type=audio/ogg" \
  https://n8n.domotai.online/webhook/voice-to-text
```

Esto devuelve: `{ "transcription": "Conocí a Juan García, CEO de TechCorp..." }`

## Paso 3 — Procesar como lead

Con el texto transcrito, extrae los datos del contacto y regístralo usando el endpoint de leads (ver TOOLS.md → Registrar un lead).

Si la transcripción no menciona a nadie específico (no es un lead), muestra el texto al usuario y pregunta si quiere registrarlo.

## Respuesta al usuario

Si se registró un lead: ✅ Audio transcrito y lead registrado: **[Nombre]** de **[Empresa]**
Si no hay lead claro: 🎙️ Transcripción: "[texto]" — ¿quieres registrar esto como lead?
