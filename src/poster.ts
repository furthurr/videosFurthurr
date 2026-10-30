export async function extractPoster(
  file: File,
): Promise<{ duration: number | null; poster: Blob | null }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  let duration: number | null = null;
  try {
    const loaded = new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Códec no compatible."));
    });
    video.src = url;
    await withTimeout(loaded, 12000);
    duration = Number.isFinite(video.duration) ? video.duration : null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.round(
      (canvas.width * video.videoHeight) / video.videoWidth,
    );
    if (!canvas.width || !canvas.height) return { duration, poster: null };
    if (duration && duration > 1) {
      const seeked = new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });
      video.currentTime = Math.min(1, duration / 2);
      await withTimeout(seeked, 5000);
    }
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const poster = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return { duration, poster };
  } catch {
    return { duration, poster: null };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Tiempo agotado.")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
