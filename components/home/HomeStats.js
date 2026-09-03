function formatDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}min`;
}

function StatTile({ icon, label, value, sublabel, highlighted = false }) {
  return (
    <div
      className={`flex min-h-[104px] flex-col justify-between rounded-2xl border p-4 shadow-[0_2px_10px_rgba(24,18,15,0.04)] ${
        highlighted ? "border-orange-200 bg-orange-50" : "border-black/[0.06] bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a8078]">
          {label}
        </span>
        <span className="text-orange-600">{icon}</span>
      </div>
      <div>
        <p className="font-sans text-xl font-extrabold tracking-tight text-[#18120f]">{value}</p>
        {sublabel && <p className="mt-0.5 text-[10px] text-[#a39a91]">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function HomeStats({ streak, routinesCount, lastSession }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <StatTile
        label="Racha"
        value={streak}
        sublabel={streak === 1 ? "día seguido" : "días seguidos"}
        highlighted
        icon={
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2c-.3 3-2.5 4.8-4.2 6.7C6.2 10.5 5 12.6 5 15a7 7 0 0 0 14 0c0-2.9-1.6-4.7-2.8-6.6-.4.9-1.1 1.8-1.9 1.8-1.1 0-1.5-1-1.3-2C13.3 6 12.7 3.6 12 2z" />
          </svg>
        }
      />
      <StatTile
        label="Rutinas"
        value={routinesCount}
        sublabel={routinesCount === 1 ? "activa" : "activas"}
        icon={
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h10" />
          </svg>
        }
      />
      <StatTile
        label="Último volumen"
        value={lastSession ? `${lastSession.totalVolumeKg}kg` : "—"}
        sublabel={lastSession ? "última sesión" : "sin sesiones"}
        icon={
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        }
      />
      <StatTile
        label="Duración"
        value={lastSession ? formatDuration(lastSession.durationSeconds) : "—"}
        sublabel={lastSession ? "última sesión" : "sin sesiones"}
        icon={
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        }
      />
    </div>
  );
}
