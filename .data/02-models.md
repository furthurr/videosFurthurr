# Modelos, DTOs y esquemas

Los tipos del frontend usan los nombres de columna de PostgreSQL. No existe una capa DTO separada: el modelo `Video` se consume directamente desde Supabase y los payloads RPC se construyen en `Admin.tsx`.

## Video

| Campo | Tipo | Requerido | Sensible/PII | Notas |
| --- | --- | --- | --- | --- |
| `id` | `uuid` / `string` | Sí | No | Identificador generado por el cliente para nuevos borradores o por la base de datos por defecto. |
| `title` | `string` | Sí | Contenido | 1-160 caracteres después de recortar espacios. |
| `description` | `string` | Sí | Contenido | Por defecto `""`; máximo 10.000 caracteres. |
| `tags` | `string[]` | Sí | Contenido | Por defecto `[]`; máximo 12 etiquetas y cada etiqueta entre 1 y 40 caracteres. |
| `video_path` | `string` | Sí | Ruta privada/metadatos | Ruta bajo `<USER_ID>/<VIDEO_UUID>/`; acepta WebM o MP4 según el archivo. |
| `poster_path` | `string` | Sí | Ruta privada/metadatos | Ruta de portada JPG, PNG o WebP bajo el mismo prefijo. |
| `duration` | `number \| null` | No | No | Segundos; debe ser finito, no negativo y menor que infinito. |
| `status` | `"draft" \| "published"` | Sí | No | Por defecto `draft`. |
| `published_at` | `string \| null` | No | No | Timestamp ISO; obligatorio cuando `status` es `published`. |
| `updated_at` | `string` | Sí | No | Actualizado por el trigger de PostgreSQL. |
| `created_at` | `string` | Sí | No | Timestamp de creación. |
| `video_links` | `VideoLink[]` | No | Contenido | Presente cuando la consulta solicita la relación anidada. |

Fuente de verdad: `src/lib.ts:19-31` y `supabase/migrations/202610290001_initial.sql:15-29`.

## VideoLink

| Campo | Tipo | Requerido | Sensible/PII | Notas |
| --- | --- | --- | --- | --- |
| `id` | `uuid` / `string` | Sí en la respuesta | No | Generado por la base de datos. |
| `video_id` | `uuid` / `string` | Sí | No | FK a `videos.id`, con borrado en cascada. |
| `label` | `string` | Sí | Contenido | 1-100 caracteres recortados. |
| `url` | `string` | Sí | Potencialmente externo | Debe comenzar con `http://` o `https://`, sin espacios y con máximo 2.048 caracteres. |

Fuente de verdad: `src/lib.ts:31` y `supabase/migrations/202610290001_initial.sql:31-37`.

## AdminUser

| Campo | Tipo | Requerido | Sensible/PII | Notas |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` / `string` | Sí | Identificador de usuario | FK a `auth.users(id)`; registrarse no otorga permisos. |

Fuente de verdad: `supabase/migrations/202610290001_initial.sql:1-14`.

## SaveVideoData

Payload observado en `p_data` de `save_video`:

```json
{
  "title": "<TITLE>",
  "description": "<DESCRIPTION>",
  "tags": ["<TAG>"],
  "video_path": "<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<EXT>",
  "poster_path": "<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<EXT>",
  "duration": 12.34
}
```

- `title`, `video_path` y `poster_path` son necesarios para que la inserción cumpla la tabla.
- `description` se normaliza a cadena vacía si falta en la función.
- `tags` se convierte desde elementos JSON a `text[]`.
- `duration` se convierte a `double precision`.
- El RPC reemplaza metadatos en conflicto por `id` y reconstruye la colección `video_links`.

Fuente de verdad: `src/pages/Admin.tsx:457-469` y `supabase/migrations/202610290001_initial.sql:78-93`.

## SaveVideoRequest

```json
{
  "p_id": "<VIDEO_UUID>",
  "p_data": "<SaveVideoData>",
  "p_links": [
    { "label": "<LABEL>", "url": "https://<HOST>/<PATH>" }
  ]
}
```

`p_links` debe ser un array de como máximo 20 elementos. La URL y el texto se validan en la tabla. Fuente de verdad: `supabase/migrations/202610290001_initial.sql:82-93`.

## ManageVideoRequest

```json
{
  "operation": "publish|unpublish|delete|deploy|status|replace-poster",
  "id": "<VIDEO_UUID>",
  "poster_path": "<DRAFT_POSTER_PATH>"
}
```

- `id` debe ser un UUID.
- `poster_path` solo se usa para sustituir una portada publicada.
- Las rutas se validan contra el usuario de la sesión y el UUID del vídeo.

Fuente de verdad: `supabase/functions/manage-video/index.ts:118-150`.

## DeploymentState

```json
{
  "state": "pending|failed|unavailable"
}
```

Fuente de verdad: `supabase/functions/manage-video/index.ts:56-91`.

## SocialManifest

Mapa JSON público de identificador de vídeo a timestamp de actualización:

```json
{
  "<VIDEO_UUID>": "<UPDATED_AT_ISO>"
}
```

Fuente de verdad: `scripts/generate-pages.mjs:24-69` y `src/lib.ts:86-103`.

## JSON Schema informativo de Video

El esquema resume las restricciones persistentes. La condición de `published_at` se expresa con `if/then`; la validación exacta de espacios recortados y rutas pertenece a PostgreSQL y a la Edge Function.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://<DOCS_HOST>/schemas/video.json",
  "title": "Video",
  "type": "object",
  "required": [
    "id",
    "title",
    "description",
    "tags",
    "video_path",
    "poster_path",
    "status",
    "updated_at",
    "created_at"
  ],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string", "minLength": 1, "maxLength": 160 },
    "description": { "type": "string", "maxLength": 10000 },
    "tags": {
      "type": "array",
      "maxItems": 12,
      "items": { "type": "string", "minLength": 1, "maxLength": 40 }
    },
    "video_path": { "type": "string", "minLength": 1 },
    "poster_path": { "type": "string", "minLength": 1 },
    "duration": { "type": ["number", "null"], "minimum": 0 },
    "status": { "enum": ["draft", "published"] },
    "published_at": { "type": ["string", "null"], "format": "date-time" },
    "updated_at": { "type": "string", "format": "date-time" },
    "created_at": { "type": "string", "format": "date-time" },
    "video_links": {
      "type": "array",
      "items": { "$ref": "#/$defs/videoLink" }
    }
  },
  "allOf": [
    {
      "if": { "properties": { "status": { "const": "published" } } },
      "then": { "required": ["published_at"] }
    }
  ],
  "$defs": {
    "videoLink": {
      "type": "object",
      "required": ["label", "url"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "video_id": { "type": "string", "format": "uuid" },
        "label": { "type": "string", "minLength": 1, "maxLength": 100 },
        "url": {
          "type": "string",
          "pattern": "^https?://[^\\s]+$",
          "maxLength": 2048
        }
      }
    }
  }
}
```
