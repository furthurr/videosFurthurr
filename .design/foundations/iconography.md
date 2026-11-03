# Iconografía y assets

Fuentes de verdad: `iconBase.png`, `public/icons/`, `index.html:11-46`, `src/lib.ts:8-10` y `README.md:107-125`.

## Assets versionados

| Archivo | Uso |
| --- | --- |
| `iconBase.png` | Original de marca, 1636 × 1647 px. |
| `public/icons/favicon.ico` | Favicon multi-tamaño. |
| `public/icons/favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Favicons PNG. |
| `public/icons/apple-touch-icon.png` | Icono para iOS, 180 px. |
| `public/icons/icon-192.png`, `icon-512.png` | Iconos PWA y manifest. |
| `public/icons/og-image.png` | Imagen social del sitio, 1200 × 630 px. |
| `public/site.webmanifest` | Manifest web. |

## Uso en la UI

- `icons.mark` apunta a `icon-192.png` y se usa en logo, footer, hero y bloques destacados.
- `icons.social` apunta a `og-image.png` para la identidad social base.
- `index.html` registra favicon, apple touch icon, manifest y Open Graph base.
- Las páginas sociales generadas pueden sustituir la imagen base por la portada del vídeo.
- El avatar del autor procede de un recurso público de GitHub y no es un asset local.

## Glifos inline

La UI usa caracteres Unicode para acciones visuales: `▶`, `↗`, `⧉`, `⌕`, `←` y `＋`. Su tamaño y representación dependen de la fuente del sistema y no forman un set de iconos normalizado.

Fuentes: `src/main.tsx:113-125`, `src/main.tsx:189-232`, `src/main.tsx:378-384`, `src/main.tsx:459-463` y `src/pages/Admin.tsx:181-193`.

## Convenciones

- Los iconos decorativos tienen `alt=""` o `aria-hidden="true"` cuando el texto cercano comunica la acción.
- Las imágenes de autor tienen texto alternativo cuando son el destino del enlace; la marca decorativa no duplica el nombre.
- Los tamaños explícitos de marca son 22, 39 y 44 px en el shell y hero; el avatar usa 42 y 34 px.
- No se copian assets dentro de `.design/`; se referencia la ruta original.

## Generación

Después de cambiar `iconBase.png`, ejecutar `npm run icons` para regenerar los tamaños de `public/icons/`. El diseño visual documenta los outputs existentes y no ejecuta el generador durante la documentación.
