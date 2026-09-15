"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  SHOW_THEME_SWITCHER,
  THEMES,
  THEME_STORAGE_KEY,
  isValidTheme,
} from "./themes";

/**
 * El tema vive en localStorage, que es estado externo al árbol de React.
 *
 * Leerlo con useState + useEffect obliga a un setState dentro del efecto (React
 * 19 lo rechaza) y hace que el primer render del cliente no coincida con el del
 * servidor. `useSyncExternalStore` está hecho justo para esto: el servidor
 * renderiza el tema por defecto y el cliente se sincroniza sin parpadeo ni
 * desajuste de hidratación.
 */
const themeStore = {
  listeners: new Set(),

  subscribe(onChange) {
    themeStore.listeners.add(onChange);
    // "storage" cubre el caso de tener la app abierta en dos pestañas.
    window.addEventListener("storage", onChange);
    return () => {
      themeStore.listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  },

  getSnapshot() {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return isValidTheme(stored) ? stored : DEFAULT_THEME;
    } catch {
      // Ventana privada o cookies bloqueadas: acceder tira, no devuelve null.
      return DEFAULT_THEME;
    }
  },

  getServerSnapshot() {
    return DEFAULT_THEME;
  },

  set(id) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Que no se pueda recordar no impide cambiarlo en esta sesión.
    }
    themeStore.listeners.forEach((listener) => listener());
  },
};

/** Contenedor del rediseño: pone `data-d2-theme`, del que cuelgan las variables. */
export default function ThemeRoot({ children }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  return (
    <div className="d2" data-d2-theme={theme}>
      {children}
      {SHOW_THEME_SWITCHER && <ThemeSwitcher theme={theme} onChoose={themeStore.set} />}
    </div>
  );
}

function ThemeSwitcher({ theme, onChoose }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-3 z-[60] flex flex-col items-end gap-2">
      {open && (
        <ul className="d2-glass-strong flex w-[188px] flex-col gap-1 rounded-[18px] p-1.5">
          {THEMES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onChoose(item.id);
                  setOpen(false);
                }}
                aria-current={item.id === theme ? "true" : undefined}
                className={`flex w-full flex-col rounded-[13px] px-3 py-2 text-left transition ${
                  item.id === theme ? "d2-fill-strong" : "d2-fill-hover"
                }`}
              >
                <span className="text-[13px] font-semibold">{item.label}</span>
                <span className="text-[11px] text-[var(--d2-text-3)]">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Cambiar tema"
        className="d2-glass flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold"
      >
        <span
          aria-hidden
          className="h-3 w-3 rounded-full"
          style={{ background: "var(--d2-bg-grad)", border: "1px solid var(--d2-border-strong)" }}
        />
        {THEMES.find((item) => item.id === theme)?.label ?? theme}
      </button>
    </div>
  );
}
