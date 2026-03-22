# Stand-Agent v2 — Plan de proyecto (reestructurado)

## Resumen ejecutivo

Agente para captura de leads en eventos tech. OpenClaw es el cerebro central que recibe datos de leads (vía Telegram), los estructura, enriquece con búsquedas web propias, genera embeddings, y responde consultas RAG. n8n solo maneja la transcripción de audio. Dashboard web con Cursor + Claude Code.

---

## Cambios vs. plan v1

| Aspecto | v1 | v2 |
|---|---|---|
| **Orquestación principal** | n8n (todo) | OpenClaw (cerebro) + n8n (solo audio) |
| **Transcripción** | n8n + Groq Whisper | n8n + OpenAI Whisper (nodo IA nativo) |
| **n8n → OpenClaw** | Webhook HTTP | Mensaje Telegram con prefijo [LEAD] |
| **Búsquedas web** | SerpAPI / Tavily | OpenClaw nativo (web search integrado) |
| **Embeddings** | Ollama local (requiere VRAM) | Gemini Embedding API (free tier, cloud) |
| **Consultas Telegram** | RAG custom via n8n | Chat directo con OpenClaw |
| **LLM para estructurar** | Groq Llama vía n8n | Claude/GPT vía OpenClaw (su LLM backend) |

---

## Stack técnico definitivo

| Componente | Herramienta | Costo |
|---|---|---|
| **Agente central** | OpenClaw (Docker, local) | $0 |
| **LLM backend de OpenClaw** | Claude API (vía Codex) o GPT | Según plan/Codex |
| **Transcripción audio** | n8n + nodo IA con OpenAI Whisper | Según plan OpenAI |
| **Embeddings** | Gemini Embedding API (gemini-embedding-001) | $0 (free tier) |
| **Búsquedas web** | OpenClaw nativo (no necesita API externa) | $0 |
| **Base de datos** | PostgreSQL + pgvector (Docker) | $0 |
| **ORM** | Prisma | $0 |
| **Backend API** | Node.js + Express | $0 |
| **Frontend** | React + Vite | $0 |
| **Dev tools** | Cursor + Claude Code | Según plan |
| **Mensajería** | Telegram Bot API | $0 |

---

## Arquitectura por capas

### Capa 1: Entrada (Telegram)

Todo entra por Telegram. Un solo bot con 4 tipos de input:

1. **Audio (voice message)** → n8n intercepta → Groq Whisper → texto transcrito → OpenClaw
2. **Texto** → OpenClaw directo
3. **Foto** → OpenClaw directo (usa vision del LLM backend)
4. **Consulta/pregunta** → OpenClaw directo → responde con RAG

**Cómo distinguir input de lead vs. consulta:**
OpenClaw usa un skill que detecta el intent del mensaje:
- Si empieza con `[LEAD]` → audio transcrito por n8n, modo captura de lead
- Si empieza con "?" o "/consulta" o "/query" → modo consulta RAG
- Si es foto o texto descriptivo de un contacto → modo captura de lead
- Comando "/resumen" → genera resumen del evento actual
- Comando "/stats" → estadísticas rápidas

### Capa 2: n8n (solo transcripción de audio)

n8n tiene un único workflow de 4 nodos:

```
Telegram Trigger (filtrar solo voice messages)
  → HTTP Request: descargar archivo de audio de Telegram
  → Nodo de transcripción IA (API key de OpenAI / Whisper)
  → Telegram Send Message: enviar "[LEAD] {transcripción}" al mismo chat
```

**Paso clave — el mensaje de vuelta a Telegram:**
n8n envía la transcripción como mensaje de Telegram al mismo chat donde OpenClaw está escuchando. El prefijo `[LEAD]` permite a OpenClaw distinguir automáticamente entre datos de leads y consultas normales.

Ejemplo de mensaje que n8n envía:
```
[LEAD] Acabo de hablar con María García de Fintech Solutions, 
es COO, buscan integrar IA en su sistema de pagos...
```

**¿Por qué n8n y no OpenClaw directo para audio?**
OpenClaw no tiene soporte nativo optimizado para transcripción de audio. n8n lo resuelve en 4 nodos sin código, usando el nodo de transcripción IA con la API key de OpenAI. Es más robusto separar esta responsabilidad.

### Capa 3: OpenClaw (cerebro)

OpenClaw corre en Docker local y se conecta a Telegram como interfaz principal. Usa Claude (vía API key o Codex) como su LLM backend.

**Skills de OpenClaw a crear:**

