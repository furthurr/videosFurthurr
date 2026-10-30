import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { generatePages } from "../scripts/generate-pages.mjs";

let temporary: string;
let directory: URL;
const config = {
  supabase: "https://demo.supabase.co",
  publicKey: "public-test-key",
  site: "https://example.com/videos/",
  required: true,
};
beforeEach(async () => {
  temporary = await mkdtemp(join(tmpdir(), "furthurr-pages-"));
  directory = pathToFileURL(`${temporary}/`);
  await writeFile(
    new URL("index.html", directory),
    '<html><head><title>Videos</title></head><body><div id="root"></div></body></html>',
  );
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(temporary, { recursive: true, force: true });
});

describe("generación automática de páginas", () => {
  it("pagina publicaciones y escribe páginas y manifest con su revisión", async () => {
    const videos = Array.from({ length: 101 }, (_, i) => ({
      id: `${i.toString(16).padStart(8, "0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      title: `Video ${i}`,
      description: "Público",
      poster_path: "owner/id/poster.jpg",
      updated_at: "2026-10-29T00:00:00Z",
    }));
    const fetchMock = vi.fn(async (endpoint: URL) => {
      const offset = Number(endpoint.searchParams.get("offset"));
      expect(endpoint.searchParams.get("status")).toBe("eq.published");
      return Response.json(videos.slice(offset, offset + 100));
    });
    vi.stubGlobal("fetch", fetchMock);
    const manifest = await generatePages({ ...config, directory });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Object.keys(manifest)).toHaveLength(101);
    expect(
      await readFile(
        new URL(`v/${videos[100].id}/index.html`, directory),
        "utf8",
      ),
    ).toContain("Video 100");
    expect(
      JSON.parse(
        await readFile(new URL("social-manifest.json", directory), "utf8"),
      ),
    ).toEqual(manifest);
    expect(
      await readFile(new URL("watch/index.html", directory), "utf8"),
    ).toContain('id="root"');
    expect(
      await readFile(new URL("admin/index.html", directory), "utf8"),
    ).toContain('id="root"');
  });
  it("interrumpe el despliegue si Supabase falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    await expect(generatePages({ ...config, directory })).rejects.toThrow(
      /Se cancela el despliegue/,
    );
    await expect(
      readFile(new URL("social-manifest.json", directory)),
    ).rejects.toThrow();
  });
  it("rechaza configuración de producción incompleta", async () => {
    await expect(
      generatePages({ ...config, directory, publicKey: "" }),
    ).rejects.toThrow(/Configura/);
  });
});
