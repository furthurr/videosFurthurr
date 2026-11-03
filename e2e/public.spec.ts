import { test, expect } from "@playwright/test";

const video = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "Mi primera demo",
  description: "Código y proyectos para compartir.",
  tags: ["Flutter"],
  video_path: "owner/id/demo.webm",
  poster_path: "owner/id/poster.jpg",
  duration: 111,
  status: "published",
  published_at: "2026-10-29T10:00:00Z",
  updated_at: "2026-10-29T10:00:00Z",
  created_at: "2026-10-29T10:00:00Z",
  video_links: [
    { id: "link", label: "Código fuente", url: "https://github.com/furthurr" },
  ],
};
test.beforeEach(async ({ page }) => {
  await page.route("https://demo.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/rest/v1/videos"))
      return route.fulfill({
        json: url.searchParams.has("id") ? video : [video],
      });
    if (url.pathname.includes("poster.jpg"))
      return route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#315de7"/></svg>',
      });
    return route.fulfill({ status: 404, body: "" });
  });
});
test("biblioteca, filtros, enlace directo y recursos", async ({ page }) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /Explora los videos/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: video.title })).toBeVisible();
  await page.screenshot({
    path: "test-results/library-desktop.png",
    fullPage: true,
  });
  await page.getByRole("searchbox").fill("inexistente");
  await expect(page.getByText("Sin coincidencias")).toBeVisible();
  await page.getByRole("searchbox").fill("demo");
  await page.getByRole("button", { name: "Flutter", exact: true }).click();
  await page.getByRole("heading", { name: video.title }).click();
  await expect(page).toHaveURL(/watch\/\?v=/);
  await expect(page.getByRole("heading", { name: video.title })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Código fuente/ }),
  ).toHaveAttribute("href", "https://github.com/furthurr");
  await page.reload();
  await expect(page.getByRole("heading", { name: video.title })).toBeVisible();
  await page.screenshot({
    path: "test-results/watch-desktop.png",
    fullPage: true,
  });
});
test("móvil sin desbordamiento y acceso administrativo requiere login", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: video.title })).toBeVisible();
  await page.screenshot({
    path: "test-results/library-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Administración", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Continuar con GitHub/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const ready of [false, true]) {
  test(`copiar enlace ${ready ? "social cuando está listo" : "dinámico mientras el despliegue está pendiente"}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (value: string) => {
            (window as unknown as { copied: string }).copied = value;
          },
        },
        configurable: true,
      });
    });
    await page.route("**/social-manifest.json*", (route) =>
      route.fulfill({ json: ready ? { [video.id]: video.updated_at } : {} }),
    );
    await page.goto(`./watch/?v=${video.id}`);
    await page.getByRole("button", { name: "⧉ Copiar enlace" }).click();
    await expect(page.getByRole("status")).toContainText("Enlace copiado");
    const copied = await page.evaluate(
      () => (window as unknown as { copied: string }).copied,
    );
    expect(copied).toContain(
      ready ? `/v/${video.id}/` : `/watch/?v=${video.id}`,
    );
  });
}
test("fallo de red visible y recuperación al reintentar", async ({ page }) => {
  let failed = true;
  await page.route("https://demo.supabase.co/rest/v1/videos*", (route) =>
    failed
      ? route.fulfill({ status: 500, json: { message: "fallo" } })
      : route.fulfill({ json: [video] }),
  );
  await page.goto("./");
  await expect(page.getByRole("alert")).toContainText("No pudimos cargar");
  failed = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("heading", { name: video.title })).toBeVisible();
});

test("el reproductor identifica videos MP4 sin cambiar los WebM existentes", async ({
  page,
}) => {
  await page.route("https://demo.supabase.co/rest/v1/videos*", (route) =>
    route.fulfill({ json: { ...video, video_path: "owner/id/demo.mp4" } }),
  );
  await page.goto(`./watch/?v=${video.id}`);
  await expect(page.locator("video source")).toHaveAttribute(
    "type",
    "video/mp4",
  );
  await expect(page.locator(".player-caption")).toContainText("MP4 · 1:51");
});

test("reproduce un WebM real generado en el navegador", async ({ page }) => {
  await page.goto("./");
  const encoded = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d")!;
    const stream = canvas.captureStream(15);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const chunks: Blob[] = [];
    const complete = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    const interval = setInterval(() => {
      context.fillStyle = "#315de7";
      context.fillRect(0, 0, 320, 180);
      context.fillStyle = "#ffffff";
      context.fillText(`Furthurr ${Date.now()}`, 20, 90);
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 600));
    clearInterval(interval);
    recorder.stop();
    const blob = await complete;
    stream.getTracks().forEach((track) => track.stop());
    return btoa(
      String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())),
    );
  });
  await page.route(
    "https://demo.supabase.co/storage/v1/object/public/published/owner/id/demo.webm",
    (route) =>
      route.fulfill({
        contentType: "video/webm",
        body: Buffer.from(encoded, "base64"),
      }),
  );
  await page.goto(`./watch/?v=${video.id}`);
  const player = page.locator("video");
  await expect
    .poll(() =>
      player.evaluate((element) => (element as HTMLVideoElement).readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await player.evaluate(async (element) => {
    const video = element as HTMLVideoElement;
    video.muted = true;
    await video.play();
  });
  await expect
    .poll(() =>
      player.evaluate((element) => (element as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Velocidad de reproducción").selectOption("1.5");
  expect(
    await player.evaluate(
      (element) => (element as HTMLVideoElement).playbackRate,
    ),
  ).toBe(1.5);
  await page.screenshot({
    path: "test-results/watch-desktop.png",
    fullPage: true,
  });
});
