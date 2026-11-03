<!-- ai-agents-kit:documentation:start -->
## Documentación del proyecto

Esta guía resume dónde consultar y mantener la documentación canónica de Furthurr Videos.

### Fuentes y responsables

- `.architecture/` contiene la arquitectura, diagramas C4, decisiones ADR y deuda arquitectónica. Su entrada es `.architecture/README.md`.
- `.data/` contiene los contratos de datos y API, modelos, mapeos, esquema Supabase, entornos y deuda de datos. Su entrada es `.data/README.md`.
- `.design/` contiene tokens visuales, tipografía, espaciado, iconografía, componentes y deuda de UI. Su entrada es `.design/README.md`.
- `.navigator/` contiene índices auxiliares para localizar contexto y módulos. Sus entradas son `.navigator/ai-context.md` y `.navigator/module-map.json`; no sustituyen la comprobación en las fuentes directas.

### Fuentes de verdad

- El código, las migraciones SQL, la configuración de despliegue y los manifiestos son la autoridad sobre el comportamiento real.
- Las carpetas `.architecture/`, `.data/` y `.design/` explican ese comportamiento por dominio y deben mantenerse junto con los cambios relevantes.
- `README.md` conserva instrucciones operativas del proyecto. No dupliques su contenido completo en los índices especializados.

### Regla de mantenimiento

Antes de cambiar producto, consulta `.navigator/` para ubicarlo y el README especializado del dominio afectado. Verifica después las afirmaciones en las fuentes directas. Mantén separados los cambios de documentación de los cambios de producto y no incluyas secretos, tokens, PII ni valores de entorno reales.
<!-- ai-agents-kit:documentation:end -->
