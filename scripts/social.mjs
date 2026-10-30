export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}

// Quita metadatos sociales del nivel de sitio para que cada página defina los suyos.
export function stripSiteMetadata(html) {
  return html
    .replace(
      /<meta\s+property="og:(type|title|description|url|image|image:width|image:height|image:alt)"[^>]*>/gi,
      "",
    )
    .replace(/<meta\s+name="twitter:(title|description|image)"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "");
}

// Convierte las rutas relativas de las imágenes sociales en URLs absolutas.
export function applySiteMetadata(template, site, basePath) {
  const icon = new URL(`${basePath}icons/og-image.png`, site).href;
  const canonical = new URL(site).href;
  return template
    .replace(
      /<meta\s+property="og:image"[^>]*>/i,
      `<meta property="og:image" content="${escapeHtml(icon)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"[^>]*>/i,
      `<meta name="twitter:image" content="${escapeHtml(icon)}" />`,
    )
    .replace(/<meta\s+property="og:url"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(
      "</head>",
      `<link rel="canonical" href="${escapeHtml(canonical)}" />\n    <meta property="og:url" content="${escapeHtml(canonical)}" />\n</head>`,
    );
}

export function renderVideoPage(template, video, site, storageUrl) {
  const title = escapeHtml(`${video.title} · Furthurr Videos`);
  const description = escapeHtml(
    video.description.slice(0, 200) || "Un video de Furthurr.",
  );
  const url = escapeHtml(new URL(`v/${video.id}/`, site).href);
  const image = escapeHtml(
    `${storageUrl}/storage/v1/object/public/published/${video.poster_path.split("/").map(encodeURIComponent).join("/")}`,
  );
  const metadata = `<title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Furthurr Videos" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${escapeHtml(video.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;
  return stripSiteMetadata(template)
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace("</head>", `${metadata}\n</head>`);
}
