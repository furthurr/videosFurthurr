import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  asset,
  base,
  db,
  dynamicUrl,
  formatDate,
  manageVideo,
  safeUrl,
  socialReady,
  validateVideo,
  videoFormat,
  type Video,
} from "../lib";
import { extractPoster } from "../poster";

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selected, setSelected] = useState<Video | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const { data } = db!.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    db!.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setChecking(false);
      }
      setSession(data.session);
      if (!data.session) setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    if (!session) {
      setAllowed(false);
      setVideos([]);
      setSelected(null);
      return;
    }
    setChecking(true);
    db!.rpc("is_admin").then(({ data, error }) => {
      if (!active) return;
      setAllowed(data === true && !error);
      setChecking(false);
      if (error)
        setError(
          "No se pudo comprobar el acceso. Revisa la configuración de Supabase.",
        );
    });
    return () => {
      active = false;
    };
  }, [session]);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    (async () => {
      const all: Video[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await db!
          .from("videos")
          .select("*,video_links(*)")
          .order("created_at", { ascending: false })
          .order("id")
          .range(offset, offset + 99);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        all.push(...data);
        if (data.length < 100) break;
      }
      if (active) setVideos(all);
    })();
    return () => {
      active = false;
    };
  }, [allowed, revision]);
  async function login() {
    setError("");
    const { error } = await db!.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}${base}admin/` },
    });
    if (error) setError(error.message);
  }
  async function signOut() {
    const { error } = await db!.auth.signOut();
    if (error) setError(error.message);
  }
  async function operation(
    action: "publish" | "unpublish" | "delete" | "deploy",
    video: Video,
  ) {
    if (
      (action === "delete" || action === "unpublish") &&
      !confirm(
        action === "delete"
          ? `¿Eliminar definitivamente «${video.title}» y sus archivos?`
          : "¿Retirar la publicación? Las copias descargadas y cachés externas no se pueden revocar.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await manageVideo(action, video.id);
      setNotice(
        action === "deploy"
          ? result.deployment || "Actualización solicitada."
          : `${action === "publish" ? "Video publicado. Ya puedes abrir su enlace dinámico." : action === "delete" ? "Video eliminado." : "Publicación retirada."} ${result.deployment || ""}`,
      );
      setRevision((n) => n + 1);
      if (action !== "deploy") setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error.");
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <div className="empty" role="status">
        Comprobando acceso…
      </div>
    );
  if (!session)
    return (
      <section className="login">
        <span className="eyebrow">SOLO PARA EL CREADOR</span>
        <h1>Detrás de las cámaras.</h1>
        <p>
          Inicia sesión con tu cuenta de GitHub para administrar los videos. La
          gestión está reservada a la cuenta autorizada.
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" onClick={login}>
          Continuar con GitHub ↗
        </button>
      </section>
    );
  if (!allowed)
    return (
      <section className="login">
        <h1>Acceso restringido</h1>
        <p>
          Tu sesión es válida, pero esta cuenta no está autorizada como
          administrador.
        </p>
        {error && <p role="alert">{error}</p>}
        <button className="button" onClick={signOut}>
          Cerrar sesión
        </button>
      </section>
    );
  return (
    <section className="admin">
      <div className="admin-head">
        <div>
          <span className="eyebrow">TU ESTUDIO</span>
          <h1>Administrar videos</h1>
        </div>
        <div className="actions">
          <button
            className="button primary"
            disabled={busy}
            onClick={() => {
              setSelected(null);
              setRevision((n) => n + 1);
            }}
          >
            ＋ Nuevo video
          </button>
          <button className="button" disabled={busy} onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice success" role="status">
          {notice}
        </p>
      )}
      <div className="admin-grid">
        <div className="admin-list">
          {videos.length === 0 && (
            <p className="muted">
              Aún no hay videos. Crea el primero desde el formulario.
            </p>
          )}
          {videos.map((video) => (
            <button
              key={video.id}
              disabled={busy}
              className={`admin-item ${selected?.id === video.id ? "selected" : ""}`}
              onClick={() => setSelected(video)}
            >
              <strong>{video.title}</strong>
              <small>
                {video.status === "published" ? "● Público" : "○ Borrador"} ·{" "}
                {formatDate(video.published_at)}
              </small>
            </button>
          ))}
        </div>
        <Editor
          key={`${selected?.id || "new"}-${revision}`}
          video={selected}
          userId={session.user.id}
          busy={busy}
          setBusy={setBusy}
          onError={setError}
          onSaved={(video) => {
            setSelected(video);
            setRevision((n) => n + 1);
            setNotice("Cambios guardados.");
          }}
          onOperation={operation}
        />
      </div>
    </section>
  );
}

type EditorProps = {
  video: Video | null;
  userId: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onError: (v: string) => void;
  onSaved: (v: Video) => void;
  onOperation: (
    action: "publish" | "unpublish" | "delete" | "deploy",
    v: Video,
  ) => void;
};
function Editor({
  video,
  userId,
  busy,
  setBusy,
  onError,
  onSaved,
  onOperation,
}: EditorProps) {
  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [tags, setTags] = useState(video?.tags.join(", ") || "");
  const [links, setLinks] = useState(
    video?.video_links
      ?.map((link) => `${link.label} | ${link.url}`)
      .join("\n") || "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [stage, setStage] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [deploymentState, setDeploymentState] = useState("pending");
  const [preview, setPreview] = useState("");
  const published = video?.status === "published";
  const dirty = Boolean(
    video &&
    (title !== video.title ||
      description !== video.description ||
      tags !== video.tags.join(", ") ||
      links !==
        (video.video_links
          ?.map((link) => `${link.label} | ${link.url}`)
          .join("\n") || "") ||
      file ||
      poster),
  );
  useEffect(() => {
    if (!video) return;
    let active = true;
    if (published) {
      setPreview(asset(video.video_path));
    } else
      db!.storage
        .from("drafts")
        .createSignedUrl(video.video_path, 3600)
        .then(({ data }) => {
          if (active && data) setPreview(data.signedUrl);
        });
    return () => {
      active = false;
    };
  }, [video, published]);
  useEffect(() => {
    if (!video || !published) return;
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const value = await socialReady(video);
        if (!active) return;
        setReady(value);
        if (!value) {
          const result = await manageVideo("status", video.id);
          if (active) setDeploymentState(result.state || "unavailable");
        }
      } catch {
        if (active) setDeploymentState("unavailable");
      } finally {
        checking = false;
      }
    };
    void check();
    const timer = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [video, published]);
  async function save(event: FormEvent) {
    event.preventDefault();
    onError("");
    if (file) {
      const problem = validateVideo(file);
      if (problem) {
        onError(problem);
        return;
      }
    }
    if (!video && !file) {
      onError("Selecciona un archivo WebM o MP4.");
      return;
    }
    if (
      poster &&
      (!["image/jpeg", "image/png", "image/webp"].includes(poster.type) ||
        poster.size > 5 * 1024 * 1024)
    ) {
      onError("La portada debe ser JPG, PNG o WebP y pesar como máximo 5 MB.");
      return;
    }
    const parsedLinks = links
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const split = line.indexOf("|");
        return {
          label: line.slice(0, split).trim(),
          url: line.slice(split + 1).trim(),
        };
      });
    if (
      parsedLinks.length > 20 ||
      parsedLinks.some(
        (link) => !link.label || link.label.length > 100 || !safeUrl(link.url),
      )
    ) {
      onError("Usa como máximo 20 recursos con el formato Nombre | https://…");
      return;
    }
    const parsedTags = [
      ...new Set(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    if (parsedTags.length > 12 || parsedTags.some((tag) => tag.length > 40)) {
      onError("Usa hasta 12 etiquetas de 40 caracteres como máximo.");
      return;
    }
    setBusy(true);
    setStage("Preparando archivos…");
    const id = video?.id || crypto.randomUUID();
    const uploaded: string[] = [];
    let saved = false;
    try {
      let videoPath = video?.video_path || "";
      let posterPath = video?.poster_path || "";
      let duration = video?.duration || null;
      let generated: Blob | null = null;
      if (file) {
        const metadata = await extractPoster(file);
        duration = metadata.duration;
        if (!poster) generated = metadata.poster;
        const format = videoFormat(file.name)!;
        videoPath = `${userId}/${id}/${crypto.randomUUID()}.${format.extension}`;
        setStage("Subiendo video… No cierres esta pestaña.");
        const { error } = await db!.storage
          .from("drafts")
          .upload(
            videoPath,
            new File([file], file.name, { type: format.mime }),
            {
              contentType: format.mime,
              upsert: false,
            },
          );
        if (error) throw error;
        uploaded.push(videoPath);
      }
      const image = poster || generated;
      if (image) {
        const extension =
          image.type === "image/png"
            ? "png"
            : image.type === "image/webp"
              ? "webp"
              : "jpg";
        posterPath = `${userId}/${id}/${crypto.randomUUID()}.${extension}`;
        setStage("Subiendo portada…");
        const { error } = await db!.storage
          .from("drafts")
          .upload(posterPath, image, {
            contentType: image.type,
            upsert: false,
          });
        if (error) throw error;
        uploaded.push(posterPath);
      }
      if (!posterPath)
        throw new Error(
          "No se pudo extraer una portada. Selecciona una imagen manualmente.",
        );
      setStage("Guardando información…");
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags: parsedTags,
        video_path: videoPath,
        poster_path: posterPath,
        duration,
      };
      // Una función transaccional guarda el video y sus recursos juntos.
      const { error } = await db!.rpc("save_video", {
        p_id: id,
        p_data: payload,
        p_links: parsedLinks,
      });
      if (error) throw error;
      saved = true;
      const { data, error: fetchError } = await db!
        .from("videos")
        .select("*,video_links(*)")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;
      if (video && !published) {
        const obsolete = [video.video_path, video.poster_path].filter(
          (path) => path !== videoPath && path !== posterPath,
        );
        if (obsolete.length) await db!.storage.from("drafts").remove(obsolete);
      }
      if (published) {
        try {
          const result = await manageVideo("deploy", id);
          if (result.deployment?.startsWith("Pendiente"))
            onError(
              "Los cambios están guardados, pero la actualización social está pendiente. Usa «Actualizar previsualización».",
            );
        } catch {
          onError(
            "Cambios guardados. No se pudo solicitar el despliegue social; puedes reintentarlo.",
          );
        }
      }
      onSaved(data);
    } catch (e) {
      if (!saved && uploaded.length)
        await db!.storage.from("drafts").remove(uploaded);
      onError(e instanceof Error ? e.message : "No se pudo guardar el video.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }
  return (
    <form className="editor" onSubmit={save}>
      <h2>{video ? "Editar video" : "Una nueva idea"}</h2>
      <p className="muted">
        Los videos publicados son públicos. Los borradores solo los puedes ver
        tú.
      </p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        <label className="field">
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={160}
            placeholder="¿Qué vas a compartir?"
          />
        </label>
        <label className="field">
          Descripción
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            placeholder="Cuenta un poco de qué trata…"
          />
        </label>
        <label className="field">
          Etiquetas
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Flutter, tutorial, demo"
          />
          <small>Separadas por comas. Hasta 12 etiquetas.</small>
        </label>
        <label className="field">
          Video WebM o MP4
          <input
            type="file"
            accept=".webm,.mp4,video/webm,video/mp4"
            disabled={published}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <small>
            {published
              ? "Retira la publicación antes de reemplazar archivos."
              : "Máximo 40 MB. Si no eliges portada, intentaremos extraer un fotograma."}
          </small>
        </label>
        <label className="field">
          Portada
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={published}
            onChange={(e) => setPoster(e.target.files?.[0] || null)}
          />
          <small>JPG, PNG o WebP. Máximo 5 MB.</small>
        </label>
        <label className="field">
          Recursos relacionados
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder={
              "Código fuente | https://github.com/…\nDocumentación | https://…"
            }
          />
          <small>Un recurso por línea: Nombre | URL</small>
        </label>
        {preview && (
          <video
            controls
            preload="metadata"
            src={preview}
            style={{ width: "100%", borderRadius: 10 }}
            aria-label="Vista previa del video"
          />
        )}
        {published && (
          <p className="notice">
            Previsualización social:{" "}
            {ready === null
              ? "comprobando…"
              : ready
                ? "lista en el último despliegue."
                : deploymentState === "failed"
                  ? "el último despliegue falló. Esta revisión aún no está lista; revisa GitHub Actions y reintenta."
                  : deploymentState === "unavailable"
                    ? "pendiente. No se pudo consultar GitHub; revisa la integración."
                    : "pendiente de generar o actualizar."}
            <br />
            <a
              href={dynamicUrl(video.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir video público ↗
            </a>
            <br />
            <small>
              Las redes pueden conservar una versión anterior en caché.
            </small>
          </p>
        )}
        {busy && (
          <div role="status">
            <progress aria-label={stage} />
            <p className="upload-note">{stage || "Procesando operación…"}</p>
          </div>
        )}
        {dirty && (
          <p className="muted">
            Guarda los cambios antes de modificar la publicación.
          </p>
        )}
        <div className="actions">
          <button type="submit" className="button primary">
            Guardar {video ? "cambios" : "borrador"}
          </button>
          {video && (
            <>
              <button
                type="button"
                className="button"
                disabled={dirty}
                onClick={() =>
                  onOperation(published ? "unpublish" : "publish", video)
                }
              >
                {published ? "Retirar publicación" : "Publicar video"}
              </button>
              {published && (
                <button
                  type="button"
                  className="button"
                  onClick={() => onOperation("deploy", video)}
                >
                  Actualizar previsualización
                </button>
              )}
              <button
                type="button"
                className="button danger"
                onClick={() => onOperation("delete", video)}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </fieldset>
    </form>
  );
}
