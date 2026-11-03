# Deuda técnica de UI

Ordenada de mayor a menor severidad. Esta lista documenta oportunidades y no modifica la implementación.

## 🔴 Crítica

| # | Hallazgo | Ubicación (archivo:línea) | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| — | No se ha verificado un bloqueador crítico de accesibilidad visual en las fuentes inspeccionadas. | — | — | — | Mantener foco visible, roles de estado y soporte de reducción de movimiento en cambios futuros. |

## 🟠 Alta

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 1 | La paleta semántica mezcla cuatro custom properties con numerosos colores literales por componente. | `src/styles.css:3-11`, `src/styles.css:179-226`, `src/styles.css:644-664` | Dificulta mantener consistencia, medir contraste y añadir un tema alternativo. | Medio | Extraer tokens semánticos para superficies, texto, borde, foco y feedback antes de ampliar la UI. |
| 2 | Los componentes visuales no tienen una capa reutilizable independiente; las vistas y el stylesheet global concentran la composición. | `src/main.tsx:21-520`, `src/pages/Admin.tsx:18-672` | Cambios transversales pueden duplicar reglas o producir divergencias entre público y administración. | Medio/alto | Crear componentes compartidos solo cuando exista una segunda implementación real o crezca el número de pantallas. |

## 🟡 Media

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 3 | No existe una escala de espaciado; padding, gap y margin usan muchos valores literales próximos. | `src/styles.css:155-177`, `src/styles.css:229-275`, `src/styles.css:289-420` | Ajustar ritmo visual requiere revisar reglas aisladas y puede introducir inconsistencias. | Medio | Definir una escala documentada y migrar por componentes, no globalmente de una vez. |
| 4 | Los radios y sombras no tienen niveles semánticos; el único token global es `--radius`. | `src/styles.css:69-107`, `src/styles.css:179-226`, `src/styles.css:289-307` | Nuevas superficies pueden elegir valores arbitrarios y romper la jerarquía visual. | Bajo/medio | Nombrar tokens de forma, borde y elevación después de consolidar el inventario actual. |
| 5 | Los estilos de administración y de reproducción están en el mismo CSS global, aunque sus componentes tienen necesidades distintas. | `src/styles.css:440-725` | Aumenta el acoplamiento visual y el riesgo de cambios accidentales entre áreas. | Medio | Mantener una convención de prefijos o separar hojas solo si el producto incorpora más áreas. |

## 🟢 Baja

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 6 | Las acciones usan glifos Unicode en lugar de un set de iconos normalizado. | `src/main.tsx:113-125`, `src/main.tsx:189-192`, `src/pages/Admin.tsx:181-193` | La forma puede variar entre sistemas operativos y lectores visuales. | Bajo | Evaluar un set de iconos accesible si aumenta el número de acciones o plataformas. |
| 7 | Solo existe tema claro y no hay contrato visual para estados pressed/focus más allá del foco global. | `src/styles.css:3-49`, `src/styles.css:933-938` | La extensión futura a preferencias de tema o interacción táctil requerirá decisiones nuevas. | Bajo | Documentar estados adicionales cuando una necesidad de producto los justifique. |
| 8 | La tipografía y los pesos fraccionarios dependen de Google Fonts sin tokens de estilo nombrados. | `src/styles.css:1-4`, `src/styles.css:60-137` | Un cambio de fuente o fallo de red puede alterar métricas y saltos de línea. | Bajo | Definir estilos tipográficos semánticos y validar fallback antes de cambiar la fuente. |
