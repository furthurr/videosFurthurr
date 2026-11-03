# Componentes

Catálogo visual derivado de las clases de `src/styles.css` y de las composiciones React. No existe una librería de componentes independiente; las clases CSS y la composición JSX son la fuente de verdad actual.

## Shell global: header y footer

- **Propósito:** envolver la biblioteca, reproducción y administración con la marca y navegación.
- **Variantes:** header público con enlaces; footer con wordmark, autor y navegación.
- **Estados:** enlace activo, hover y responsive móvil.
- **Tokens que consume:** `--border`, `--blue`, `--muted`, Manrope, alturas 90/75 px, padding lateral 5/6%.
- **Accesibilidad:** enlaces con texto; imágenes decorativas con `alt=""`; foco global visible.
- **Fuente de verdad:** `src/main.tsx:507-558` y `src/styles.css:51-108`, `src/styles.css:590-629`, `src/styles.css:808-852`.

## Wordmark y avatar

- **Propósito:** identificar Furthurr y el autor.
- **Variantes:** `.wordmark`, `.footer-mark`, `.avatar`, `.avatar.small`.
- **Estados:** enlace normal y hover; avatar circular.
- **Tokens que consume:** Manrope 800, `#315de7`, `--border`, radios 12 px y 50%, tamaños 39/22 px para marca y 42/34 px para avatar.
- **Fuente de verdad:** `src/main.tsx:21-61`, `src/styles.css:60-109`.

## Eyebrow y dot

- **Propósito:** rotular secciones con una etiqueta editorial de baja jerarquía.
- **Variantes:** texto solo o texto acompañado por `.dot`.
- **Estados:** normal.
- **Tokens que consume:** 10 px, peso 700, tracking 2 px, `--muted`, `--blue`, punto circular de 6 px.
- **Fuente de verdad:** `src/main.tsx:65-72`, `src/main.tsx:353-356` y `src/styles.css:141-153`.

## Hero y hero art

- **Propósito:** presentar el espacio de vídeos y su identidad visual.
- **Variantes:** dos columnas en desktop, una columna desde 600 px.
- **Estados:** decorativo; no recibe interacción.
- **Tokens que consume:** grid 1.4fr/1fr, fondo `#eef1fc`, borde claro, radio 24 px, play azul, órbitas y marca.
- **Accesibilidad:** `aria-hidden="true"` para la ilustración.
- **Fuente de verdad:** `src/main.tsx:350-388` y `src/styles.css:155-226`.

## Search y filtros

- **Propósito:** localizar vídeos y filtrar por etiqueta.
- **Variantes:** campo de búsqueda, botón de filtro activo/inactivo.
- **Estados:** activo mediante clase `.active`, `aria-pressed` en filtros, hover en controles.
- **Tokens que consume:** borde, superficie blanca, radio 10/8 px, azul de selección, texto muted, padding 10/14 y 8/15 px.
- **Responsive:** la búsqueda ocupa todo el ancho móvil.
- **Fuente de verdad:** `src/main.tsx:389-438` y `src/styles.css:238-283`.

## Video card y video grid

- **Propósito:** mostrar cada publicación con miniatura, duración, tags, resumen y fecha.
- **Variantes:** grid de tres, dos o una columna; tarjeta con o sin etiquetas/enlace.
- **Estados:** normal, hover, enlace visitado implícito, contenido vacío.
- **Tokens que consume:** `--radius`, `--border`, superficie blanca, sombras hover, tags azules, proporción 16/9, padding 19 px.
- **Accesibilidad:** imagen de miniatura decorativa; tarjeta completa enlazada; duración como texto visible.
- **Fuente de verdad:** `src/main.tsx:450-488` y `src/styles.css:283-389`.

## Button

- **Propósito:** acciones primarias y secundarias.
- **Variantes:** `.button` base, `.primary`, `.danger`.
- **Estados:** hover, disabled/busy; el estado disabled reduce opacidad y muestra cursor de espera.
- **Tokens que consume:** borde, fondo blanco o `--blue`, radio 9 px, texto 12 px/600, padding 11/16 px.
- **Fuente de verdad:** `src/styles.css:390-438` y usos en `src/main.tsx:114-125`, `src/pages/Admin.tsx:181-193`.

## Notice y estados de feedback

