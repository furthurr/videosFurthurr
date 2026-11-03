# Deuda técnica de datos/APIs

Ordenada de mayor a menor severidad. Esta lista documenta riesgos y no ejecuta remediaciones de código.

## 🔴 Crítica

| # | Hallazgo | Ubicación (archivo:línea) | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| — | No se han verificado hallazgos críticos en las fuentes inspeccionadas. | — | — | — | Mantener los secretos fuera del cliente y conservar RLS como barrera de autorización. |

## 🟠 Alta

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 1 | La operación de `manageVideo` recibe `operation: string` y devuelve un tipo parcial, sin un contrato discriminado para cada operación. | `src/lib.ts:105-117` | Permite que cliente y Edge Function diverjan silenciosamente en operaciones, campos y estados. | Medio | Definir un tipo unión por operación y respuestas discriminadas, y validarlo contra el catálogo. |
| 2 | `save_video` recibe `jsonb` y convierte campos sin un esquema formal compartido con el cliente. | `supabase/migrations/202610290001_initial.sql:78-93` | Un cambio de payload puede producir errores tardíos o datos incompletos antes de alcanzar las restricciones SQL. | Medio | Publicar un esquema de request versionado o generar tipos a partir del contrato aceptado. |

## 🟡 Media

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 3 | No existe un contrato OpenAPI ni un catálogo generado automáticamente para PostgREST, Storage y la Edge Function. | `src/lib.ts:35-117`, `supabase/functions/manage-video/index.ts:94-266` | La documentación y los consumidores dependen de lectura manual del código. | Medio | Mantener un contrato declarativo mínimo o comprobar el catálogo en CI cuando cambien migraciones o Functions. |
| 4 | La paginación usa `offset` y límites fijos en tres consumidores independientes. | `src/main.tsx:314-327`, `src/pages/Admin.tsx:68-82`, `scripts/generate-pages.mjs:25-34` | Inserciones durante una lectura pueden desplazar páginas o producir resultados inconsistentes. | Medio | Evaluar cursor estable por `id`/timestamp si el volumen o la frecuencia de publicación crece. |
| 5 | El nombre de la Edge Function no incluye versión y los contratos dependen de migraciones y código desplegado conjuntamente. | `supabase/config.toml:3-4`, `supabase/migrations/202610290001_initial.sql:78-95` | Las evoluciones incompatibles requieren coordinación manual entre frontend y backend. | Medio | Adoptar compatibilidad hacia atrás o versionar la Function cuando aparezcan consumidores externos. |

## 🟢 Baja

| # | Hallazgo | Ubicación | Impacto | Esfuerzo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| 6 | Los tipos del frontend reutilizan directamente nombres de columnas y no hay mapeo DTO-dominio formal. | `src/lib.ts:19-31` | Cambios de esquema se propagan directamente a la UI. | Bajo | Introducir mappers solo cuando aparezcan más consumidores o transformaciones. |
| 7 | El estado de despliegue devuelve `pending` cuando GitHub no entrega una ejecución concluyente, sin un identificador de workflow para correlación. | `supabase/functions/manage-video/index.ts:56-91` | El operador tiene poca trazabilidad para diagnosticar una generación social. | Bajo | Devolver un identificador o URL de ejecución cuando la integración lo permita. |
