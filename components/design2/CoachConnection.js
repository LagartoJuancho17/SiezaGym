"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemInvitationCode } from "@/app/actions";

export default function CoachConnection({ coach = null }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkedName, setLinkedName] = useState(null);

  async function connect(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await redeemInvitationCode(code.trim().toUpperCase());
      setLinkedName(result.coachName);
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo vincular. Revisá el código e intentá otra vez.");
    } finally {
      setBusy(false);
    }
  }

  if (coach || linkedName) return (
    <div className="d2-panel d2-form" role="status">
      <p className="d2-setting-name">Entrenás con {linkedName || coach.displayName || "tu entrenador"}</p>
      <p className="d2-setting-hint">Las rutinas que te asigne aparecen en Rutinas.</p>
    </div>
  );

  return (
    <form onSubmit={connect} className="d2-panel d2-form" aria-label="Vincular entrenador">
      <p className="d2-setting-name">Entrená acompañado</p>
      <p className="d2-form-note">Ingresá el código de invitación de tu profesor para recibir sus rutinas.</p>
      <label className="d2-form-field">
        Código de invitación
        <input className="d2-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABC-123" pattern="[A-Za-z0-9]{3}-[A-Za-z0-9]{3}" maxLength={7} required
          autoCapitalize="characters" autoComplete="off" spellCheck={false} disabled={busy} />
      </label>
      {error && <p className="d2-form-note" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="d2-form-save">{busy ? "Vinculando…" : "Vincular profesor"}</button>
    </form>
  );
}
