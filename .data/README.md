# Datos & API — Furthurr Videos

Documentación canónica de la capa de datos y APIs. Léela antes de tocar contratos, persistencia o integraciones.

## Estado de sincronización

- Tecnología detectada: Supabase Auth, PostgreSQL/PostgREST, Supabase Storage y Edge Functions; cliente `@supabase/supabase-js`.
- Modo: `full`.
- ¿BD interna?: sí, PostgreSQL del proyecto, gestionado por Supabase.
- Último commit documentado: `f8a57bcfd635d717e5f4631a7b194b8381dd4b27`.
- Última actualización: 2026-11-02.
- Estado: la marca apunta a `HEAD`, pero hay cambios relevantes sin commit en `README.md`, `e2e/admin.spec.ts`, `src/lib.ts`, `src/pages/Admin.tsx` y `supabase/functions/manage-video/index.ts`. La documentación refleja esas fuentes del árbol de trabajo; no se puede demostrar sincronización completa con Git hasta establecer un nuevo baseline.

## Contexto para IA

- **Qué consume y expone:** el navegador consume tablas públicas mediante PostgREST/SDK, RPCs de administración, Storage y la Edge Function `manage-video`. El build consulta las publicaciones visibles para generar páginas sociales. No hay un contrato OpenAPI, GraphQL, AsyncAPI o Protobuf en el repositorio; este catálogo es la referencia equivalente.
- **Auth:** Supabase Auth con GitHub OAuth. Las operaciones administrativas usan la sesión del usuario; `manage-video` recibe el bearer de sesión y valida la identidad y `is_admin` antes de usar credenciales de servidor.
- **Modelos clave:** `Video`, `video_links`, `admin_users`, `SaveVideoData`, `ManageVideoRequest`, `DeploymentState` y el mapa `SocialManifest`.
- **Fuentes de datos:** PostgreSQL para metadatos y relaciones, Storage para vídeos y portadas, Auth para sesiones, la Edge Function para operaciones privilegiadas y GitHub Actions para el artefacto estático.
- **Convenciones:** lecturas en páginas de 100 filas, UUID como identificador, rutas de Storage bajo `<USER_ID>/<VIDEO_ID>/`, estados `draft`/`published`, timeouts explícitos en llamadas de generación y GitHub, y errores de UI normalizados a mensajes seguros.
- **Campos sensibles/PII:** sesiones, identificadores de usuario, rutas privadas y secretos de servidor. Se documentan por categoría en [06-sensitive-data.md](06-sensitive-data.md), sin valores.

## Índice

- [01-endpoints.md](01-endpoints.md): catálogo de Auth, PostgREST, RPC, Storage, Edge Function y manifiesto.
- [02-models.md](02-models.md): modelos de datos, payloads y JSON Schema.
- [03-mapping.md](03-mapping.md): mapeos entre formulario, Storage, RPC, tablas y vistas.
- [04-schema.md](04-schema.md): esquema PostgreSQL, relaciones, RLS, funciones y buckets.
- [05-conventions.md](05-conventions.md): autenticación, errores, paginación, timeouts y consistencia.
- [06-sensitive-data.md](06-sensitive-data.md): campos sensibles, PII y secretos por ubicación.
- [07-environments.md](07-environments.md): entornos y configuración con placeholders.
- [data-tech-debt.md](data-tech-debt.md): deuda técnica de datos y APIs priorizada.

## Fuentes de verdad

- Cliente y tipos: `src/lib.ts:1-117`.
- Consultas públicas: `src/main.tsx:152-157` y `src/main.tsx:317-322`.
- Flujos administrativos: `src/pages/Admin.tsx:28-104` y `src/pages/Admin.tsx:404-516`.
- Esquema, RLS y RPC: `supabase/migrations/202610290001_initial.sql:1-107`.
- Soporte de MP4: `supabase/migrations/202611020001_allow_mp4.sql:1-4`.
- Edge Function: `supabase/functions/manage-video/index.ts:94-266`.
- Lectura para páginas sociales: `scripts/generate-pages.mjs:5-75`.
