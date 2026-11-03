# Catálogo de endpoints y operaciones

No existe un contrato OpenAPI versionado. Las rutas y operaciones siguientes se derivan de los clientes y migraciones existentes. Los hostnames usan placeholders deliberados.

## Bases y autenticación

- REST de Supabase: `https://<SUPABASE_PROJECT_REF>.supabase.co/rest/v1`.
- Functions de Supabase: `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1`.
- Storage público: `https://<SUPABASE_PROJECT_REF>.supabase.co/storage/v1/object/public`.
- Sitio: `https://<SITE_ORIGIN>/<BASE_PATH>/`.
- Las lecturas públicas usan la clave publishable/anon configurada en el cliente. Las operaciones administrativas usan la sesión Supabase del usuario mediante `Authorization: Bearer <SESSION_ACCESS_TOKEN>`.

## Supabase Auth

### Inicio de sesión GitHub — `signInWithOAuth({ provider: "github" })`

- Propósito: iniciar la sesión privada del panel `/admin/`.
- Auth: inicia el flujo OAuth; no requiere una sesión previa.
- Request: proveedor `github` y `redirectTo` igual al origen actual más `/admin/`.
- Response: Supabase completa el intercambio y mantiene la sesión del cliente.
- Errores: el SDK devuelve `error`; el panel muestra su mensaje en el estado de error.
- Fuente de verdad: `src/pages/Admin.tsx:91-97`.

### Sesión actual y cierre — Supabase Auth SDK

- Propósito: restaurar la sesión, reaccionar a cambios y cerrarla.
- Auth: sesión gestionada por Supabase.
- Operaciones: `onAuthStateChange`, `getSession` y `signOut`.
- Fuente de verdad: `src/pages/Admin.tsx:29-49` y `src/pages/Admin.tsx:99-102`.

## PostgREST: vídeos publicados

### Listar publicaciones — `GET {restBase}/videos`

- Propósito: cargar la biblioteca pública.
- Auth: clave publishable/anon; RLS solo permite filas con `status = published` para visitantes.
- Request observado:
  - `select=*`
  - `status=eq.published`
  - `order=published_at.desc,id.asc`
  - `offset=<N>&limit=100` mediante el rango SDK `[N, N+99]`.
