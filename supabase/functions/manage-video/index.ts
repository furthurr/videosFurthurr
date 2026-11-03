import { createClient } from "npm:@supabase/supabase-js@2.118.0";

// Las credenciales se configuran en Supabase; nunca se devuelven al cliente.
const allowedOrigins = (
  Deno.env.get("SITE_ORIGINS") ||
  Deno.env.get("SITE_ORIGIN") ||
  "https://furthurr.github.io"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const cors = (request: Request) => {
  const requestOrigin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin":
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0] || "https://furthurr.github.io",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};
const json = (request: Request, value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...cors(request), "Content-Type": "application/json" },
  });

async function requestDeployment() {
  const token = Deno.env.get("GITHUB_DEPLOY_TOKEN");
  const repository = Deno.env.get("GITHUB_REPOSITORY");
  const ref = Deno.env.get("GITHUB_REF") || "main";
  if (!token || !repository)
    return "Pendiente: configura la integración con GitHub y vuelve a solicitar la actualización.";
  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/pages.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref }),
      signal: AbortSignal.timeout(15000),
    },
  );
  return response.ok
    ? "Generación social solicitada. Estará disponible después del despliegue."
    : "Pendiente: GitHub no aceptó el despliegue. Revisa los permisos de la integración y reintenta.";
}

async function deploymentState() {
  const token = Deno.env.get("GITHUB_DEPLOY_TOKEN");
  const repository = Deno.env.get("GITHUB_REPOSITORY");
  if (!token || !repository) return { state: "unavailable" };
  const ref = Deno.env.get("GITHUB_REF") || "main";
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/pages.yml/runs?branch=${encodeURIComponent(ref)}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return { state: "unavailable" };
    const result = await response.json();
    const run = result.workflow_runs?.[0];
    return {
      state:
        run?.status === "completed" &&
        [
          "failure",
          "cancelled",
          "timed_out",
          "action_required",
          "startup_failure",
        ].includes(run.conclusion)
          ? "failed"
          : "pending",
    };
  } catch {
    return { state: "unavailable" };
  }
}

Deno.serve(async (request) => {
  const respond = (value: unknown, status = 200) =>
    json(request, value, status);
  if (request.method === "OPTIONS")
    return new Response(null, { headers: cors(request) });
  if (request.method !== "POST")
    return respond({ error: "Método no permitido." }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization) return respond({ error: "Sesión requerida." }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return respond({ error: "Sesión inválida." }, 401);
  const { data: allowed, error: accessError } =
    await userClient.rpc("is_admin");
  if (accessError || !allowed)
    return respond({ error: "Acceso denegado." }, 403);
  try {
    const {
      operation,
      id,
      poster_path: replacementPosterPath,
    } = await request.json();
    if (
      ![
        "publish",
        "unpublish",
        "delete",
        "deploy",
        "status",
        "replace-poster",
      ].includes(operation) ||
      typeof id !== "string" ||
      !/^[a-f\d-]{36}$/i.test(id)
    )
      return respond({ error: "Solicitud inválida." }, 400);
    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: video, error } = await admin
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !video) return respond({ error: "Video no encontrado." }, 404);
    const paths = [video.video_path, video.poster_path];
    if (paths.some((path) => !path.startsWith(`${user.id}/${id}/`)))
      return respond({ error: "Ruta de archivo inválida." }, 400);
    if (operation === "replace-poster") {
      if (video.status !== "published")
        return respond(
          { error: "Solo se puede reemplazar la portada de una publicación." },
          409,
        );
      if (
        typeof replacementPosterPath !== "string" ||
        !new RegExp(
          `^${user.id}/${id}/[a-f\\d-]+\\.(?:jpe?g|png|webp)$`,
          "i",
        ).test(replacementPosterPath)
      )
        return respond({ error: "Ruta de portada inválida." }, 400);
      if (replacementPosterPath === video.poster_path)
        return respond(
          { error: "La portada seleccionada ya está publicada." },
          400,
        );

      const { error: copyError } = await admin.storage
        .from("drafts")
        .copy(replacementPosterPath, replacementPosterPath, {
          destinationBucket: "published",
        });
      if (copyError) throw copyError;
      const { data: updatedVideo, error: updateError } = await admin
        .from("videos")
        .update({ poster_path: replacementPosterPath })
        .eq("id", id)
        .eq("status", "published")
        .select("id")
        .single();
      if (updateError || !updatedVideo) {
        await admin.storage.from("published").remove([replacementPosterPath]);
        throw updateError || new Error("La publicación ya no está disponible.");
      }
      const { error: removeError } = await admin.storage
        .from("published")
        .remove([video.poster_path]);
      if (removeError) {
        await admin
          .from("videos")
          .update({ poster_path: video.poster_path })
          .eq("id", id)
          .eq("status", "published");
        await admin.storage.from("published").remove([replacementPosterPath]);
        throw removeError;
      }
      let deployment: string;
      try {
        deployment = await requestDeployment();
      } catch {
        deployment =
          "Pendiente: no se pudo contactar con GitHub. Reintenta actualizar la previsualización.";
      }
      return respond({ ok: true, deployment });
    }
    if (operation === "status") return respond(await deploymentState());
    if (operation === "publish" && video.status !== "published") {
      const copied: string[] = [];
      try {
        for (const path of paths) {
          const { error: copyError } = await admin.storage
            .from("drafts")
            .copy(path, path, { destinationBucket: "published" });
          if (copyError) throw copyError;
          copied.push(path);
        }
        const { error: updateError } = await admin
          .from("videos")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (updateError) throw updateError;
      } catch (e) {
        if (copied.length) await admin.storage.from("published").remove(copied);
        throw e;
      }
    }
    if (operation === "unpublish" || operation === "delete") {
      const { error: removeError } = await admin.storage
        .from("published")
        .remove(paths);
      if (removeError) throw removeError;
      const { error: updateError } = await admin
        .from("videos")
        .update({ status: "draft", published_at: null })
        .eq("id", id);
      if (updateError) throw updateError;
      if (operation === "delete") {
        const { error: draftError } = await admin.storage
          .from("drafts")
          .remove(paths);
        if (draftError) throw draftError;
        const { error: deleteError } = await admin
          .from("videos")
          .delete()
          .eq("id", id);
        if (deleteError) throw deleteError;
      }
    }
    let deployment: string;
    try {
      deployment = await requestDeployment();
    } catch {
      deployment =
        "Pendiente: no se pudo contactar con GitHub. Reintenta actualizar la previsualización.";
    }
    return respond({ ok: true, deployment });
  } catch {
    return respond(
      {
        error:
          "No se pudo completar la operación. Revisa los archivos y los registros de Supabase antes de reintentar.",
      },
      500,
    );
  }
});
