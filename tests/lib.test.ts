import { describe, expect, it } from "vitest";
import { formatDuration, routeVideo, safeUrl, validateVideo } from "../src/lib";

describe("enlaces y rutas públicas", () => {
  it("acepta URLs web y rechaza scripts o URLs incompletas", () => {
    expect(safeUrl("https://github.com/furthurr")).toBe(true);
    expect(safeUrl("http://example.com")).toBe(true);
    expect(safeUrl("javascript:alert(1)")).toBe(false);
    expect(safeUrl("data:text/html,x")).toBe(false);
    expect(safeUrl("/relative")).toBe(false);
  });
  it("resuelve rutas dinámicas y páginas sociales bajo el prefijo de Pages", () => {
    const id = "12345678-abcd-1234-abcd-123456789012";
    expect(routeVideo("/videosFurthurr/watch/", `?v=${id}`)).toBe(id);
    expect(routeVideo(`/videosFurthurr/v/${id}/`, "")).toBe(id);
    expect(routeVideo("/videosFurthurr/", "")).toBe(null);
  });
});
describe("archivos y duración", () => {
  it("formatea duración y valores desconocidos", () => {
    expect(formatDuration(111.9)).toBe("1:51");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(null)).toBe("WebM");
    expect(formatDuration(Infinity)).toBe("WebM");
  });
  it("rechaza formatos, archivos vacíos y tamaños fuera de límite", () => {
    const file = (name: string, size: number) => ({ name, size }) as File;
    expect(validateVideo(file("demo.webm", 1024))).toBe(null);
    expect(validateVideo(file("DEMO.WEBM", 1024))).toBe(null);
    expect(validateVideo(file("demo.mp4", 1024))).toMatch(/WebM/);
    expect(validateVideo(file("demo.webm", 0))).toMatch(/vacío/);
    expect(validateVideo(file("demo.webm", 41 * 1024 * 1024))).toMatch(/40 MB/);
  });
});
