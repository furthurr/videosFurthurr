# Furthurr Videos

## Propósito

- **Qué es:** biblioteca pública de vídeos WebM y MP4 con un panel privado para crear borradores y publicar recursos.
- **Alcance:** frontend React estático, integración Supabase, Edge Function administrativa, generación de páginas sociales y despliegue en GitHub Pages.
- **Fuera de alcance:** `node_modules/`, `dist/`, caches, secretos y configuración del host.

## Stack

- **Lenguajes y frameworks:** TypeScript, React, CSS, SQL y JavaScript de Node/Deno.
- **Build / despliegue:** npm, Vite, Vitest, Playwright, GitHub Actions y GitHub Pages.
- **Entrypoints:** `src/main.tsx`, `src/pages/Admin.tsx`, `supabase/functions/manage-video/index.ts`, `scripts/generate-pages.mjs`.

## Mapa rápido

- `src/` → aplicación React pública, reproducción, panel administrativo y cliente compartido.
- `supabase/` → migraciones PostgreSQL, RLS, RPCs, Storage y Edge Function.
- `scripts/` → generación de páginas HTML y metadatos sociales durante el build.
- `.github/workflows/` → verificaciones y publicación en GitHub Pages.
- `tests/` y `e2e/` → pruebas unitarias/integración y escenarios end-to-end.
- `README.md` → instalación, configuración operativa y flujo de publicación.
- `.architecture/` → arquitectura, diagramas C4 y ADRs.
- `.data/` → contratos, modelos, esquema, entornos y deuda de datos/API.
- `.design/` → tokens visuales, componentes y deuda de UI.

Detalle de dependencias: `.navigator/module-map.json`.

## Convenciones

- Mantener la separación entre UI, cliente compartido, Supabase y generación estática.
- El frontend usa claves públicas; las credenciales privilegiadas viven en la Edge Function.
- Las migraciones son la fuente de verdad del esquema; las rutas de Storage siguen el prefijo de usuario y vídeo.
- No indexar `.env`, secretos, dependencias ni outputs de build.

## Docs y contexto externo

- `README.md` — presente; guía de desarrollo y operación.
- `AGENTS.md` — presente; contiene la guía documental gestionada por el orquestador.
- Carpetas canónicas: `.architecture/`, `.data/` y `.design/`.
- `.sdd/`, `.release/` y `graphify-out/` — no detectadas ni gestionadas por esta operación.

## Riesgos y restricciones

- Los cambios locales relevantes impiden demostrar un `source_commit` común para los índices.
- Tratar sesiones, rutas privadas, identificadores de usuarios y secretos de servidor como datos restringidos.
- Consultar arquitectura, datos y diseño antes de modificar sus dominios; validar fuentes directas cuando el índice no tenga baseline.
- Secretos: nunca indexar `.env`, claves ni credenciales; las exclusiones están en `config.yaml`.

## Meta

- Actualizado: 2026-11-03.
- Source commit: no registrado; el working tree contiene cambios relevantes sin commit.
- Navigator root: `.`.
- Generado por: project-navigator bootstrap; contexto refrescado tras la documentación canónica.
