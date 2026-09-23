/**
 * Gestión de MediaSession API para control desde la pantalla de bloqueo de iOS y Android.
 *
 * Permite que al bloquear el teléfono se vea:
 * - Nombre del ejercicio y serie (ej: "Dominadas · Serie 2 de 3")
 * - Tiempo de entrenamiento transcurrido
 * - Portada / Animación del ejercicio
 * - Botón "Siguiente" (⏭) que termina la serie directamente desde la pantalla bloqueada.
 */

let silentAudio = null;

function ensureSilentAudio() {
  if (typeof window === "undefined") return null;
  if (!silentAudio) {
    // Audio WAV silencioso de 1 segundo codificado en Base64
    const silentWav =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    silentAudio = new Audio(silentWav);
    silentAudio.loop = true;
  }
  return silentAudio;
}

export function setupMediaSession({
  exerciseName = "Entrenamiento",
  setNumber = 1,
  totalSets = 3,
  routineName = "Rutina",
  mediaUrl = null,
  timeString = "00:00",
  onFinishSet,
  onTogglePause,
}) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

  try {
    // Iniciar loop de audio silencioso para mantener activo el widget en iOS
    const audio = ensureSilentAudio();
    if (audio && audio.paused) {
      audio.play().catch(() => {});
    }

    // Configurar metadatos en la pantalla de bloqueo
    const artwork = mediaUrl
      ? [{ src: mediaUrl, sizes: "512x512", type: "image/gif" }]
      : [];

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: `${exerciseName} · Serie ${setNumber}/${totalSets}`,
      artist: `SiezaGym • ${timeString}`,
      album: routineName,
      artwork,
    });

    // Acción para terminar serie desde el botón "Siguiente" (⏭)
    if (onFinishSet) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        onFinishSet();
      });
    }

    // Acción para pausar / reanudar
    if (onTogglePause) {
      navigator.mediaSession.setActionHandler("play", () => {
        onTogglePause();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        onTogglePause();
      });
    }
  } catch {
    // Si el navegador no permite inicializar MediaSession
  }
}

export function updateMediaSessionMetadata({
  exerciseName,
  setNumber,
  totalSets,
  routineName,
  mediaUrl,
  timeString,
}) {
  if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
  try {
    if (navigator.mediaSession.metadata) {
      navigator.mediaSession.metadata.title = `${exerciseName} · Serie ${setNumber}/${totalSets}`;
      navigator.mediaSession.metadata.artist = `SiezaGym • ${timeString}`;
      if (routineName) navigator.mediaSession.metadata.album = routineName;
      if (mediaUrl) {
        navigator.mediaSession.metadata.artwork = [
          { src: mediaUrl, sizes: "512x512", type: "image/gif" },
        ];
      }
    }
  } catch {
    // Sin acción
  }
}

export function teardownMediaSession() {
  if (typeof window === "undefined") return;
  try {
    if (silentAudio) {
      silentAudio.pause();
      silentAudio.currentTime = 0;
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      try {
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {}
    }
  } catch {}
}
