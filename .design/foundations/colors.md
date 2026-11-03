# Colores

Fuente de verdad: `src/styles.css:3-11` y reglas de componentes en `src/styles.css:44-725`.

## Paleta base

| Nombre/token | Hex | Uso observado | Estado |
| --- | --- | --- | --- |
| `--blue` | `#315de7` | Acción primaria, enlaces, estado activo, marca y elementos de interacción. | Token global |
| `--muted` | `#6b7080` | Texto secundario, metadatos y ayudas. | Token global |
| `--border` | `#e6e8ef` | Bordes y separadores de superficies. | Token global |
| `--radius` | `18px` | Radio base de tarjetas. | Token global |
| Texto principal | `#232733` | Texto de cuerpo, títulos y controles. | Hardcodeado |
| Fondo de página | `#fbfbfd` | Fondo global. | Hardcodeado |
| Superficie | `#ffffff` | Header, footer, tarjetas, formularios y paneles. | Hardcodeado |
| Fondo de hero | `#eef1fc` | Área visual del hero. | Hardcodeado |
| Texto de títulos secundarios | `#838998` | Parte atenuada del titular del hero. | Hardcodeado |
| Fondo de filtros | `#edf1ff` | Filtro activo y estados seleccionados. | Hardcodeado |
| Sombra azul | `#315de73b` | Sombra del botón visual del hero. | Hardcodeado con alpha |
| Fondo del reproductor | `#111624` | Área detrás del vídeo. | Hardcodeado |

## Colores semánticos

| Token conceptual | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| Primario | `#315de7` | No definido | Botones primarios, enlaces y selección. |
| Texto principal | `#232733` | No definido | Lectura principal. |
| Texto secundario | `#6b7080` | No definido | Ayudas, fechas, metadatos y estados. |
| Borde | `#e6e8ef` | No definido | Separadores y contornos. |
| Información | Fondo `#eef2ff`, borde `#d5defa` | No definido | Avisos informativos y estado de publicación. |
| Éxito | Fondo `#edf8f1`, texto `#24653f`, borde `#cbe6d4` | No definido | Confirmaciones. |
| Error | Fondo `#fff1f1`, texto `#9a2633`, borde `#f1ccd0` | No definido | Errores de acceso, carga o reproducción. |
| Foco | `#6b88f2` | No definido | Indicador `:focus-visible`. |

## Opacidades y estados

- El overlay de duración usa `#181b2bd9`.
- El overlay de compartir/controles usa valores blancos con alpha (`#ffffffde`).
- Las transiciones usan sombras y desplazamiento leve en tarjetas; se desactivan con `prefers-reduced-motion`.

## Notas de estandarización

- Solo cuatro custom properties existen en `:root`; los colores semánticos de información, éxito, error y foco siguen hardcodeados.
- Hay varios valores azules cercanos para fondos y bordes (`#edf1ff`, `#eef1fc`, `#f0f3fb`, `#f6f8fd`) que deberían tener nombres semánticos si se desea soportar temas o ampliar la UI.
- Antes de crear un tema oscuro conviene extraer tokens semánticos separados de los colores literales de cada componente.
- La documentación registra los valores existentes; no prescribe cambios de contraste sin una medición visual específica de cada combinación.
