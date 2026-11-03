# Formas y elevación

Fuente de verdad: `src/styles.css:69-107`, `src/styles.css:179-226`, `src/styles.css:248-293`, `src/styles.css:420-438`, `src/styles.css:630-725`.

## Radios

| Categoría | Valor observado | Uso |
| --- | --- | --- |
| Token base | `18px` | `.video-card`. |
| Superficie destacada | `24px` | `.hero-art`. |
| Acción visual | `26px` | `.art-play`. |
| Paneles y detalles | `16px` | `.details`, `.editor`, `.player`. |
| Marca/avatar | `50%` | Avatares y órbitas circulares. |
| Logo | `12px` | Marca de header. |
| Controles | `5-10px` | Duración, filtros, botones, búsqueda e inputs. |
| Elementos pequeños | `7-13px` | Count, tags, spark, art-star y estados. |

## Bordes

- El borde estándar usa `1px solid var(--border)` (`#e6e8ef`).
- Los estados activos y primarios sustituyen el borde por `#dce4ff`, `#a8b6e8` o `var(--blue)` según el componente.
- Los avisos tienen bordes semánticos propios para información, éxito y error.
- El avatar usa borde blanco de 2 px y un anillo exterior de `var(--border)`.

## Elevación y movimiento

- Las tarjetas elevan visualmente al pasar el cursor con `translateY(-4px)` y sombra `0 10px 24px #202d5510`.
- El hero play usa `0 15px 35px #315de73b`.
- El avatar usa una sombra de anillo, no una elevación profunda.
- No hay niveles de elevación ni token `--shadow-*`.
- `prefers-reduced-motion: reduce` elimina transiciones y scroll suave.

## Recorte y proporciones

- Tarjetas y hero recortan contenido con `overflow: hidden`.
- Miniaturas y reproductor mantienen proporción `16/9`.
- El vídeo usa `object-fit: contain` sobre fondo oscuro para respetar el contenido.
- Las imágenes de miniatura usan `object-fit: cover` para llenar la tarjeta.

## Notas de estandarización

- Existe un radio base, pero se combinan muchos valores literales.
- La sombra y la transición están definidas por componente; un sistema futuro podría nombrar niveles `card-hover`, `brand-glow` y `ring`.
- No existe tema oscuro ni contrato de elevación para estados focus/pressed.
