# Furthurr Videos

Biblioteca pública de videos WebM, con administración privada, Supabase y despliegue estático en GitHub Pages. React + TypeScript + Vite.

## Estado

El proyecto remoto `videosFurthurr` ya está creado en Supabase (ref. `qrjdhywokjxufqsonnpj`, región `us-east-1`). La migración inicial está aplicada y registrada; las tablas, políticas RLS y buckets quedaron verificados. La Edge Function `manage-video` está desplegada y una petición sin sesión responde HTTP 401.

**Aún no está listo para administrar/publicar desde la web:** falta configurar las variables públicas del frontend, GitHub OAuth, autorizar tu usuario en `admin_users` y conectar el repositorio/secretos de GitHub para generar las páginas sociales. No hay videos de ejemplo. Sin configuración del frontend, la web muestra una pantalla de instalación.

## Desarrollo local

Requisitos: Node 22.12 o superior y npm.

```sh
npm ci
npm test
npm run dev
```

Vite utiliza `/videosFurthurr/` como base. Abre la dirección que imprime el servidor añadiendo ese prefijo.

Configura en el entorno del proceso estas variables **públicas** (no contienen privilegios administrativos):

| Variable                        | Valor                                    |
| ------------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`             | `https://PROJECT.supabase.co`            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública publishable de tu proyecto |
| `BASE_PATH`                     | `/videosFurthurr/`                       |
| `SITE_URL`                      | URL pública completa terminada en `/`    |

No uses una clave secreta o service-role en ninguna variable `VITE_*`. No subas archivos de credenciales al repositorio.

Para probar la biblioteca contra el proyecto remoto antes de crear un repositorio GitHub, copia su **publishable key** desde Supabase → Project Settings → API Keys y pásala solo a tu proceso local:

```sh
VITE_SUPABASE_URL='https://PROJECT_REF.supabase.co' \
VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_…' \
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Abre `http://127.0.0.1:5175/videosFurthurr/`. Se usa el puerto 5175 porque en este entorno los puertos 5173 y 5174 pertenecen a otra aplicación. La clave `sb_publishable_…` está pensada para el cliente y queda restringida por RLS; nunca uses una clave `sb_secret_…` o service-role. En este proyecto nuevo la biblioteca estará vacía hasta publicar el primer video.

## 1. Configurar Supabase

1. Proyecto `videosFurthurr` creado; la migración `supabase/migrations/202610290001_initial.sql` ya está aplicada en el proyecto remoto y su versión registrada. No la ejecutes otra vez con `db query`.
2. En Authentication, habilita GitHub. Crea una OAuth App de GitHub con el callback que muestra Supabase. Configura su identificador y secreto **solo en Supabase**.
3. En URL Configuration añade la URL de producción de `/admin/` a las redirecciones autorizadas. Para desarrollo añade explícitamente la dirección local con su prefijo y `/admin/`.
4. Entra una vez con tu cuenta de GitHub desde la aplicación. La primera vez verás «Acceso restringido».
5. En Authentication → Users, identifica tu usuario por su identidad GitHub y copia su UUID. Autorízalo mediante SQL Editor:

```sql
insert into public.admin_users(user_id)
values ('UUID_DE_TU_USUARIO'::uuid);
```

6. Cierra sesión y vuelve a entrar. No hay un mecanismo de «primer usuario es administrador».

La tabla de administradores no es consultable ni editable desde el cliente. RLS limita la lectura pública a publicaciones y la escritura al administrador. La publicación y el borrado de registros pasan por una función de servidor.

## 2. Desplegar la función de administración

La Edge Function `manage-video` ya está desplegada en el proyecto remoto. `supabase/config.toml` desactiva la comprobación JWT del gateway para esa función: **la propia función valida la sesión con Auth y consulta `is_admin` antes de cualquier operación**. Si se cambia el código, vuelve a desplegarla:

```sh
supabase functions deploy manage-video
```

