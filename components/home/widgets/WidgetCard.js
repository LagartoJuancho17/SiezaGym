// Shell comun de los widgets de la Home: card crema, label chico arriba a la
// izquierda, flecha arriba a la derecha, numero grande con unidad, y el
// grafico abajo. Es la gramatica visual de la referencia.

export function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#8C827A]"
      aria-hidden="true"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function WidgetValue({ value, unit, status, size = "lg" }) {
  return (
    <div className="mt-1 flex items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-1">
        <span
          className={`font-sans font-black tracking-tight text-[#141414] ${
            size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-bold text-[#6E665E]">{unit}</span>}
      </div>
      {status && <span className="text-xs font-semibold text-[#575049]">{status}</span>}
    </div>
  );
}

/** Escala con marcas, como la de Hydration / Oxygen de la referencia. */
// compact: a 3 columnas en mobile las marcas no entran, se muestran desde sm.
export function WidgetScale({ ticks, compact = false }) {
  return (
    <div
      className={`mt-1 justify-between text-[10px] text-[#8C827A] ${
        compact ? "hidden sm:flex" : "flex"
      }`}
    >
      {ticks.map((tick) => (
        <span key={tick}>{tick}</span>
      ))}
    </div>
  );
}

// Paleta de los graficos de la referencia: los tres tonos que se reparten
// cada serie. El naranja resalta un tramo, no pinta todo.
export const CHART_LIGHT = "#CFC8BE";
export const CHART_DARK = "#3A3531";
export const CHART_ACCENT = "#FF5733";

/**
 * Barra de la referencia: naranja al principio, oscuro hasta el valor, claro
 * el resto, con una marca vertical y la etiqueta arriba.
 */
export function WidgetMeter({ pct, marker }) {
  const value = Math.max(0, Math.min(100, pct));
  const accentEnd = Math.min(value, 35);

  return (
    <div>
      {marker && (
        // Alineada al lado del valor en vez de centrada sobre la marca: a 3
        // columnas centrarla se salia de la card.
        <div
          className={`mb-1 flex text-[11px] text-[#575049] ${
            value >= 50 ? "justify-end" : "justify-start"
          }`}
        >
          <span className="truncate">{marker}</span>
        </div>
      )}
      <div className="relative h-[3px] w-full">
        <span className="absolute inset-0 rounded-full" style={{ background: CHART_LIGHT }} />
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: CHART_DARK }}
        />
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${accentEnd}%`, background: CHART_ACCENT }}
        />
        <span
          className="absolute -top-2 h-[11px] w-px"
          style={{ left: `${value}%`, background: CHART_LIGHT }}
        />
      </div>
    </div>
  );
}

export default function WidgetCard({ label, href, children, className = "" }) {
  return (
    <div
      className={`flex flex-col justify-between rounded-[10px] border border-[#5A1215] bg-surface p-3.5 shadow-sm sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold leading-tight text-[#6E665E]">{label}</span>
        {href ? (
          <a
            href={href}
            aria-label={`Ver ${label}`}
            className="rounded transition hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowUpRight />
          </a>
        ) : (
          <ArrowUpRight />
        )}
      </div>
      {children}
    </div>
  );
}