#### Skill 1: "Procesar Lead"
```
Cuando recibas un mensaje que empiece con "[LEAD]" (enviado por n8n tras 
transcribir un audio), o cuando recibas un mensaje de texto/foto que sea
claramente datos de un lead:

1. Extrae los siguientes campos en formato JSON:
   - name: nombre completo del contacto
   - company: nombre de la empresa
   - companyType: tipo (startup, corporation, agency, freelancer, investor, other)
   - role: cargo o rol
   - email: si se menciona
   - phone: si se menciona
   - businessAngle: posible ángulo de negocio
   - notes: otros datos relevantes

2. Guarda el lead en la base de datos PostgreSQL usando la API del backend
   (POST http://localhost:3001/api/leads)

3. Confirma por Telegram: "✅ Lead registrado: {nombre} - {empresa} ({companyType})"

4. Automáticamente ejecuta el skill "Enriquecer Lead" con el ID del lead creado
```

#### Skill 2: "Enriquecer Lead"
```
Cuando necesites enriquecer un lead:

1. Busca en internet información sobre la empresa:
   - Sitio web oficial
   - Descripción de lo que hacen
   - Tamaño aproximado (empleados, funding si es startup)

2. Busca información sobre la persona:
   - Perfil de LinkedIn (URL)
   - Rol actual verificado
   - Otras menciones relevantes

3. Actualiza el lead en la base de datos con los datos encontrados
   (PATCH http://localhost:3001/api/leads/:id/enrich)

4. Confirma por Telegram: "🔍 Enriquecido: {empresa} - {resumen corto}"
```

#### Skill 3: "Consultar Leads"
```
Cuando el usuario haga una pregunta sobre los leads (mensajes que empiecen
con "?" o "/consulta"):

1. Genera un embedding de la pregunta usando la API del backend
   (POST http://localhost:3001/api/embeddings/query)

2. El backend buscará leads similares en pgvector y devolverá contexto

3. Con el contexto de leads relevantes, responde la pregunta del usuario

4. Siempre cita los leads específicos que usas para responder

Ejemplos de preguntas:
- "?cuántos leads de fintech tenemos"
- "?quién era el de la startup de logística"
- "/consulta empresas que podrían ser clientes para nuestro producto de IA"
```

#### Skill 4: "Resumen de Evento"
```
Cuando el usuario escriba "/resumen":

1. Consulta la API del backend (GET http://localhost:3001/api/events/:id/stats)

2. Genera un resumen ejecutivo con:
   - Total de leads capturados
   - Distribución por tipo de empresa
   - Top 3 ángulos de negocio más mencionados
   - Leads más prometedores (según businessAngle)

3. Responde por Telegram con el resumen formateado
```

### Capa 4: Backend API (Node.js + Express + Prisma)

El backend es el puente entre OpenClaw y la base de datos. También sirve el dashboard.

**Endpoints:**

```
# Leads CRUD
POST   /api/leads                    → Crear lead (desde OpenClaw)
GET    /api/leads?eventId=&search=   → Listar leads con filtros
GET    /api/leads/:id                → Detalle de lead
PATCH  /api/leads/:id/enrich         → Actualizar datos de enriquecimiento

# Embeddings
POST   /api/embeddings/generate      → Generar embedding para un lead (Gemini API)
POST   /api/embeddings/query         → Buscar leads similares (pgvector)

# Eventos
GET    /api/events                   → Listar eventos
POST   /api/events                   → Crear evento
GET    /api/events/:id/stats         → Estadísticas de un evento

# RAG
POST   /api/rag/query                → Consulta RAG completa (embed + search + LLM)
```

**Flujo de embeddings (en el backend, no en OpenClaw):**

```javascript
// Cuando se crea un lead, el backend genera el embedding automáticamente

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values; // vector de 768 dimensiones
}

// En el endpoint POST /api/leads:
// 1. Guardar el lead
// 2. Crear texto combinado: `${name} ${company} ${role} ${businessAngle} ${notes}`
// 3. Generar embedding con Gemini
// 4. Guardar embedding en pgvector
```

### Capa 5: Base de datos (PostgreSQL + pgvector)

Mismo schema que v1, sin cambios. pgvector almacena embeddings de 768 dimensiones (Gemini embedding-001).

### Capa 6: Dashboard (React + Vite)

Desarrollado con **Cursor** (frontend) y **Claude Code** (backend + lógica).

**Vistas:**
1. **Tabla de leads** — filtros, búsqueda full-text, selector de evento
2. **Vista detalle** — todos los campos + datos de enriquecimiento web
3. **Estadísticas** — charts de distribución por tipo, ángulo de negocio, timeline

---

## Plan de ejecución — 12 días

### FASE 1: Infraestructura (Días 1-2)

**Día 1 — Setup del entorno**
- [ ] Docker compose: PostgreSQL + pgvector + n8n + OpenClaw
- [ ] Crear bot de Telegram con @BotFather
- [ ] Obtener API key de OpenAI (para Whisper en n8n)
- [ ] Obtener API key de Gemini (aistudio.google.com) — gratis
- [ ] Configurar OpenClaw con Claude API key o Codex
- [ ] Verificar que OpenClaw responde en Telegram

