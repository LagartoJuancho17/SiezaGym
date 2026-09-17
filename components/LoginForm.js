"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";

async function persistSession(user) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear la sesión en el servidor.");
  }
}

/**
 * Los códigos de Firebase no se le muestran a nadie: dicen poco y asustan.
 * Cada uno se traduce a qué pasó y qué hacer.
 */
function getFriendlyErrorMessage(err) {
  const code = err?.code || "";
  const msg = err?.message || "";

  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Email o contraseña incorrectos.";
  }
  if (code === "auth/user-not-found") {
    return "No existe una cuenta con este email.";
  }
  if (code === "auth/email-already-in-use") {
    return "Ya existe una cuenta con este email. Probá iniciando sesión.";
  }
  if (code === "auth/weak-password") {
    return "La contraseña tiene que tener al menos 6 caracteres.";
  }
  if (code === "auth/invalid-email") {
    return "Ese email no tiene un formato válido.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Se canceló el inicio de sesión con Google.";
  }
  if (code === "auth/popup-blocked") {
    return "El navegador bloqueó la ventana de Google.";
  }
  if (code === "auth/network-request-failed") {
    return "Error de red. Revisá tu conexión.";
  }
  if (code === "auth/too-many-requests") {
    return "Demasiados intentos. Esperá unos minutos.";
  }
  return msg || "No se pudo completar. Probá de nuevo.";
}

/**
 * La G de Google va con sus colores de marca y no con los del tema: Google
 * exige que su marca no se recolore. Es la única excepción de la app.
 */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

/**
 * Entrar o crear la cuenta.
 *
 * Las dos cosas viven en la misma pantalla y cambian con las pestañas de
 * arriba: son el mismo formulario más un campo, y mandar a otra página para
 * agregar una línea obliga a volver a escribir el email.
 */
export default function LoginForm({ initialMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const queryMode = searchParams.get("mode");

  const [mode, setMode] = useState(initialMode || (queryMode === "signup" ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = mode === "signup";

  function changeMode(next) {
    if (next === mode) return;
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
    // La barra de direcciones acompaña sin recargar: compartir el link o
    // recargar tiene que traer de vuelta la misma pestaña.
    if (typeof window !== "undefined") {
      const base = next === "signup" ? "/register" : "/login";
      const url = nextUrl !== "/" ? `${base}?next=${encodeURIComponent(nextUrl)}` : base;
      window.history.replaceState(null, "", url);
    }
  }

  async function finishLogin(credential) {
    await persistSession(credential.user);
    router.push(nextUrl);
    router.refresh();
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (signup) {
      if (password.length < 6) {
        setError("La contraseña tiene que tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las dos contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const action = signup ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await finishLogin(await action(getClientAuth(), email.trim(), password));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function withGoogle() {
    setLoading(true);
    setError("");
    try {
      await finishLogin(await signInWithPopup(getClientAuth(), getGoogleProvider()));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="d2-auth" aria-labelledby="auth-title">
      <p className="d2-auth-brand">SiezaGym</p>
      <h1 id="auth-title" className="d2-page-title">
        {signup ? "Creá tu cuenta" : "Bienvenido de nuevo"}
      </h1>

      <div className="d2-segs d2-auth-modes" role="tablist" aria-label="Entrar o crear cuenta">
        <button
          type="button"
          role="tab"
          aria-selected={!signup}
          onClick={() => changeMode("signin")}
          className={!signup ? "d2-seg d2-seg-on" : "d2-seg"}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={signup}
          onClick={() => changeMode("signup")}
          className={signup ? "d2-seg d2-seg-on" : "d2-seg"}
        >
          Crear cuenta
        </button>
      </div>

      <div className="d2-panel d2-form">
        <button type="button" onClick={withGoogle} disabled={loading} className="d2-google">
          <GoogleIcon />
          {signup ? "Registrarme con Google" : "Continuar con Google"}
        </button>

        <p className="d2-divider">
          <span>o con tu email</span>
        </p>

        <form onSubmit={submit} className="d2-authform">
          <div>
            <label className="d2-form-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              disabled={loading}
              className="d2-input"
            />
          </div>

          <div>
            <p className="d2-field-head">
              <label className="d2-form-label" htmlFor="auth-password">
                Contraseña
              </label>
              {/* Texto y no un ojo: "mostrar" dice lo que hace y además
                  anuncia el estado sin depender de reconocer el icono. */}
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-pressed={visible}
                className="d2-reveal"
              >
                {visible ? "Ocultar" : "Mostrar"}
              </button>
            </p>
            <input
              id="auth-password"
              type={visible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={signup ? "Al menos 6 caracteres" : "Tu contraseña"}
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={6}
              required
              disabled={loading}
              className="d2-input"
            />
          </div>

          {signup && (
            <div>
              <label className="d2-form-label" htmlFor="auth-confirm">
                Repetir contraseña
              </label>
              <input
                id="auth-confirm"
                // Sigue al mismo botón de mostrar: son la misma contraseña y
                // dos interruptores para lo mismo confunden.
                type={visible ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="La misma de arriba"
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
                className="d2-input"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="d2-glass d2-error">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="d2-submit">
            {loading ? "Un momento…" : signup ? "Crear mi cuenta" : "Ingresar"}
          </button>
        </form>
      </div>

      <p className="d2-auth-foot">
        {signup ? "¿Ya tenés cuenta? " : "¿Todavía no tenés cuenta? "}
        <button type="button" onClick={() => changeMode(signup ? "signin" : "signup")}>
          {signup ? "Iniciá sesión" : "Creá una gratis"}
        </button>
      </p>
    </section>
  );
}
