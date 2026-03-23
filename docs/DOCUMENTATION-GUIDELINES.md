# Documentation Guidelines

Guía sobre los archivos de documentación del proyecto, cuándo actualizarlos y qué contiene cada uno.

---

## Índice de documentos

### [ARCHITECTURE.md](ARCHITECTURE.md)
**Qué contiene:** Visión general del sistema — diagrama de componentes, flujos de datos (captura de lead, RAG query), responsabilidades de cada capa (Telegram, n8n, OpenClaw, Backend, PostgreSQL, Dashboard), estrategia de embeddings.

**Cuándo actualizar:**
- Cuando se agregue o elimine un componente del sistema (ej: nueva capa de caché, nuevo servicio)
- Cuando cambie un flujo de datos principal
- Cuando cambien las responsabilidades entre componentes

**No actualizar por:** cambios internos del backend que no alteren la arquitectura general.

---

### [BACKEND-PATTERNS.md](BACKEND-PATTERNS.md)
**Qué contiene:** Patrones y convenciones del backend — layer stack, naming de archivos, guía paso a paso para agregar un nuevo dominio (con ejemplos de código para cada capa: validator, repository, transformer, controller, routes), patrón de queues, formatos de respuesta, notas sobre auth para OpenClaw.

**Cuándo actualizar:**
- Cuando se establezca un patrón nuevo (ej: middleware custom, nuevo tipo de validator)
- Cuando se modifique una convención existente (ej: cambio en el formato de respuesta)
- Cuando se descubra que un ejemplo de código ya no refleja la realidad del proyecto

**No actualizar por:** implementaciones que siguen los patrones ya documentados.

---

### [API-REFERENCE.md](API-REFERENCE.md)
**Qué contiene:** Referencia completa de la API REST — todos los endpoints implementados y planificados, métodos HTTP, bodies de request, shapes de response, autenticación (JWT, API Key, dual), status codes.

**Cuándo actualizar:**
- Cada vez que se cree, modifique o elimine un endpoint
- Cuando cambie el body de request o el shape de response de un endpoint existente
- Cuando cambie la lógica de autenticación de una ruta
- Al implementar un endpoint que estaba en la sección "Planned"

**No actualizar por:** cambios internos que no afecten el contrato de la API.

---

### [DEVELOPMENT-GUIDE.md](DEVELOPMENT-GUIDE.md)
**Qué contiene:** Guía práctica para desarrolladores — prerequisites, setup inicial, checklist para agregar un nuevo dominio, workflow de base de datos (Prisma), patrón de queues/workers, testing de endpoints (curl/Postman), setup de pgvector, variables de entorno específicas del proyecto, code style.

**Cuándo actualizar:**
- Cuando cambien los pasos de setup (nuevas dependencias, nuevo servicio en Docker)
- Cuando se agregue una nueva herramienta o servicio al workflow
- Cuando cambien variables de entorno requeridas
- Cuando se agregue un nuevo script a package.json

**No actualizar por:** agregar features que no cambien el flujo de desarrollo.

---

### [CHANGELOG.md](CHANGELOG.md)
**Qué contiene:** Registro cronológico de cambios por versión — qué se agregó, modificó o eliminó en cada release, orientado a humanos para mantener visibilidad del progreso y organización de versiones.

**Cuándo actualizar:**
- Al completar una fase o milestone significativo del proyecto
- Al hacer cambios que afecten la estructura, modelos de datos o arquitectura
- Al agregar funcionalidad nueva que sea usable (endpoints, integraciones)
- Al hacer breaking changes (ej: cambio de rutas, eliminación de features)

**Formato:** Seguir la estructura existente — versión, fecha, y listas de Added/Changed/Removed. Mantener la versión más reciente arriba.

---

## Reglas generales

1. **Consistencia**: Todos los docs usan Markdown estándar, inglés para código/técnico, español para descripciones cuando sea natural.
2. **Ejemplos reales**: Preferir ejemplos tomados del código actual del proyecto sobre ejemplos genéricos.
3. **No duplicar**: Si algo ya está en CLAUDE.md (convenciones rápidas), no repetirlo en detalle en los docs — referenciar en su lugar.
4. **Vigencia**: Si un documento tiene información que ya no aplica, corregirlo o eliminarlo. Documentación desactualizada es peor que no tener documentación.
5. **Alcance**: Estos docs cubren el proyecto stand-agent como sistema completo (backend, integración con OpenClaw, dashboard). Documentación específica de librerías externas (Prisma, Bull, etc.) no se duplica aquí.
