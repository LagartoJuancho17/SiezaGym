"use client";

import "./coach-design2.css";
import { useEffect, useRef, useState } from "react";
import {
  generateInvitationCode,
  revokeInvitationCode,
} from "@/app/dashboard/coach/actions";

export default function AddStudentModal({ open, onClose }) {
  return open ? <InvitationDialog onClose={onClose} /> : null;
}

function InvitationDialog({ onClose }) {
  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState("");
  const overlayRef = useRef(null);

  useEffect(() => {
    if (overlayRef.current && !overlayRef.current.open) overlayRef.current.showModal();
  }, []);

  useEffect(() => {
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
  }, []);

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

  async function handleRegenerate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      await revokeInvitationCode();
      const result = await generateInvitationCode();
      setCode(result.code);
      setExpiresAt(new Date(result.expiresAt));
    } catch (err) {
      setError(err.message || "Error al regenerar el código.");
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={overlayRef}
      onClick={handleOverlayClick}
      onCancel={onClose}
      aria-labelledby="coach-invitation-title"
      className="d2-coach-dialog"
    >
      <div className="d2-glass-strong d2-modal-card">
        <div className="flex items-center justify-between">
          <h3 id="coach-invitation-title" className="d2-modal-title">
            Agregar alumno
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar invitación"
            className="d2-coach-icon-button"
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

        <p className="d2-modal-text">
          Compartí este código con tu alumno para vincularlo a tu cuenta.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {loading && (
            <div className="flex h-20 items-center justify-center">
              <span role="status">Generando código…</span>
            </div>
          )}

          {error && (
            <div role="alert" className="d2-glass d2-coach-error">
              {error}
            </div>
          )}

          {code && !loading && (
            <>
              <div className="d2-glass d2-coach-code">
                <p className="d2-coach-code-value">
                  {code}
                </p>
              </div>

              {countdown && (
                <p className="d2-coach-muted">{countdown}</p>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="d2-modal-primary w-full gap-2"
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

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                className="d2-modal-secondary w-full gap-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Regenerar código
              </button>
            </>
          )}
        </div>

        {error && <button type="button" onClick={handleRegenerate} disabled={loading} className="d2-modal-primary w-full mt-4">Reintentar</button>}
        <button
          type="button"
          onClick={onClose}
          className="d2-modal-secondary w-full mt-4"
        >
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
