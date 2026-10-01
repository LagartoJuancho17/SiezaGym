import { getYouTubeEmbedUrl } from "@/lib/exercises/youtube";

/**
 * Video de YouTube reproducido dentro de la app.
 *
 * - youtube-nocookie + playsinline: en el iPhone se ve en la página, sin
 *   saltar a pantalla completa ni abrir la app de YouTube.
 * - referrerPolicy: sin el origen de la página YouTube corta el embed con
 *   "Error 153"; `no-referrer` (lo que ponen algunos defaults) lo rompe.
 * - loading="lazy": una rutina con varios videos no carga todos los
 *   reproductores al abrir la pantalla.
 *
 * Si el link no es de YouTube no dibuja nada: el formulario ya lo valida,
 * pero un dato viejo o cargado a mano no puede dejar un recuadro negro vacío.
 */
export default function VideoEmbed({ url, title, className = "" }) {
  const src = getYouTubeEmbedUrl(url);
  if (!src) return null;

  return (
    <div className={`d2-video ${className}`.trim()}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
