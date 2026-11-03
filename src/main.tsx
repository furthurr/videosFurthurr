import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./pages/Admin";
import {
  asset,
  author,
  base,
  configured,
  db,
  formatDate,
  formatDuration,
  icons,
  routeVideo,
  safeUrl,
  shareUrl,
  videoFormat,
  type Video,
} from "./lib";
import "./styles.css";

function Avatar() {
  return (
    <a
      className="author"
      href={author.site}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visitar el sitio de Furthurr (nueva pestaña)"
    >
      <img className="avatar" src={author.avatar} alt="" />
      <span>
        {author.name}
        <small>Creador · Developer</small>
      </span>
    </a>
  );
}
function Footer() {
  return (
    <footer>
      <a className="wordmark footer-mark" href={base}>
        <img src={icons.mark} alt="" width={22} height={22} />
        <span>furthurr / videos</span>
      </a>
      <span>Ideas que vale la pena compartir.</span>
      <nav aria-label="Enlaces del autor">
        <a href={author.github} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
        <a
          href={`${author.github}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Proyectos ↗
        </a>
        <a href={author.site} target="_blank" rel="noopener noreferrer">
          Mi sitio ↗
        </a>
      </nav>
    </footer>
  );
}
function Setup() {
  return (
    <section className="empty">
      <span className="eyebrow">LISTO PARA CONECTAR</span>
      <h1>
        Tu próxima idea,
        <br />
        en video.
      </h1>
      <p>
        La interfaz está preparada. Configura Supabase para empezar a publicar
        tu biblioteca.
      </p>
      <p>Consulta las instrucciones de instalación incluidas en el proyecto.</p>
    </section>
  );
}

function Share({ video }: { video: Video }) {
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(native: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const url = await shareUrl(video);
      if (native && navigator.share)
        await navigator.share({
          title: video.title,
          text: video.description.slice(0, 160),
          url,
        });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Enlace copiado.");
      } else {
        setFallback(url);
        setMessage("Copia el enlace del campo.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setFallback(await shareUrl(video));
        setMessage("No se pudo compartir automáticamente. Copia este enlace.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="share">
      <button
        className="button primary"
        disabled={busy}
        onClick={() => act(true)}
      >
        ↗ Compartir
      </button>
      <button className="button" disabled={busy} onClick={() => act(false)}>
        ⧉ Copiar enlace
      </button>
      <span className="status" role="status">
        {message}
      </span>
      {fallback && (
        <input
          aria-label="Enlace para copiar"
          readOnly
          value={fallback}
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
  );
}

function Watch({ id }: { id: string }) {
  const player = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState("");
  const [playError, setPlayError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setVideo(null);
    db!
      .from("videos")
      .select("*, video_links(*)")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("No pudimos cargar el video.");
        else if (!data)
          setError("Este video no existe o ya no está publicado.");
        else {
          setVideo(data);
          document.title = `${data.title} · Furthurr Videos`;
        }
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  if (error)
    return (
      <section className="empty">
        <h1>Video no disponible</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={() => setRetry(retry + 1)}>
          Reintentar
        </button>{" "}
        <a href={base}>Volver a la biblioteca</a>
      </section>
    );
  if (!video)
    return (
      <div className="empty" role="status">
        Cargando tu video…
      </div>
    );
  return (
    <article className="watch">
      <a className="back" href={base}>
        ← Todos los videos
      </a>
      <div className="watch-heading">
        <div>
          <span className="eyebrow">DE LA IDEA A LA PANTALLA</span>
          <h1>{video.title}</h1>
          <div className="byline">
            <Avatar />
            <span>
              {formatDate(video.published_at)} ·{" "}
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>
        <Share video={video} />
      </div>
      <div className="watch-grid">
        <section>
          <div className="player">
            <video
              key={video.video_path}
              ref={player}
              controls
              playsInline
              preload="metadata"
              poster={asset(video.poster_path)}
              onError={() => setPlayError(true)}
            >
              <source
                src={asset(video.video_path)}
                type={videoFormat(video.video_path)?.mime}
              />
              Tu navegador no permite reproducir este video.
            </video>
          </div>
          {playError && (
            <p className="notice error" role="alert">
              No se pudo reproducir el archivo. Prueba con un navegador
              actualizado compatible con el formato y el códec de este video.
            </p>
          )}
          <div className="player-caption">
            <span className="made-by">Hecho para compartir</span>
            <label className="speed">
              Velocidad{" "}
              <select
                aria-label="Velocidad de reproducción"
                value={speed}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setSpeed(value);
                  if (player.current) player.current.playbackRate = value;
                }}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
            </label>
            <span>
              {videoFormat(video.video_path)?.label || "Video"} ·{" "}
              {formatDuration(video.duration)}
            </span>
          </div>
        </section>
        <aside className="details">
          <span className="eyebrow">SOBRE ESTE VIDEO</span>
          <h2>Un poco de contexto</h2>
          <p className="description">
            {video.description ||
              "El video habla por sí solo. Gracias por verlo."}
          </p>
          <div className="tags">
            {video.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <hr />
          <h3>Recursos y enlaces</h3>
          {video.video_links?.length ? (
            video.video_links
              .filter((link) => safeUrl(link.url))
              .map((link) => (
                <a
                  className="resource"
                  key={link.id || link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label} <span>↗</span>
                </a>
              ))
          ) : (
            <p className="muted">No hay enlaces adicionales.</p>
          )}
          <div className="author-note">
            <Avatar />
            <p>Más ideas, código y proyectos en mi espacio personal.</p>
            <a href={author.site} target="_blank" rel="noopener noreferrer">
              Explorar mi sitio ↗
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Library() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      const all: Video[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await db!
          .from("videos")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .order("id")
          .range(offset, offset + 99);
        if (!active) return;
        if (error) {
          setError("No pudimos cargar la biblioteca.");
          setLoading(false);
          return;
        }
        all.push(...data);
        if (data.length < 100) break;
      }
      if (active) {
        setVideos(all);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [retry]);
  const tags = [...new Set(videos.flatMap((video) => video.tags))].sort();
  const filtered = videos.filter(
    (video) =>
      video.title
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")) &&
      (!tag || video.tags.includes(tag)),
  );
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            <span className="dot" /> EL ESPACIO DE FURTHURR
          </span>
          <h1>
            Ideas en movimiento.
            <br />
            <span>Código, demos y algo más.</span>
          </h1>
          <p>
            Una colección de lo que construyo, aprendo y comparto.
            <br />
            Dale play. Quizá encuentres tu próxima idea.
          </p>
          <a
            className="text-link"
            href={author.site}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conoce mis proyectos ↗
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-play">▶</div>
          <span className="art-label">REC · IDEAS EN ACCIÓN</span>
          <img
            className="art-star"
            src={icons.mark}
            alt=""
            width={44}
            height={44}
          />
        </div>
      </section>
      <section className="library">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LA BIBLIOTECA</span>
            <h2>
              Explora los videos <span className="count">{videos.length}</span>
            </h2>
          </div>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Buscar videos por título"
              placeholder="Buscar un video…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="filters" aria-label="Filtrar por etiqueta">
          <button
            aria-pressed={!tag}
            className={!tag ? "active" : ""}
            onClick={() => setTag("")}
          >
            Todos los videos
          </button>
          {tags.map((item) => (
            <button
              key={item}
              aria-pressed={tag === item}
              className={tag === item ? "active" : ""}
              onClick={() => setTag(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="empty" role="status">
            Cargando la biblioteca…
          </div>
        ) : error ? (
          <div className="empty">
            <p role="alert">{error}</p>
            <button className="button" onClick={() => setRetry(retry + 1)}>
              Reintentar
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="empty">
            <h3>
              {videos.length
                ? "Sin coincidencias"
                : "Las buenas ideas están por llegar."}
            </h3>
            <p>
              {videos.length
                ? "Prueba con otro título o etiqueta."
                : "Los videos publicados aparecerán aquí."}
            </p>
          </div>
        ) : (
          <div className="video-grid">
            {filtered.map((video) => (
              <a
                className="video-card"
                href={`${base}watch/?v=${video.id}`}
                key={video.id}
              >
                <div className="thumbnail">
                  <img src={asset(video.poster_path)} alt="" loading="lazy" />
                  <span className="card-play" aria-hidden="true">
                    ▶
                  </span>
                  <span className="duration">
                    {formatDuration(video.duration)}
                  </span>
                </div>
                <div className="card-body">
                  <div className="tags">
                    {video.tags.slice(0, 2).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <h3>{video.title}</h3>
                  <p>{video.description || "Dale play para descubrir más."}</p>
                  <div className="card-meta">
                    <span>Furthurr</span>
                    <time dateTime={video.published_at || ""}>
                      {formatDate(video.published_at)}
                    </time>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="bottom-note">
        <img className="spark" src={icons.mark} alt="" width={44} height={44} />
        <div>
          <h2>Siempre hay algo nuevo por construir.</h2>
          <p>Encuentra el código detrás de las ideas.</p>
        </div>
        <a
          className="button"
          href={author.github}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explorar GitHub ↗
        </a>
      </section>
    </>
  );
}

function App() {
  const admin = /\/admin\/?$/.test(location.pathname);
  const id = routeVideo(location.pathname, location.search);
  return (
    <>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <header>
        <a className="wordmark" href={base}>
          <img
            className="logo"
            src={icons.mark}
            alt=""
            width={39}
            height={39}
          />
          furthurr
          <span className="brand-divider">/</span>
          <span className="brand-subtitle">videos</span>
        </a>
        <nav aria-label="Navegación principal">
          <a className={!admin && !id ? "nav-active" : ""} href={base}>
            Biblioteca
          </a>
          <a
            className="desktop-link"
            href={author.site}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mi espacio ↗
          </a>
          <a
            className="admin-link"
            href={`${base}admin/`}
            aria-label="Administración"
          >
            Administrar
          </a>
          <a href={author.site} target="_blank" rel="noopener noreferrer">
            <img
              className="avatar small"
              src={author.avatar}
              alt="Sitio de Furthurr"
            />
          </a>
        </nav>
      </header>
      <main id="main">
        {!configured ? (
          <Setup />
        ) : admin ? (
          <Admin />
        ) : id ? (
          <Watch id={id} />
        ) : (
          <Library />
        )}
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
