import { describe, expect, it } from "vitest";
import {
  applySiteMetadata,
  escapeHtml,
  renderVideoPage,
} from "../scripts/social.mjs";

const siteTemplate =
  '<html><head><title>Original</title><meta name="description" content="Original" /><meta property="og:type" content="website" /><meta property="og:site_name" content="Furthurr Videos" /><meta property="og:title" content="Furthurr Videos" /><meta property="og:description" content="Sitio" /><meta property="og:image" content="/videosFurthurr/icons/og-image.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="Furthurr Videos" /><meta name="twitter:description" content="Sitio" /><meta name="twitter:image" content="/videosFurthurr/icons/og-image.png" /><script type="module" src="/videosFurthurr/assets/app.js"></script></head><body><div id="root"></div></body></html>';

describe("metadatos sociales estáticos", () => {
  it("escapa contenido de usuario para impedir inyección HTML", () => {
    expect(escapeHtml("<script>\"&'</script>")).toBe(
      "&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;",
    );
  });
  it("genera metadatos por video conservando el módulo de la aplicación", () => {
    const result = renderVideoPage(
      siteTemplate,
      {
        id: "abc",
        title: 'Una "idea" <img>',
        description: "Descripción & más",
        poster_path: "owner/abc/portada.jpg",
      },
      "https://example.com/videosFurthurr/",
      "https://project.supabase.co",
    );
    expect(result).toContain("https://example.com/videosFurthurr/v/abc/");
    expect(result).toContain('property="og:image"');
    expect(result).toContain("summary_large_image");
    expect(result).toContain("Una &quot;idea&quot; &lt;img&gt;");
    expect(result).not.toContain("<img>");
    expect(result).toContain("/videosFurthurr/assets/app.js");
    expect(result.match(/<title>/g)).toHaveLength(1);
    expect(result.match(/name="description"/g)).toHaveLength(1);
  });
  it("no deja metadatos del sitio duplicados en la página de un video", () => {
    const result = renderVideoPage(
      siteTemplate,
      {
        id: "abc",
        title: "Mi video",
        description: "Contenido",
        poster_path: "owner/abc/portada.jpg",
      },
      "https://example.com/videosFurthurr/",
      "https://project.supabase.co",
    );
    expect(result.match(/property="og:title"/g)).toHaveLength(1);
    expect(result.match(/property="og:description"/g)).toHaveLength(1);
    expect(result.match(/name="twitter:title"/g)).toHaveLength(1);
    expect(result.match(/name="twitter:description"/g)).toHaveLength(1);
    expect(result.match(/property="og:image"/g)).toHaveLength(1);
    expect(result).toContain(
      'property="og:title" content="Mi video · Furthurr Videos"',
    );
    expect(result).toContain(
      'property="og:site_name" content="Furthurr Videos"',
    );
  });
  it("convierte la imagen social del sitio en una URL absoluta", () => {
    const result = applySiteMetadata(
      siteTemplate,
      "https://furthurr.github.io/videosFurthurr/",
      "/videosFurthurr/",
    );
    expect(result).toContain(
      'property="og:image" content="https://furthurr.github.io/videosFurthurr/icons/og-image.png"',
    );
    expect(result).toContain(
      'property="og:url" content="https://furthurr.github.io/videosFurthurr/"',
    );
    expect(result.match(/property="og:image"/g)).toHaveLength(1);
    expect(result).toContain('property="og:title" content="Furthurr Videos"');
  });
});