Para actualizar las previsualizaciones sociales después de publicar, configura mediante el almacén seguro de Supabase:

| Configuración de servidor | Uso                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| `SITE_ORIGINS`            | Orígenes permitidos separados por coma; Pages y desarrollo local        |
| `GITHUB_REPOSITORY`       | `OWNER/REPOSITORY`                                                      |
| `GITHUB_REF`              | Rama de despliegue; predeterminada `main`                               |
| `GITHUB_DEPLOY_TOKEN`     | Token de GitHub limitado a este repositorio, con permiso Actions: write |

Supabase proporciona las variables de URL, anon key y service-role a su entorno de funciones. No las copies al frontend. El proyecto actual permite `https://furthurr.github.io`, `http://localhost:5175` y `http://127.0.0.1:5175` mediante `SITE_ORIGINS`. Si aún no existe un repositorio GitHub configurado, la función responde que la generación social está pendiente; el enlace dinámico sigue disponible. Configura el token con el panel o un flujo seguro de credenciales, nunca en archivos versionados ni en un mensaje público. El token **no** necesita escribir código.

Para agregar otro origen local, modifica `SITE_ORIGINS` para incluirlo exactamente; no uses comodines ni amplíes CORS indiscriminadamente en producción.

## 3. Publicar en GitHub Pages

1. Sube el proyecto a tu repositorio cuando decidas versionarlo. Este proyecto no realiza commits ni push automáticamente.
2. En Settings → Pages selecciona **GitHub Actions** como origen.
3. En Settings → Secrets and variables → Actions → Variables configura las cuatro variables públicas de la tabla de desarrollo.
4. Si cambias el nombre del repositorio o utilizas dominio propio, ajusta `BASE_PATH`, `SITE_URL`, las redirecciones de Auth y `SITE_ORIGIN` de forma coherente.
5. El workflow `.github/workflows/pages.yml` verifica y despliega al actualizar `main`, por ejecución manual y por solicitud de la Edge Function.

Hay una reconciliación programada aproximadamente cada 30 minutos como respaldo. GitHub puede retrasarla o desactivar schedules en repositorios inactivos; no es una garantía de tiempo real. Si falla la lectura de publicaciones, el build falla sin sustituir el último sitio válido.

## Publicar videos

- Accede a `/admin/`, carga un WebM de hasta **40 MB**, escribe el título y guarda el borrador.
- Opcionalmente selecciona una portada JPG/PNG/WebP de hasta 5 MB. La extracción automática depende del códec y puede fallar; en ese caso carga una imagen manualmente.
- Publica el borrador. Los archivos se copian del bucket privado al público y el registro pasa a publicado. Se conservan los originales privados para retirar y volver a publicar.
- El enlace `/watch/?v=UUID` funciona de inmediato, sin build nuevo. Los cambios de datos se consultan desde Supabase cada vez que se abre la vista.
- La página `/v/UUID/` y sus metadatos Open Graph se generan con GitHub Actions. El botón compartir usa ese enlace **solo cuando el manifest del despliegue coincide con la revisión del video**; mientras tanto usa el dinámico.
- Mientras una publicación está abierta en el panel, su estado social se consulta cada 15 segundos. Si aún no está lista, también se comprueba el último workflow de la rama: un fallo se muestra como tal, sin afirmar que la publicación del video haya fallado.
- Para reemplazar archivos de una publicación, retírala primero. Editar título, descripción, etiquetas y recursos no requiere retirarla.
- No hay un botón de descarga, pero un video público sigue siendo descargable por quien tenga acceso al archivo.

Los recursos se escriben como `Nombre | https://URL`, uno por línea. La descripción es texto, no HTML. No se permite contenido activo arbitrario.

## Marca e iconos

`iconBase.png` en la raíz es el original de diseño (1636 × 1647 px). A partir de él se generan los tamaños que usa la web:

