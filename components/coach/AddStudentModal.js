"use client";

import { useEffect, useRef, useState } from "react";
import { generateInvitationCode } from "@/app/dashboard/coach/actions";

export default function AddStudentModal({ open, onClose }) {
  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState("");
  const overlayRef = useRef(null);
  const fetchedForOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      fetchedForOpen.current = false;
      return;
    }

    if (fetchedForOpen.current) return;
    fetchedForOpen.current = true;

    setCode(null);
    setExpiresAt(null);
    setCopied(false);
    setError(null);
    setCountdown("");
    setLoading(true);

    let cancelled = false;

    async function fetchCode() {
      try {
        const result = await generateInvitationCode();
        if (!cancelled) {
          setCode(result.code);
          setExpiresAt(new Date(result.expiresAt));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Error al generar el código.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCode();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!expiresAt) return;

    function updateCountdown() {
      const diff = expiresAt - new Date();
      if (diff <= 0) {
        setCountdown("Expirado");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `Expira en ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-sm rounded-[24px] border border-hair bg-deep p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg uppercase tracking-wide text-text">
            Agregar alumno
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-glass2 hover:text-text"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm text-muted">
          Compartí este código con tu alumno para vincularlo a tu cuenta.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {loading && (
            <div className="flex h-20 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-hair border-t-teal2" />
            </div>
          )}

          {error && (
            <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {code && !loading && (
            <>
              <div className="w-full rounded-[16px] border border-hair bg-glass p-5 text-center">
                <p className="font-mono-digit text-3xl tracking-[0.12em] text-teal2">
                  {code}
                </p>
              </div>

              {countdown && (
                <p className="text-xs text-faint">{countdown}</p>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-onlight transition hover:opacity-90"
              >
                {copied ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar código
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-hair text-sm font-medium text-muted transition hover:bg-glass2 hover:text-text"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
