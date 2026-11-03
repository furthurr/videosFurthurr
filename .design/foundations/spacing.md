# Espaciado y dimensiones

Fuente de verdad: `src/styles.css:51-60`, `src/styles.css:155-177`, `src/styles.css:229-275`, `src/styles.css:289-420` y media queries de `src/styles.css:765-938`.

## Valores observados

El proyecto no tiene custom properties de spacing. La siguiente tabla registra los valores repetidos o estructurales que deben conservarse al modificar la UI.

| Categoría | Valores observados | Uso |
| --- | --- | --- |
| Margen lateral de layout | `5%` desktop, `6%` móvil | Header, footer y `main`. |
| Ancho máximo | `1400px` | Contenido principal. |
| Altura de header | `90px` desktop, `75px` móvil | Shell global. |
| Padding de hero | `65px 0 58px`; `38px 0` móvil | Presentación principal. |
| Gaps compactos | `6-12px` | Icono/texto, tags, controles y botones. |
| Gaps de formulario | `17-20px` | Campos, acciones y grupos. |
| Gaps de layout | `22-30px` | Tarjetas, grid, navegación y columnas. |
| Separación amplia | `34-65px` | Hero, secciones y bloques finales. |
| Padding de control | `8-16px` | Filtros y botones. |
| Padding de panel | `20-45px` | Editor, login y detalles. |
| Altura mínima visual | `175-245px` | Hero art en responsive. |

## Layouts responsive

- A partir de 1000 px, el grid de vídeos pasa de tres a dos columnas, el bloque de reproducción se apila y el panel administrativo pasa a una columna.
- A partir de 600 px, el grid pasa a una columna, se ocultan subtítulo y enlaces desktop del header, se compactan hero, login, editor y footer.
- En pantallas anchas de 1500 px, header y footer usan un padding lateral calculado para limitar el contenido a 1260 px.

Fuentes: `src/styles.css:765-807` y `src/styles.css:808-933`.

## Escala candidata, no implementada

Para nuevas reglas se recomienda evaluar una escala basada en `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px. Esta no es una modificación ni una afirmación sobre el CSS actual; es una propuesta para reducir valores mágicos cuando se extraigan tokens.

## Notas de estandarización

- Los valores están distribuidos por componente y no existe `--space-*`.
- `gap`, `padding` y `margin` mezclan incrementos cercanos, por lo que una extracción prematura podría cambiar el ritmo visual.
- Antes de introducir tokens, conviene inventariar cada componente y decidir qué valores son estructurales y cuáles son excepciones responsive.
