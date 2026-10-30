import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { applySiteMetadata, renderVideoPage } from "./social.mjs";

export async function generatePages({
  directory = new URL("../dist/", import.meta.url),
  supabase = process.env.VITE_SUPABASE_URL?.replace(/\/$/, ""),
  publicKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  site = process.env.SITE_URL || "https://furthurr.github.io/videosFurthurr/",
  basePath = process.env.BASE_PATH || "/videosFurthurr/",
  required = process.env.REQUIRE_SUPABASE === "true",
} = {}) {
  if (!site.endsWith("/")) throw new Error("SITE_URL debe terminar en /.");
  const template = await readFile(new URL("index.html", directory), "utf8");
  const sitePage = applySiteMetadata(template, site, basePath);
  await writeFile(new URL("index.html", directory), sitePage);
  for (const route of ["watch", "admin"]) {
    await mkdir(new URL(`${route}/`, directory), { recursive: true });
    await writeFile(new URL(`${route}/index.html`, directory), sitePage);
  }
  // Vite limpia dist en cada build: no quedan páginas de videos retirados.
  await writeFile(new URL("404.html", directory), sitePage);
  const manifest = {};
  if (supabase && publicKey) {
    for (let offset = 0; ; offset += 100) {
      const endpoint = new URL(`${supabase}/rest/v1/videos`);
      endpoint.search = new URLSearchParams({
        select: "id,title,description,poster_path,updated_at",
        status: "eq.published",
        order: "id",
        offset: String(offset),
        limit: "100",
      }).toString();
      const response = await fetch(endpoint, {
        headers: { apikey: publicKey },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok)
        throw new Error(
          `No se pudieron consultar las publicaciones (${response.status}). Se cancela el despliegue para no borrar páginas válidas.`,
        );
      const videos = await response.json();
      if (!Array.isArray(videos))
        throw new Error("Respuesta de publicaciones inválida.");
      for (const video of videos) {
        if (!/^[a-f\d-]{36}$/i.test(video.id))
          throw new Error("Identificador inválido.");
        await mkdir(new URL(`v/${video.id}/`, directory), { recursive: true });
        await writeFile(
          new URL(`v/${video.id}/index.html`, directory),
          renderVideoPage(template, video, site, supabase),
        );
        manifest[video.id] = video.updated_at;
      }
      if (videos.length < 100) break;
    }
  } else if (required)
    throw new Error(
      "Configura las variables públicas de Supabase antes de desplegar.",
    );
  else
    console.info(
      "Build local sin Supabase: se mostrará la pantalla de configuración.",
    );
  await writeFile(
    new URL("social-manifest.json", directory),
    JSON.stringify(manifest),
  );
  await writeFile(new URL(".nojekyll", directory), "");
  console.info(`Páginas sociales generadas: ${Object.keys(manifest).length}.`);
  return manifest;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  await generatePages();
