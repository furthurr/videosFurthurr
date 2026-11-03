# Entornos y configuración

Los valores concretos se mantienen fuera de la documentación. Los ejemplos usan placeholders.

## Frontend local y build

| Variable | Uso | Sensibilidad | Ejemplo documental |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | URL base del proyecto Supabase | Pública en el bundle | `https://<SUPABASE_PROJECT_REF>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable/anon del cliente | Pública, limitada por RLS | `<SUPABASE_PUBLISHABLE_KEY>` |
| `BASE_PATH` | Prefijo de rutas de Vite/Pages | Pública | `/<REPOSITORY_NAME>/` |
| `SITE_URL` | URL base del sitio, debe terminar en `/` | Pública | `https://<SITE_ORIGIN>/<BASE_PATH>/` |
| `REQUIRE_SUPABASE` | Hace fallar el build si faltan credenciales públicas | No sensible | `true` en CI de Pages |

El frontend no debe recibir claves service role/secret mediante una variable `VITE_*`.

Fuentes: `src/lib.ts:3-8`, `scripts/generate-pages.mjs:5-12` y `.github/workflows/pages.yml:21-28`.

## Supabase

- Proyecto: se referencia mediante `<SUPABASE_PROJECT_REF>` en URLs documentales.
- Auth: proveedor GitHub configurado en Supabase, con callback hacia `/admin/`.
- Edge Function: `manage-video`.
- Gateway: `verify_jwt = false`; la función valida la sesión manualmente.
- Variables de servidor esperadas por la Function: `SITE_ORIGINS`/`SITE_ORIGIN`, `GITHUB_REPOSITORY`, `GITHUB_REF`, `GITHUB_DEPLOY_TOKEN`, además de las variables Supabase proporcionadas por la plataforma.
- `SITE_ORIGINS` contiene orígenes exactos separados por comas; no debe usar comodines.

Fuentes: `supabase/config.toml:1-4` y `supabase/functions/manage-video/index.ts:4-13`, `supabase/functions/manage-video/index.ts:31-91`.

## GitHub Actions / Pages

El workflow usa Node 22, instala dependencias con `npm ci`, ejecuta tests unitarios, formato, Playwright y build, y despliega `dist/` a Pages. La configuración se entrega como variables de Actions:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `BASE_PATH`
- `SITE_URL`
- `REQUIRE_SUPABASE=true`

Fuentes: `.github/workflows/pages.yml:18-53`.

## Matriz de entornos

| Entorno | Datos | Cliente | Build/despliegue |
| --- | --- | --- | --- |
| Desarrollo local | Proyecto Supabase configurado o pantalla de instalación si faltan variables | Variables del proceso local | `npm run dev`; no publica automáticamente. |
| CI de Pages | Proyecto Supabase configurado mediante variables públicas | Clave publishable | `npm ci`, pruebas, `npm run build`, Pages. |
| Edge Function | Proyecto Supabase gestionado | Service role y token de GitHub solo en el entorno de servidor | Copia Storage y solicita workflow de Pages. |

La separación entre entornos depende de sus variables y configuración de Supabase; no hay un archivo de perfiles versionado.
