"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, isValidTheme } from "./themes";

/**
 * El tema elegido, como estado externo al árbol de React.
 *
 * Vive en localStorage, no en el servidor: es una preferencia del aparato, no
 * de la cuenta. Leerlo con useState + useEffect obliga a un setState dentro del
 * efecto (React 19 lo rechaza) y hace que el primer render del cliente no
 * coincida con el del servidor. `useSyncExternalStore` está hecho justo para
 * esto: el servidor renderiza el tema por defecto y el cliente se sincroniza
 * sin parpadeo ni desajuste de hidratación.
 *
 * Vive en su propio módulo para que el contenedor que pinta el tema y el
 * selector que lo cambia lean la misma fuente y se enteren los dos del cambio.
 */
const listeners = new Set();

function subscribe(onChange) {
  listeners.add(onChange);
  // "storage" cubre el caso de tener la app abierta en dos pestañas.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Ventana privada o cookies bloqueadas: acceder tira, no devuelve null.
    return DEFAULT_THEME;
  }
}

function getServerSnapshot() {
  return DEFAULT_THEME;
}

export function setTheme(id) {
  if (!isValidTheme(id)) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Que no se pueda recordar no impide cambiarlo en esta sesión.
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
