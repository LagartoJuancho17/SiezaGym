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
    throw new Error("No se pudo crear la sesion en el servidor.");
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  async function finishLogin(userCredential) {
    await persistSession(userCredential.user);
    router.push(nextUrl);
    router.refresh();
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const action =
        mode === "signup"
          ? createUserWithEmailAndPassword
          : signInWithEmailAndPassword;

      await finishLogin(await action(getClientAuth(), email, password));
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      await finishLogin(await signInWithPopup(getClientAuth(), getGoogleProvider()));
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      aria-labelledby="login-title"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
        Bienvenido
      </p>
      <h1
        id="login-title"
        className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50"
      >
        SiezaGym
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Iniciá sesión o registrate con Google para empezar. También podés
        usar tu email.
      </p>

      <button
        type="button"
        className="mt-7 flex h-12 w-full items-center justify-center gap-3 border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:hover:bg-white"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      {!showEmailForm ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-sm font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
          onClick={() => setShowEmailForm(true)}
        >
          Usar email y contraseña
        </button>
      ) : (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-zinc-800" />
            <span>o con email</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <div
            className="mb-5 grid grid-cols-2 border border-zinc-800 bg-zinc-900/60 p-1"
            aria-label="Modo de autenticacion"
          >
            <button
              type="button"
              className={`h-10 text-sm font-semibold transition ${
                mode === "signin"
                  ? "border border-zinc-700 bg-zinc-800 text-zinc-50"
                  : "border border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
              onClick={() => setMode("signin")}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={`h-10 text-sm font-semibold transition ${
                mode === "signup"
                  ? "border border-zinc-700 bg-zinc-800 text-zinc-50"
                  : "border border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
              onClick={() => setMode("signup")}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Email</span>
              <input
                className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Password</span>
              <input
                className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>
            <button
              type="submit"
              className="mt-2 h-11 border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 disabled:hover:border-cyan-400 disabled:hover:bg-cyan-400"
              disabled={loading}
            >
              {mode === "signup" ? "Crear cuenta" : "Ingresar"}
            </button>
          </form>
        </>
      )}

      {error ? (
        <p className="mt-5 border border-red-900/70 bg-red-950/40 p-3 text-sm leading-6 text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
