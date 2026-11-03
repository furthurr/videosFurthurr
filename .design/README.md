# Sistema de diseño — Furthurr Videos

Documentación canónica de todo lo visual. Léela antes de trabajar cualquier aspecto de UI.

## Estado de sincronización

- Tecnología detectada: React + CSS global.
- Último commit documentado: `f8a57bcfd635d717e5f4631a7b194b8381dd4b27`.
- Última actualización: 2026-11-02.
- Estado: la marca apunta a `HEAD`, pero existen cambios relevantes sin commit en `README.md`, `e2e/admin.spec.ts`, `src/lib.ts`, `src/pages/Admin.tsx` y `supabase/functions/manage-video/index.ts`. La documentación visual refleja las fuentes visuales del árbol de trabajo; no se puede demostrar sincronización completa con Git hasta establecer un nuevo baseline.

## Contexto para IA

- **Stack visual:** React 19 renderizado sobre Vite y un único stylesheet global en `src/styles.css`.
- **Dónde viven los tokens:** variables CSS globales en `src/styles.css:3-11`; los demás colores, tamaños y radios siguen declarados dentro de reglas de componentes.
- **Temas:** solo tema claro. No existe selector ni conjunto de tokens oscuro.
- **Tipografía:** DM Sans para cuerpo y controles; Manrope para wordmark y encabezados; ambas se cargan desde Google Fonts con alternativas sans-serif.
- **Convenciones clave:** azul de marca para acciones y enlaces, superficies blancas sobre fondo casi blanco, bordes claros, radios redondeados, layouts responsive a 1000 px y 600 px, foco visible y reducción de movimiento.
- **Estado de estandarización:** la paleta mínima está tokenizada, pero espaciado, radios secundarios, sombras y estados semánticos todavía mezclan variables con valores directos.

## Índice

- Fundamentos:
  - [Colores](foundations/colors.md)
  - [Tipografía](foundations/typography.md)
  - [Espaciado](foundations/spacing.md)
  - [Formas y elevación](foundations/shape-elevation.md)
  - [Iconografía](foundations/iconography.md)
- [Componentes](components.md)
- [Deuda técnica de UI](ui-tech-debt.md)

## Mapa de fuentes visuales

| Fuente | Responsabilidad |
| --- | --- |
| `src/styles.css` | Tokens, reglas globales, layouts, estados, responsive y accesibilidad visual. |
| `src/main.tsx` | Shell público, biblioteca, reproducción, compartir, estados vacíos y footer. |
| `src/pages/Admin.tsx` | Login, estados de acceso, lista, editor, carga y acciones administrativas. |
| `index.html` | Idioma, theme color, iconos, manifest y metadatos sociales base. |
| `public/icons/` | Favicons, iconos PWA, imagen social y marca derivada. |
| `iconBase.png` | Original visual desde el que se generan los iconos. |

## Cómo se mantiene

La skill `ui-design` revisa el historial de Git desde el último commit documentado y actualiza esta carpeta cuando detecta cambios visuales. Los valores propuestos como futuros tokens se marcan como deuda; esta documentación no modifica el CSS ni los assets.
