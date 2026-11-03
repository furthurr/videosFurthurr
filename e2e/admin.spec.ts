import { test, expect } from "@playwright/test";

const userId = "11111111-1111-4111-8111-111111111111";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
test("administrador edita un borrador y publica con una solicitud protegida", async ({
  page,
}) => {
  let current = {
    id,
    title: "Borrador original",
    description: "Una idea",
    tags: ["demo"],
    video_path: `${userId}/${id}/demo.webm`,
    poster_path: `${userId}/${id}/poster.jpg`,
    duration: 20,
    status: "draft",
    published_at: null as string | null,
    created_at: "2026-10-29T10:00:00Z",
    updated_at: "2026-10-29T10:00:00Z",
    video_links: [],
  };
  let published = false;
  let uploadedMp4 = false;
  let uploadedPoster = false;
  let replacedPoster = false;
  await page.addInitScript(
    ({ userId }) => {
      // Sesión ficticia local. No representa credenciales ni valida OAuth real.
      localStorage.setItem(
        "sb-demo-auth-token",
        JSON.stringify({
          access_token: "fake-local-access",
          refresh_token: "fake-local-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user: {
            id: userId,
            aud: "authenticated",
            role: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: "2026-10-29T10:00:00Z",
          },
        }),
      );
    },
    { userId },
  );
  await page.route("https://demo.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/rest/v1/rpc/is_admin")
      return route.fulfill({ json: true });
    if (url.pathname === "/rest/v1/videos")
      return route.fulfill({
        json: url.searchParams.has("id") ? current : [current],
      });
    if (url.pathname === "/rest/v1/rpc/save_video") {
      const payload = route.request().postDataJSON();
      current = { ...current, ...payload.p_data };
      return route.fulfill({ status: 204 });
    }
    if (
      url.pathname.startsWith("/storage/v1/object/drafts/") &&
      route.request().method() === "POST"
    ) {
      if (url.pathname.endsWith(".mp4")) {
        expect(route.request().postData()).toContain("Content-Type: video/mp4");
        uploadedMp4 = true;
      } else {
        expect(url.pathname).toMatch(/\.png$/);
        expect(route.request().postData()).toContain("Content-Type: image/png");
        uploadedPoster = true;
      }
      return route.fulfill({ json: { Key: url.pathname } });
    }
    if (
      url.pathname === "/storage/v1/object/drafts" &&
      route.request().method() === "DELETE"
    )
      return route.fulfill({ json: [] });
    if (url.pathname === "/functions/v1/manage-video") {
      const payload = route.request().postDataJSON();
      if (payload.operation === "status")
        return route.fulfill({ json: { state: "failed" } });
      if (payload.operation === "replace-poster") {
        expect(payload.id).toBe(id);
        expect(payload.poster_path).toMatch(
          new RegExp(`^${userId}/${id}/.+\\.png$`),
        );
        replacedPoster = true;
        current = { ...current, poster_path: payload.poster_path };
        return route.fulfill({
          json: { ok: true, deployment: "Generación social solicitada." },
        });
      }
      expect(route.request().headers().authorization).toBe(
        "Bearer fake-local-access",
      );
      expect(payload).toEqual({
        operation: "publish",
        id,
      });
      published = true;
      current = {
        ...current,
        status: "published",
        published_at: "2026-10-29T12:00:00Z",
      };
      return route.fulfill({
        json: { ok: true, deployment: "Generación social solicitada." },
      });
    }
    if (url.pathname.includes("/object/sign/"))
      return route.fulfill({
        json: { signedURL: "/object/sign/drafts/test?token=fake" },
      });
    return route.fulfill({ status: 404 });
  });
  await page.goto("./admin/");
  await expect(
    page.getByRole("heading", { name: "Administrar videos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Borrador original/ }).click();
  await page.getByLabel("Título", { exact: true }).fill("Nueva demo");
  await page.getByLabel("Video WebM o MP4").setInputFiles({
    name: "demo.MP4",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("archivo simulado"),
  });
  await expect(
    page.getByRole("button", { name: "Publicar video" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await page.getByRole("button", { name: "Publicar video" }).click();
  await expect(page.getByRole("status")).toContainText("Video publicado");
  expect(current.title).toBe("Nueva demo");
  expect(uploadedMp4).toBe(true);
  expect(current.video_path).toMatch(/\.mp4$/);
  expect(published).toBe(true);
  await page.getByRole("button", { name: /Nueva demo/ }).click();
  await expect(page.getByText(/el último despliegue falló/)).toBeVisible();
  await expect(page.getByLabel("Portada")).toBeEnabled();
  await page.getByLabel("Portada").setInputFiles({
    name: "nueva-portada.png",
    mimeType: "image/png",
    buffer: Buffer.from("imagen simulada"),
  });
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Cambios guardados" }),
  ).toBeVisible();
  expect(replacedPoster).toBe(true);
  expect(current.poster_path).toMatch(/\.png$/);
});