- Response 200: array de [Video](02-models.md#video), sin enlaces anidados.
- Errores: error del SDK; la vista conserva el estado de carga/error y no inventa publicaciones.
- Fuente de verdad: `src/main.tsx:314-327` y las políticas de `supabase/migrations/202610290001_initial.sql:40-54`.

### Obtener una publicación — `GET {restBase}/videos?id=eq.<VIDEO_ID>&status=eq.published`

- Propósito: cargar una publicación para `/watch/?v=<id>` o `/v/<id>/` dinámico.
- Auth: clave publishable/anon.
- Request observado: `select=*,video_links(*)`, filtro por UUID y `maybeSingle()`.
- Response 200: `Video` con `video_links` cuando existen; ausencia de fila se trata como vídeo no encontrado.
- Errores: error del SDK o resultado vacío.
- Fuente de verdad: `src/main.tsx:150-158`.

### Listar contenido del administrador — `GET {restBase}/videos`

- Propósito: cargar borradores y publicaciones para el editor.
- Auth: sesión autenticada; RLS permite contenido del administrador autorizado.
- Request observado: `select=*,video_links(*)`, orden `created_at.desc,id.asc` y páginas de 100 mediante `.range(offset, offset + 99)`.
- Response 200: array de `Video` con enlaces anidados.
- Errores: el panel registra el estado de error y detiene la carga.
- Fuente de verdad: `src/pages/Admin.tsx:68-82` y las políticas de `supabase/migrations/202610290001_initial.sql:40-50`.

### Guardar metadatos — `POST {restBase}/rpc/save_video`

- Propósito: crear o actualizar un vídeo y reemplazar su lista completa de enlaces en una operación lógica.
- Auth: sesión autenticada y usuario autorizado por `is_admin`.
- Request:

```json
{
  "p_id": "<VIDEO_UUID>",
  "p_data": {
    "title": "<TITLE>",
    "description": "<DESCRIPTION>",
    "tags": ["<TAG>"],
    "video_path": "<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<webm|mp4>",
    "poster_path": "<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<jpg|png|webp>",
    "duration": 12.34
  },
  "p_links": [
    { "label": "<LABEL>", "url": "https://<HOST>/<PATH>" }
  ]
}
```

- Response 200/204: función `void`; el cliente comprueba `error`.
- Errores: autorización denegada, enlaces no válidos, restricciones de columnas, rutas inválidas o error del SDK.
- Fuente de verdad: `src/pages/Admin.tsx:457-471` y `supabase/migrations/202610290001_initial.sql:78-95`.

### Comprobar administrador — `POST {restBase}/rpc/is_admin`

- Propósito: saber si la sesión actual está autorizada para el panel.
- Auth: sesión autenticada o cliente anónimo; la función devuelve `true` solo para un `auth.uid()` registrado.
- Request: sin parámetros.
- Response 200: booleano.
- Errores: error del SDK; el panel trata el resultado como no autorizado.
- Fuente de verdad: `src/pages/Admin.tsx:51-57` y `supabase/migrations/202610290001_initial.sql:7-14`.

## Supabase Storage

### Subir un borrador — `POST <Storage SDK>/object/drafts/<PATH>`

- Propósito: guardar vídeo o portada antes de asociarlos a los metadatos.
- Auth: sesión de administrador.
- Request: objeto binario; vídeos `video/webm` o `video/mp4`, portadas `image/jpeg`, `image/png` o `image/webp`; tamaño máximo 40 MiB según el bucket.
- Ruta: `<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<EXT>`.
- Response: resultado del SDK de Storage.
- Errores: objeto no permitido, política RLS, tamaño o error de red.
- Fuente de verdad: `src/pages/Admin.tsx:416-448`, `src/lib.ts:71-85` y `supabase/migrations/202611020001_allow_mp4.sql:1-4`.

### Previsualizar borrador — `createSignedUrl(<PATH>, 3600)`

- Propósito: entregar al navegador una URL temporal de un recurso privado.
- Auth: sesión de administrador y política de lectura del bucket `drafts`.
- Response: URL firmada con duración solicitada de 3600 segundos.
- Fuente de verdad: `src/pages/Admin.tsx:300-305`.

### Obtener recurso publicado — `GET {storagePublicBase}/published/<PATH>`

- Propósito: reproducir vídeos y cargar portadas publicadas.
- Auth: no requiere sesión porque `published` es público.
- Fuente de verdad: `src/lib.ts:35-39` y los buckets de `supabase/migrations/202610290001_initial.sql:97-107`.

## Edge Function `manage-video`

### Operación administrativa — `POST {functionsBase}/manage-video`

- Propósito: coordinar cambios de estado, copias/eliminaciones de Storage y solicitud de despliegue social.
- Auth: `Authorization: Bearer <SESSION_ACCESS_TOKEN>`. La configuración del gateway desactiva la validación automática, pero la función valida explícitamente la sesión y `is_admin`.
- Request mínimo:

```json
{
  "operation": "<publish|unpublish|delete|deploy|status|replace-poster>",
  "id": "<VIDEO_UUID>",
  "poster_path": "<DRAFT_POSTER_PATH>"
}
```

`poster_path` solo aplica a `replace-poster`.

- Response de mutación: `{ "ok": true, "deployment": "<MESSAGE>" }`.
- Response de `status`: `{ "state": "pending|failed|unavailable" }`.
- Errores: `405` método no permitido, `401` falta o invalidez de sesión, `403` no administrador, `400` request/ruta inválida, `404` vídeo inexistente, `409` sustitución de portada no permitida y `500` fallo de operación.
- Fuente de verdad: `supabase/functions/manage-video/index.ts:94-266`, `src/lib.ts:105-117` y `supabase/config.toml:3-4`.

### Semántica de operaciones

| Operación | Efecto sobre datos | Efecto sobre Storage | Despliegue |
| --- | --- | --- | --- |
| `publish` | Pasa a `published` y establece `published_at`. | Copia vídeo y portada de `drafts` a `published`; limpia copias parciales si falla. | Solicita el workflow de Pages. |
| `unpublish` | Pasa a `draft` y limpia `published_at`. | Elimina los recursos publicados; conserva los borradores. | Solicita el workflow de Pages. |
| `delete` | Elimina el registro. | Elimina recursos publicados y privados. | Solicita el workflow de Pages. |
| `replace-poster` | Actualiza `poster_path` solo para publicaciones. | Copia la nueva portada, actualiza el registro y elimina la anterior con compensación ante fallo. | Solicita el workflow de Pages. |
| `deploy` | No cambia el modelo. | No cambia Storage. | Solicita el workflow de Pages. |
| `status` | No cambia el modelo. | No cambia Storage. | Consulta el último workflow de la rama configurada. |

## Manifiesto social

### Leer estado estático — `GET <SITE_URL>/social-manifest.json`

- Propósito: decidir si compartir `/v/<VIDEO_ID>/` o la URL dinámica `/watch/?v=<VIDEO_ID>`.
- Auth: público; cache desactivada mediante query temporal y `cache: no-store`.
- Response 200: objeto `{ "<VIDEO_UUID>": "<UPDATED_AT_ISO>" }`.
- Regla: solo se considera listo cuando el valor del vídeo coincide exactamente con `updated_at`.
- Errores: status HTTP no exitoso, JSON inválido o fallo de red devuelven `false` y fuerzan la URL dinámica.
- Fuente de verdad: `src/lib.ts:86-103`.

## Lectura durante el build

### Extraer publicaciones — `GET {restBase}/videos`

- Propósito: generar las páginas sociales durante `npm run build`.
- Auth: header `apikey: <PUBLISHABLE_KEY>`.
- Request: `select=id,title,description,poster_path,updated_at`, `status=eq.published`, `order=id`, `offset=<N>`, `limit=100`.
- Response 200: array con el subconjunto necesario para `renderVideoPage`.
- Errores: cualquier status no exitoso aborta el build para no reemplazar el sitio por un conjunto incompleto; timeout de 30 segundos por solicitud.
- Fuente de verdad: `scripts/generate-pages.mjs:5-58`.

## Dependencia externa de despliegue

La Edge Function solicita el workflow `pages.yml` de GitHub mediante la API de Actions usando configuración de servidor. El navegador no recibe el token ni llama directamente a GitHub. La dependencia está implementada en `supabase/functions/manage-video/index.ts:31-52`.
