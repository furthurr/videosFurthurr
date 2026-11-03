# Convenciones de datos y APIs

## Autenticación y autorización

- El frontend crea el cliente con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- GitHub OAuth autentica al administrador mediante Supabase Auth.
- PostgREST y Storage aplican RLS con la sesión del usuario.
- `manage-video` tiene `verify_jwt = false` en el gateway, por lo que valida manualmente el header `Authorization`, obtiene el usuario con `auth.getUser()` y consulta `is_admin()` antes de cualquier operación.
- El service role solo se usa dentro de la Edge Function para las operaciones que el cliente no puede hacer directamente.

Fuentes: `src/lib.ts:1-7`, `src/pages/Admin.tsx:28-97`, `supabase/config.toml:3-4` y `supabase/functions/manage-video/index.ts:94-117`.

## Identificadores y rutas

- Los identificadores de negocio son UUID.
- Los objetos de Storage siguen `<USER_ID>/<VIDEO_UUID>/<FILE_UUID>.<EXT>`.
- La Edge Function valida que las rutas existentes comiencen con el UUID de la sesión y del vídeo.
- No se aceptan rutas libres ni cambios de recursos de una publicación sin pasar por el flujo correspondiente.

Fuentes: `src/pages/Admin.tsx:405-449`, `supabase/functions/manage-video/index.ts:118-150` y `supabase/migrations/202610290001_initial.sql:60-70`.

## Estados de vídeo

- `draft`: metadatos y recursos privados; `published_at` es nulo.
- `published`: recursos copiados al bucket público; `published_at` debe existir.
- El trigger bloquea cambios directos de estado. `manage-video` es la operación autorizada para publicar o retirar.
- `delete` retira recursos públicos y privados y elimina el registro.

Fuente: `supabase/migrations/202610290001_initial.sql:23-27`, `supabase/migrations/202610290001_initial.sql:60-65` y `supabase/functions/manage-video/index.ts:209-251`.

## Paginación y orden

- Las lecturas de listas usan páginas de 100 elementos.
- El frontend usa `.range(offset, offset + 99)` y continúa hasta recibir menos de 100 filas.
- La biblioteca ordena por `published_at desc, id`; el panel ordena por `created_at desc, id`; el generador social ordena por `id`.
- No hay cursor ni sincronización incremental por token.

Fuentes: `src/main.tsx:314-327`, `src/pages/Admin.tsx:68-82` y `scripts/generate-pages.mjs:25-34`.

## Errores y respuestas

- Las llamadas SDK exponen un objeto `error`; cada capa decide si conserva, traduce o registra el fallo.
- La Edge Function responde JSON con `{ error: string }` y los status `400`, `401`, `403`, `404`, `405`, `409` o `500` según el caso.
- `manageVideo` traduce un fallo de invocación a un mensaje genérico y conserva el error funcional devuelto en `data.error`.
- El build aborta si la respuesta de publicaciones no es HTTP exitosa o no es un array.
- La lectura del manifiesto social degrada a URL dinámica ante cualquier fallo.

Fuentes: `src/lib.ts:105-117`, `supabase/functions/manage-video/index.ts:25-29`, `supabase/functions/manage-video/index.ts:98-147`, `scripts/generate-pages.mjs:35-45` y `src/lib.ts:86-103`.

## Timeouts y reintentos

- Lectura REST durante el build: timeout de 30 segundos por solicitud.
- Solicitud de dispatch a GitHub: timeout de 15 segundos.
- Consulta del estado del workflow: timeout de 10 segundos.
- No hay reintentos automáticos en el código; el panel informa una operación pendiente y permite volver a solicitar el despliegue.

Fuentes: `scripts/generate-pages.mjs:35-37` y `supabase/functions/manage-video/index.ts:34-52`, `supabase/functions/manage-video/index.ts:62-91`.

## Consistencia y compensación

- `save_video` mantiene metadatos y enlaces juntos dentro de una función SQL, aunque la subida de binarios ocurre antes.
- Si guardar metadatos falla, el panel elimina los archivos que acaba de subir.
- `publish` elimina copias parciales si alguna copia o actualización falla.
- `replace-poster` elimina la nueva copia si la actualización o la eliminación de la portada anterior falla y revierte el registro cuando es posible.
- El build escribe páginas y manifiesto a partir de una lectura puntual; no es una transacción con la base de datos.

Fuentes: `src/pages/Admin.tsx:404-516`, `supabase/functions/manage-video/index.ts:150-207` y `supabase/functions/manage-video/index.ts:209-262`.

## Versionado

- No hay prefijo de versión en las rutas REST o de la Edge Function.
- El esquema evoluciona mediante migraciones SQL con prefijo temporal.
- Los cambios de contrato deben actualizar `src/lib.ts`, las migraciones o la Edge Function y esta documentación en la misma entrega.
- `updated_at` actúa como revisión de contenido para el manifiesto social, no como versión global de API.