| Archivo                                                           | Uso                                     |
| ----------------------------------------------------------------- | --------------------------------------- |
| `public/icons/favicon.ico`                                        | Favicon multi-tamaño (16, 32 y 48 px)   |
| `public/icons/favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Favicons PNG                            |
| `public/icons/apple-touch-icon.png`                               | Icono de iOS (180 px)                   |
| `public/icons/icon-192.png`, `icon-512.png`                       | Iconos PWA y manifiesto web             |
| `public/icons/og-image.png`                                       | Imagen social del sitio (1200 × 630 px) |

Regenera los tamaños después de cambiar el original:

```sh
npm run icons
```

El script recorta a cuadrado, redimensiona y compone el `.ico` y la imagen social. Los resultados se versionan en `public/`, por lo que el despliegue no depende de ejecutarlo.

La marca aparece en la cabecera, el pie y los bloques destacados. Las páginas de cada video usan la portada del video como imagen social; si no hay portada, se usa `og-image.png`.

## Límites y consistencia

- GitHub Pages no ejecuta un servidor ni genera rutas por petición. La disponibilidad inmediata usa una página `/watch/` previamente desplegada con el identificador en la query.
- Compartir un enlace no garantiza reproducción dentro de una red social. Sus robots y cachés son externos; las páginas individuales aportan título, descripción y portada sin necesitar JavaScript.
- Storage y PostgreSQL no comparten transacciones. Una publicación fallida intenta retirar las copias públicas; una retirada borra primero los archivos públicos. Si una operación falla a mitad, revisa el estado en Supabase y reintenta. Dos operaciones simultáneas sobre el mismo video desde pestañas distintas no están soportadas en esta versión.
- Retirar o borrar no elimina copias descargadas ni cachés de CDN/redes. El HTML social anterior puede permanecer hasta el próximo despliegue; la vista deja de obtener el registro como publicación.
- Un fallo de red justo después de subir/guardar puede dejar un archivo huérfano. Revisa periódicamente el almacenamiento. Las actualizaciones de archivos en borradores intentan limpiar los anteriores.
- El consumo incluye originales privados y copias públicas. No hay transcodificación, streaming adaptativo, analítica ni comentarios.
- El perfil usa el avatar público de GitHub y fuentes de Google Fonts con alternativas locales.

## Verificación

```sh
npm test
npm run typecheck
npm run format:check
npm run build
npm run preview
```

El build sin variables es válido para revisar la interfaz de instalación. CI exige Supabase configurado. Las pruebas cubren rutas, validación de archivos, URLs y escape de metadatos. Además, se aplica la migración a PostgreSQL local en memoria (PGlite) para comprobar RLS y la escritura transaccional. Sus esquemas Auth/Storage se simulan: no equivale a verificar un proyecto remoto.

Las pruebas de navegador utilizan respuestas de Supabase simuladas y una sesión ficticia, sin credenciales reales:

```sh
npx playwright install chromium
npm run test:e2e
```

Cubren biblioteca, filtros, rutas directas, móvil, errores de red, enlaces compartidos, edición/publicación desde el panel y reproducción de un WebM VP8 generado en el navegador. Las capturas de escritorio y móvil quedan en `test-results/` (ignorado por Git). La generación estática también se prueba con 101 publicaciones simuladas para verificar paginación y manifest, y con respuestas fallidas para comprobar que se detiene el despliegue.

Antes de considerar producción verificada, prueba en un proyecto real:

1. Visitante anónimo: biblioteca, video publicado, URL directa y copiar enlace.
2. Administrador: OAuth, borrador privado, carga, edición, publicación, retirada y borrado.
3. Otra cuenta: `is_admin = false`, rechazo de escrituras en tablas, Storage y Edge Function; ningún borrador visible.
4. Publicación: workflow ejecutado, manifest actualizado y metadatos visibles en HTML servido.
5. Archivos reales: reproducción y extracción de portada en navegadores compatibles, móvil y escritorio.

Estas comprobaciones requieren servicios remotos configurados y no se sustituyen por un build local.
