"use client";

import CoachPageShell from "@/components/coach/CoachPageShell";

export default function CoachError({ reset }) {
  return (
    <CoachPageShell title="Panel del entrenador" backHref="/" backLabel="Volver al inicio">
      <section className="d2-coach-panel d2-coach-error-state" role="alert">
        <h2>No pudimos cargar el panel</h2>
        <p>Revisá tu conexión e intentá de nuevo. Tus datos no se modificaron.</p>
        <button type="button" className="d2-coach-primary-action" onClick={reset}>Reintentar</button>
      </section>
    </CoachPageShell>
  );
}