**Día 2 — Base de datos y backend base**
- [ ] Inicializar proyecto Node.js con Express
- [ ] Configurar Prisma con schema (Lead, Event)
- [ ] Ejecutar migraciones + habilitar pgvector
- [ ] Crear seed con evento de prueba
- [ ] Implementar endpoints CRUD básicos
- [ ] Probar: POST /api/leads guarda correctamente

**Docker compose:**
```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: standagent
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin
    ports:
      - "5678:5678"
    volumes:
      - n8ndata:/home/node/.n8n

  # OpenClaw se instala aparte vía Claude Code
  # siguiendo https://openclaw.ai setup guide

volumes:
  pgdata:
  n8ndata:
```

### FASE 2: Pipeline de captura (Días 3-5)

**Día 3 — n8n: audio → texto → Telegram**
- [ ] Configurar Telegram trigger en n8n (filtrar solo voice messages)
- [ ] Nodo HTTP Request: descargar archivo de audio de Telegram
- [ ] Nodo transcripción IA: configurar con API key de OpenAI (Whisper)
- [ ] Nodo Telegram Send Message: enviar "[LEAD] {transcripción}" al chat
- [ ] Probar: enviar audio → transcripción aparece en Telegram con prefijo [LEAD]

**Día 4 — OpenClaw: skills de captura**
- [ ] Crear Skill 1 "Procesar Lead" en OpenClaw
- [ ] Configurar OpenClaw para llamar API del backend (POST /api/leads)
- [ ] Implementar endpoint de embeddings con Gemini en el backend
- [ ] Probar: audio → n8n → OpenClaw → lead guardado en DB con embedding
- [ ] Verificar confirmación de vuelta en Telegram

**Día 5 — OpenClaw: texto + fotos + enriquecimiento**
- [ ] Configurar OpenClaw para procesar mensajes de texto directos
- [ ] Configurar OpenClaw para procesar fotos (OCR vía vision del LLM)
- [ ] Crear Skill 2 "Enriquecer Lead" en OpenClaw
- [ ] Probar: lead creado → OpenClaw busca en web → datos enriquecidos guardados
- [ ] Probar con 10 leads reales de prueba

### FASE 3: Consultas RAG (Días 6-7)

**Día 6 — Backend RAG**
- [ ] Implementar POST /api/embeddings/query (generar embedding + pgvector search)
- [ ] Implementar POST /api/rag/query (contexto + respuesta LLM)
- [ ] Probar consultas desde Postman/curl

**Día 7 — OpenClaw: skills de consulta**
- [ ] Crear Skill 3 "Consultar Leads" en OpenClaw
- [ ] Crear Skill 4 "Resumen de Evento" en OpenClaw
- [ ] Probar: "?quién era el de la startup de logística" → respuesta contextual
- [ ] Probar: "/resumen" → estadísticas del evento
- [ ] Ajustar prompts y calidad de respuestas

### FASE 4: Dashboard web (Días 8-11)

**Día 8 — Setup frontend + tabla de leads (con Cursor)**
- [ ] Scaffold React + Vite + TailwindCSS
- [ ] Conectar con API del backend
- [ ] Vista tabla de leads con paginación y búsqueda
- [ ] Selector de evento

**Día 9 — Vista detalle + filtros**
- [ ] Vista detalle de lead (todos los campos + enriquecimiento)
- [ ] Filtros: tipo de empresa, fecha, fuente (audio/texto/foto)
- [ ] Exportar a CSV

**Día 10 — Estadísticas**
- [ ] Implementar GET /api/events/:id/stats en backend
- [ ] Charts: distribución por tipo de empresa (pie)
- [ ] Charts: leads por día/hora (bar)
- [ ] Top ángulos de negocio

**Día 11 — Pulido**
- [ ] Responsive (funcione en el teléfono del stand)
- [ ] Dark mode
- [ ] Loading states y error handling
- [ ] UX final

### FASE 5: Testing y deploy (Días 12-13)

**Día 12 — Integration testing**
- [ ] Test completo: audio → Telegram → n8n → OpenClaw → DB → dashboard
- [ ] Test de volumen: 20 leads seguidos
- [ ] Test de consultas RAG con datos reales
- [ ] Test de enriquecimiento web
- [ ] Fix bugs críticos

**Día 13 — Preparar para el evento**
- [ ] Crear evento nuevo en el sistema
- [ ] Backup de DB vacía (template reutilizable)
- [ ] Cheatsheet de comandos de arranque
- [ ] Ensayo general: 5 leads de prueba end-to-end
- [ ] Verificar que todo arranca con un solo `docker-compose up`

---

## Cómo usar Claude Code para el desarrollo

