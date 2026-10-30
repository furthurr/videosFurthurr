import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const db = configured ? createClient(url, key) : null;
export const base = import.meta.env.BASE_URL;
export const icons = {
  mark: `${base}icons/icon-192.png`,
  social: `${base}icons/og-image.png`,
};
export const author = {
  name: "Furthurr",
  site: "https://furthurr.github.io/",
  github: "https://github.com/furthurr",
  avatar: "https://github.com/furthurr.png",
};

export type Video = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  video_path: string;
  poster_path: string;
  duration: number | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  created_at: string;
  video_links?: { id?: string; label: string; url: string }[];
};

export function asset(path: string, published = true) {
  return (
    db?.storage.from(published ? "published" : "drafts").getPublicUrl(path).data
      .publicUrl || ""
  );
}
export function dynamicUrl(id: string) {
  return `${location.origin}${base}watch/?v=${encodeURIComponent(id)}`;
}
export function formatDuration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return "WebM";
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
export function formatDate(date: string | null) {
  return date
    ? new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
        new Date(date),
      )
    : "Borrador";
}
export function safeUrl(input: string) {
  try {
    const url = new URL(input);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}
export function routeVideo(path: string, search: string) {
  return (
    new URLSearchParams(search).get("v") ||
    path.match(/\/v\/([a-f\d-]+)\/?$/i)?.[1] ||
    null
  );
}
export function validateVideo(file: File) {
  if (!file.name.toLowerCase().endsWith(".webm"))
    return "Selecciona un archivo WebM.";
  if (file.size > 40 * 1024 * 1024)
    return "El límite inicial es de 40 MB por video.";
  if (!file.size) return "El archivo está vacío.";
  return null;
}
export async function socialReady(video: Video): Promise<boolean> {
  try {
    const response = await fetch(
      `${base}social-manifest.json?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!response.ok) return false;
    const manifest = await response.json();
    return manifest[video.id] === video.updated_at;
  } catch {
    return false;
  }
}
export async function shareUrl(video: Video) {
  return (await socialReady(video))
    ? `${location.origin}${base}v/${video.id}/`
    : dynamicUrl(video.id);
}
export async function manageVideo(operation: string, id: string) {
  if (!db) throw new Error("Supabase no está configurado.");
  const { data, error } = await db.functions.invoke("manage-video", {
    body: { operation, id },
  });
  if (error)
    throw new Error(
      "No se pudo completar la operación. Revisa la conexión y los registros de la función.",
    );
  if (data?.error) throw new Error(data.error);
  return data as {
    deployment?: string;
    state?: "pending" | "failed" | "unavailable";
  };
}
