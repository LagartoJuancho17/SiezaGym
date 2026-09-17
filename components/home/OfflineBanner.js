"use client";

import { useSyncExternalStore } from "react";

/**
 * El estado de la conexión es un sistema externo al de React, así que se lee
 * con useSyncExternalStore y no con un efecto que escribe estado: leerlo en un
 * efecto pinta primero "con conexión" y recién después corrige, y además rompe
 * la regla set-state-in-effect de React 19.
 */
function subscribe(onChange) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const readOffline = () => !navigator.onLine;

// En el servidor no hay navigator: se asume con conexión, que es lo que después
// confirma o corrige el cliente en el primer render.
const serverSnapshot = () => false;

export default function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, readOffline, serverSnapshot);

  if (!offline) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 flex items-center gap-2 rounded-full border border-hair bg-glass px-3 py-2">
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="shrink-0 text-faint"
      >
        <path d="M2 2l20 20" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M12 20h.01" />
      </svg>
      <span className="text-[11px] font-medium text-muted">
        Sin conexión · se sincroniza al volver
      </span>
    </div>
  );
}
