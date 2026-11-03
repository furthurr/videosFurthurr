# Tipografía

Fuente de verdad: `src/styles.css:1-4`, `src/styles.css:60-137` y reglas de controles en `src/styles.css:238-275`.

## Fuentes

| Familia | Pesos solicitados | Uso |
| --- | --- | --- |
| DM Sans | 400, 450, 500, 550, 600, 650, 700 | Texto base, navegación, formularios, metadatos y botones. |
| Manrope | 400, 500, 600, 650, 700, 750, 800 | Wordmark y encabezados `h1`, `h2`, `h3`. |
| `sans-serif` | Fallback | Sustituto si Google Fonts no está disponible. |

Las fuentes se importan desde Google Fonts en `src/styles.css:1`. El HTML declara `lang="es"` en `index.html:2`.

## Estilos de texto observados

| Estilo | Tamaño | Peso | Altura de línea | Uso |
| --- | --- | --- | --- | --- |
| `h1` | `clamp(32px, 3.7vw, 52px)` | 800 | `1.25` heredado | Titular principal y hero. |
| `h1` de watch/admin | 26-32 px en responsive/contexto | 800 | `1.25` | Título de vídeo y panel. |
| `h2` | 27 px; 19-24 px en contextos | 500-800 según regla | `1.25` | Secciones y bloques de detalle. |
| `h3` | 19 px | Heredado de componente | `1.25` | Tarjetas y subencabezados. |
| Cuerpo | 16 px por defecto del navegador | 400 | `1.7` en `p` | Descripciones y contenido. |
| Hero/body | 13-15 px | 400 | `1.7` | Texto secundario del hero y ayudas. |
| Navegación | 12-14 px | 500-550 | Por defecto | Header y enlaces. |
| `eyebrow` | 10 px | 700 | Por defecto | Etiquetas de sección; tracking de 2 px. |
| Metadato | 10-12 px | 400-500 | Por defecto | Fecha, duración, estado y notas. |
| Botón | 12 px | 600 | `1.4` | Acciones principales y secundarias. |

## Convenciones

- Los encabezados usan Manrope, `letter-spacing: -0.8px` y `line-height: 1.25`.
- El wordmark usa Manrope, peso 800, tamaño 23 px y tracking `-1px`; se reduce a 19 px en móvil.
- El texto de párrafo usa color principal o `--muted` según su jerarquía.
- Las etiquetas `eyebrow` usan mayúsculas en el contenido, tamaño pequeño y tracking amplio.
- El contenido de descripciones conserva saltos de línea con `white-space: pre-wrap`.

## Notas de estandarización

- La escala tipográfica está implícita en selectores y clases, no en tokens nombrados.
- Los pesos fraccionarios (450, 550, 650, 750) dependen de la fuente cargada y deberían documentarse como parte del contrato si se reutilizan en nuevos componentes.
- No existe un control visual para aumento de tamaño de texto; las unidades son principalmente `px`, con `clamp` solo en el `h1` global.
