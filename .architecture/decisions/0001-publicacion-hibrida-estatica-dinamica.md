# ADR 0001: Publicación híbrida dinámica y estática

- Estado: Aceptada
- Fecha: 2026-11-02

## Contexto

Furthurr Videos se despliega como un sitio estático en GitHub Pages, pero necesita que una publicación pueda reproducirse en cuanto termina la operación de Supabase. También necesita HTML con metadatos sociales por vídeo, algo que GitHub Pages no genera dinámicamente.

La aplicación ya separa dos rutas públicas:

- `/watch/?v=<id>` consulta el vídeo publicado en tiempo de ejecución.
- `/v/<id>/` se genera durante el build con los datos visibles de Supabase.

El frontend valida el manifiesto generado antes de usar la URL estática para compartir. Si la revisión de `updated_at` no coincide, usa la URL dinámica.

## Decisión

Mantener una estrategia híbrida:

1. Supabase es la fuente de verdad para publicaciones, metadatos y archivos.
2. La vista dinámica `/watch/` ofrece reproducción inmediata y funciona sin esperar a GitHub Actions.
3. `scripts/generate-pages.mjs` genera las páginas `/v/<id>/`, `404.html` y `social-manifest.json` durante el build.
4. GitHub Actions publica esos artefactos en GitHub Pages después de ejecutar las verificaciones del proyecto.
5. El frontend solo comparte la página estática cuando el manifiesto confirma que la página corresponde a la versión actual del vídeo; en otro caso comparte la URL dinámica.

## Alternativas consideradas

- **Solo vista dinámica:** simplifica el despliegue, pero limita los metadatos Open Graph y la previsualización al compartir enlaces.
- **Solo páginas estáticas:** mejora la indexación social, pero retrasa la disponibilidad de una publicación y puede mostrar una página inexistente o desactualizada mientras no termina el build.
- **Renderizado en servidor:** resolvería la generación dinámica de metadatos, pero añadiría infraestructura de ejecución que no encaja con el destino estático en GitHub Pages.

## Consecuencias

- **Positivas:** reproducción inmediata, mejores previsualizaciones sociales, despliegue compatible con GitHub Pages y mecanismo explícito para evitar enlaces estáticos obsoletos.
- **Negativas / trade-offs:** existen dos rutas públicas que deben mantenerse coherentes; los metadatos sociales dependen de GitHub Actions; el build depende de poder leer las publicaciones desde Supabase.
- **Operativas:** retirar una publicación elimina sus páginas en el siguiente build porque `dist/` se limpia antes de generar rutas. Mientras tanto, la ruta dinámica sigue siendo la referencia de disponibilidad de datos.
