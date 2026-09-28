"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemInvitationCode, unlinkCurrentCoach } from "@/app/actions";

export default function CoachConnection({ coach = null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkedName, setLinkedName] = useState(null);
  const [showInput, setShowInput] = useState(false);

  function handleCodeChange(event) {
    const raw = event.target.value.toUpperCase();
    const clean = raw.replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (clean.length > 3) {
      setCode(`${clean.slice(0, 3)}-${clean.slice(3)}`);
    } else {
      setCode(clean);
    }
  }

  async function connect(event) {
    event.preventDefault();
    if (busy) return;
    setError("");

    const clean = code.replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 6) {
      setError("Ingresá un código válido de 6 caracteres (ej: ABC-123).");
      return;
    }

    setBusy(true);
    try {
      const formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
      const result = await redeemInvitationCode(formatted);
      setLinkedName(result.coachName);
      setCode("");
      setShowInput(false);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo vincular. Revisá el código e intentá otra vez.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await unlinkCurrentCoach();
      setLinkedName(null);
      setShowInput(true);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo desvincular el profesor.");
    } finally {
      setBusy(false);
    }
  }

  const isLinked = (coach || linkedName) && !showInput;

  if (isLinked) {
    return (
      <div className="d2-panel d2-form" id="vincular-profesor" role="status">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p className="d2-setting-name">Entrenás con {linkedName || coach.displayName || "tu entrenador"}</p>
            <p className="d2-setting-hint">Las rutinas que te asigne aparecen en Rutinas.</p>
          </div>
          <button
            type="button"
            onClick={handleUnlink}
            disabled={busy}
            className="d2-empty-action"
            style={{
              minHeight: "36px",
              padding: "4px 14px",
              fontSize: "12px",
              background: "transparent",
              border: "1px solid var(--d2-border)",
              color: "var(--d2-text-2)",
              boxShadow: "none",
              margin: 0,
              cursor: "pointer",
            }}
          >
            {busy ? "Desvinculando…" : "Cambiar profesor"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={connect} id="vincular-profesor" className="d2-panel d2-form" aria-label="Vincular entrenador">
      <p className="d2-setting-name">Entrená acompañado</p>
      <p className="d2-form-note">Ingresá el código de invitación de tu profesor para recibir sus rutinas.</p>
      <label className="d2-form-field">
        Código de invitación
        <input
          className="d2-input"
          value={code}
          onChange={handleCodeChange}
          placeholder="ABC-123"
          pattern="[A-Za-z0-9]{3}-[A-Za-z0-9]{3}"
          maxLength={7}
          required
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
        />
      </label>
      {error && <p className="d2-form-note" role="alert" style={{ color: "var(--d2-text)" }}>{error}</p>}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
        <button type="submit" disabled={busy} className="d2-form-save">
          {busy ? "Vinculando…" : "Vincular profesor"}
        </button>
        {coach && (
          <button
            type="button"
            onClick={() => setShowInput(false)}
            className="d2-empty-action"
            style={{
              minHeight: "44px",
              padding: "8px 16px",
              fontSize: "13px",
              background: "transparent",
              border: "1px solid var(--d2-border)",
              color: "var(--d2-text-2)",
              boxShadow: "none",
              margin: 0,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
