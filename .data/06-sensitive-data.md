# Datos sensibles, PII y secretos

Esta página documenta categorías y ubicaciones. No contiene tokens, identificadores reales, dominios productivos ni valores de configuración.

| Campo o categoría | Dónde aparece | Sensibilidad | Cifrado / transporte | Almacenamiento | Notas |
| --- | --- | --- | --- | --- | --- |
| Token de sesión Supabase | Sesión gestionada por el cliente y header hacia PostgREST/Functions | Credencial de sesión | HTTPS; gestión delegada a Supabase | Cliente y transporte de la sesión | No imprimir, persistir manualmente ni incluirlo en URLs. |
| `admin_users.user_id` | Tabla `public.admin_users` y `auth.uid()` | Identificador de usuario | HTTPS y controles de Supabase | PostgreSQL | No exponer la tabla directamente; la función `is_admin()` devuelve solo booleano. |
| UUID de usuario en rutas | Primer segmento de rutas en `drafts` y `published` | Metadato de control de acceso | HTTPS; RLS en borradores | Storage | No es un secreto de autenticación, pero revela relación entre usuario y objeto. |
| `video_path` y `poster_path` de borrador | `videos`, payload RPC y Storage privado | Metadato/ruta privada | HTTPS y RLS | PostgreSQL + bucket `drafts` | Solo el administrador propietario puede leer los borradores autorizados. |
| Contenido de vídeo, portada, título, descripción, etiquetas y enlaces | `videos`, `video_links` y buckets | Contenido aportado por usuario | HTTPS; publicado queda accesible públicamente | PostgreSQL + Storage | El contenido publicado no debe tratarse como privado. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Variables del frontend y CI | Identificador/clave pública | HTTPS | Bundle y configuración de build | Puede exponerse al navegador; RLS debe ser la barrera de autorización. |
| Clave anon/service role de Supabase | Entorno de la Edge Function | Credencial, especialmente service role | HTTPS entre servicios | Secretos gestionados por Supabase | Nunca copiar a `VITE_*`, documentación, logs o repositorio. |
| `GITHUB_DEPLOY_TOKEN` | Entorno de `manage-video` | Credencial de automatización | HTTPS hacia GitHub API | Secretos gestionados por Supabase | Debe limitarse al repositorio y al permiso necesario para Actions. |
| URLs externas de `video_links` | Tabla y UI pública | Puede contener datos personales o de terceros | HTTPS si el enlace lo soporta; se permiten HTTP y HTTPS por contrato | PostgreSQL | El sistema valida formato, no el contenido ni la propiedad del destino. |

## Reglas de manejo

- Usar placeholders como `<SUPABASE_PROJECT_REF>`, `<SESSION_ACCESS_TOKEN>` y `<GITHUB_DEPLOY_TOKEN>` en documentación y ejemplos.
- No registrar tokens ni cuerpos completos de autorización en logs.
- No mover credenciales de servidor al bundle del frontend.
- Tratar las rutas de `drafts` y los identificadores de administración como datos restringidos, aunque no sean secretos criptográficos.
- Aplicar revisión de privacidad al contenido antes de publicarlo en el bucket público.

Fuentes: `src/lib.ts:1-7`, `supabase/migrations/202610290001_initial.sql:1-14`, `supabase/migrations/202610290001_initial.sql:97-107` y `supabase/functions/manage-video/index.ts:31-117`.
