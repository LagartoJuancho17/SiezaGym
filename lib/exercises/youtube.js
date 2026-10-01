const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extrae el ID de 11 caracteres de cualquier URL o texto de YouTube.
 * Soporta:
 * - youtu.be/ID
 * - youtube.com/watch?v=ID
 * - youtube.com/shorts/ID
 * - youtube.com/embed/ID
 * - youtube.com/live/ID
 * - m.youtube.com / music.youtube.com
 * - ID directo de 11 caracteres
 */
export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Pegar directamente el id de 11 caracteres
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const first = segments[0];
      return first && YOUTUBE_ID_REGEX.test(first) ? first : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      // /watch?v=ID
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_ID_REGEX.test(v)) {
        return v;
      }
      // /shorts/ID, /embed/ID, /live/ID, /v/ID
      if (
        segments.length >= 2 &&
        ["shorts", "embed", "live", "v"].includes(segments[0]) &&
        YOUTUBE_ID_REGEX.test(segments[1])
      ) {
        return segments[1];
      }
      // Directo /ID
      if (segments.length === 1 && YOUTUBE_ID_REGEX.test(segments[0])) {
        return segments[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Devuelve la URL canónica y limpia de YouTube sin parámetros de seguimiento.
 */
export function cleanYouTubeUrl(urlOrId) {
  const id = extractYouTubeId(urlOrId);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

/**
 * Devuelve la URL de la miniatura de YouTube en resolución media o alta.
 */
export function getYouTubeThumbnailUrl(urlOrId) {
  const id = extractYouTubeId(urlOrId);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

/**
 * Devuelve la URL para incrustar el reproductor en un iframe (con youtube-nocookie).
 *
 * `playsinline=1` es lo que hace que en el iPhone el video se reproduzca
 * dentro de la página y no salte a pantalla completa ni abra la app de
 * YouTube. `rel=0` limita los videos sugeridos al final al mismo canal.
 */
export function getYouTubeEmbedUrl(urlOrId) {
  const id = extractYouTubeId(urlOrId);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
}