### Para el backend (Express + Prisma):
```bash
# En el directorio del proyecto
claude-code "Crea un servidor Express con Prisma conectado a PostgreSQL 
con pgvector. Necesito endpoints CRUD para leads y eventos, un endpoint 
para generar embeddings con la API de Gemini, y un endpoint RAG que 
busque leads similares con pgvector y responda preguntas. 
Usa este schema de Prisma: [pegar schema]"
```

### Para los skills de OpenClaw:
```bash
# Configurar OpenClaw skills vía Claude Code
claude-code "Configura OpenClaw con los siguientes skills para un 
sistema de captura de leads en eventos tech: [pegar skills]
El agente debe conectarse a Telegram y llamar a la API local en 
localhost:3001 para guardar y consultar leads."
```

### Para el frontend (con Cursor):
Abrir Cursor en el directorio del frontend y usar Composer:
```
"Crea un dashboard React + Vite + Tailwind para visualizar leads de eventos.
Necesito 3 vistas: tabla de leads con filtros y búsqueda, vista detalle 
de un lead, y estadísticas del evento con charts. 
La API está en localhost:3001. [pegar endpoints]"
```

---

## Flujo completo paso a paso

### Captura de lead por audio:
```
1. Tú en el stand: grabas audio en Telegram → "Acabo de hablar con 
   María García de Fintech Solutions, es COO, buscan integrar IA 
   en su sistema de pagos, les interesa nuestro API de embeddings"

2. n8n intercepta el voice message → descarga audio → nodo IA con 
   OpenAI Whisper transcribe → envía mensaje a Telegram:
   "[LEAD] Acabo de hablar con María García de Fintech Solutions..."

3. OpenClaw ve el mensaje con prefijo [LEAD] en Telegram

4. OpenClaw (Skill 1) extrae:
   {
     name: "María García",
     company: "Fintech Solutions",
     companyType: "startup",
     role: "COO",
     businessAngle: "Integrar IA en sistema de pagos, interés en API de embeddings"
   }

5. OpenClaw llama POST /api/leads → backend guarda + genera embedding

6. OpenClaw (Skill 2) busca en web:
   - "Fintech Solutions" → sitio web, descripción, funding
   - "María García COO Fintech Solutions LinkedIn" → perfil

7. OpenClaw llama PATCH /api/leads/:id/enrich → backend actualiza

8. Telegram te confirma:
   "✅ Lead: María García - Fintech Solutions (startup/COO)
   🔍 Empresa: Plataforma de pagos B2B, Serie A, 45 empleados
   🔗 LinkedIn: linkedin.com/in/maria-garcia-fintech"
```

### Consulta RAG por Telegram:
```
1. Tú escribes: "?qué leads de fintech tenemos y cuáles son los más prometedores"

2. OpenClaw (Skill 3) llama POST /api/rag/query

3. Backend genera embedding de la pregunta → pgvector busca similares
   → encuentra 3 leads de fintech → envía contexto al LLM

4. OpenClaw responde en Telegram:
   "Tenemos 3 leads de fintech:
   - María García (Fintech Solutions) - COO, busca integrar IA en pagos ⭐
   - Jorge Pérez (PayFlow) - CTO, interesado en nuestra API
   - Ana López (CryptoBank) - BD Manager, exploración temprana
   
   El más prometedor es María García: su empresa ya está en Serie A 
   y tiene un caso de uso claro para nuestro producto."
```

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| OpenClaw es complejo de configurar | Usar Claude Code para el setup; seguir guía oficial; Docker aísla problemas |
| WiFi inestable en el evento | OpenClaw tiene retry; n8n tiene cola; PostgreSQL es local |
| OpenClaw actúa sin control | Configurar "confirm before acting" para acciones destructivas; skills bien definidos limitan el scope |
| Gemini embedding free tier se agota | Volumen de un evento (50-200 leads) está muy dentro del free tier |
| LLM backend de OpenClaw tiene costo | Usar Codex si está disponible; o modelo alternativo como fallback |
| OpenAI Whisper API tiene costo | Costo mínimo (~$0.006/minuto); 200 audios de 1 min ≈ $1.20 total |
| Audio ruidoso | Grabar cerca del micrófono; tener fallback de texto manual |

---

## Prioridades si el tiempo se acorta

Si no llegas a los 12 días, esto es lo mínimo viable:

**MVP (5 días):**
- [x] Docker + PostgreSQL + n8n + OpenClaw
- [x] Audio → texto → OpenClaw → lead en DB
- [x] Consultas RAG por Telegram
- [ ] ~~Dashboard web~~
- [ ] ~~Enriquecimiento web~~
- [ ] ~~Fotos/OCR~~

Con solo el MVP ya puedes capturar y consultar leads desde Telegram. El dashboard puede esperar al siguiente evento.