- **Propósito:** comunicar error, éxito, información y estado de operación.
- **Variantes:** `.notice`, `.notice.error`, `.notice.success`, además de `.status` y `.upload-note`.
- **Estados:** alert, status, progreso y mensaje de operación.
- **Tokens que consume:** fondos y bordes semánticos, radio 10 px, padding 15 px, tipografía 13 px.
- **Accesibilidad:** el código usa `role="alert"`, `role="status"` y `progress` con `aria-label`.
- **Fuente de verdad:** `src/styles.css:644-664`, `src/styles.css:739-763`, `src/main.tsx:173-187`, `src/pages/Admin.tsx:149-203`, `src/pages/Admin.tsx:631-634`.

## Watch layout y player

- **Propósito:** reproducir un vídeo y mostrar descripción, tags, recursos y autor.
- **Variantes:** grid de reproductor + detalles en desktop; una columna hasta 1000 px.
- **Estados:** cargando, vídeo no disponible, error de reproducción, reproducción normal, compartir ocupado.
- **Tokens que consume:** player oscuro `#111624`, proporción 16/9, radio 16/10 px, detalles blancos con borde, título Manrope, share y avisos.
- **Accesibilidad:** enlaces de vuelta, labels para velocidad, mensajes de error y estado de compartir.
- **Fuente de verdad:** `src/main.tsx:140-301` y `src/styles.css:440-589`.

## Login y acceso restringido

- **Propósito:** separar el flujo OAuth del contenido administrativo y comunicar la falta de autorización.
- **Variantes:** login inicial, comprobación de acceso, acceso restringido.
- **Estados:** comprobando, sesión ausente, usuario no autorizado, error.
- **Tokens que consume:** `.login`, `.empty`, `.notice.error`, botón primario/secundario, max-width 580 px, fondo blanco, radio 20 px.
- **Accesibilidad:** errores con `role="alert"`; estado de comprobación con `role="status"`.
- **Fuente de verdad:** `src/pages/Admin.tsx:134-172` y `src/styles.css:630-731`.

## Admin shell, list y editor

- **Propósito:** gestionar borradores y publicaciones desde un layout de dos columnas.
- **Variantes:** lista vacía, elemento seleccionado, editor de nuevo vídeo, editor de publicación.
- **Estados:** seleccionado, busy/disabled, dirty, uploading, error, success, preview social pendiente/lista/fallida.
- **Tokens que consume:** `.admin`, `.admin-head`, `.admin-grid`, `.admin-list`, `.admin-item`, `.editor`, `.field`, `.actions`, notices y progress.
- **Responsive:** dos columnas en desktop y una columna desde 1000 px; lista con altura máxima reducida en tablet.
- **Accesibilidad:** controles de formulario etiquetados, fieldset disabled durante operaciones, mensajes de progreso y estados anunciados.
- **Fuente de verdad:** `src/pages/Admin.tsx:173-256`, `src/pages/Admin.tsx:520-672` y `src/styles.css:630-763`, `src/styles.css:908-922`.

## Form controls

- **Propósito:** capturar títulos, descripciones, tags, archivos y recursos.
- **Variantes:** input, textarea, select de velocidad, file input, búsqueda.
- **Estados:** focus-visible global, disabled por `fieldset`, error comunicado por notice, progreso.
- **Tokens que consume:** fuente heredada, borde `#dce0eb`, radio 8 px, padding 11 px, tipografía 13 px.
- **Fuente de verdad:** `src/styles.css:29-35`, `src/styles.css:258-263`, `src/styles.css:703-731` y `src/pages/Admin.tsx:528-601`.

## Empty state y bottom note

- **Propósito:** mostrar configuración pendiente, listas vacías, vídeo no disponible y llamada editorial final.
- **Variantes:** setup, loading, error con retry, sin publicaciones, nota de cierre.
- **Estados:** status, alert, retry.
- **Tokens que consume:** `.empty`, `.bottom-note`, `.spark`, eyebrow, botón y muted.
- **Fuente de verdad:** `src/main.tsx:64-80`, `src/main.tsx:173-187`, `src/main.tsx:489-506` y `src/styles.css:426-439`.

## Reglas transversales de accesibilidad visual

- Todo foco de teclado visible mediante `:focus-visible` con outline de 3 px y offset 4 px.
- Se respeta `prefers-reduced-motion` para transiciones y scroll.
- Los estados de error y operación usan roles ARIA en las vistas principales.
- El contenido visual de marca se marca como decorativo cuando el texto ya comunica el propósito.

Fuentes: `src/styles.css:44-49`, `src/styles.css:933-938`, `src/main.tsx:23-30`, `src/main.tsx:173-187` y `src/pages/Admin.tsx:134-172`.
