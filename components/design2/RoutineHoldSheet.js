"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteRoutine,
  duplicateRoutine,
  setRoutineShowOnHome,
} from "@/app/(app)/rutinas/actions";
import { routineMenuActions } from "@/lib/routines/menu";

/**
 * Lo que se puede hacer con una rutina sin entrar a ella.
 *
 * Se abre manteniéndola presionada en la lista. Sube desde abajo y no aparece
 * flotando donde está el dedo: en un teléfono el pulgar tapa justo el lugar
 * donde quedaría el menú.
 *
 * Eliminar pide confirmación en esta misma hoja en vez de abrir otra encima:
 * dos capas de superposición sobre una lista se vuelven imposibles de seguir.
 */
export default function RoutineHoldSheet({ routine, onClose }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(work, { keepOpen = false } = {}) {
    setBusy(true);
    setError("");
    try {
      await work();
      if (!keepOpen) onClose();
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo hacer.");
      setBusy(false);
    }
  }

  const actions = routineMenuActions(routine);

  function handle(id) {
    if (id === "portada") {
      return run(() => setRoutineShowOnHome(routine.id, !routine.showOnHome));
    }
    if (id === "duplicar") return run(() => duplicateRoutine(routine.id));
    if (id === "eliminar") return setConfirming(true);
    return undefined;
  }

  return (
    <div
      className="d2-scrim"
      // Cierra con el dedo que baja y no con el click. La pulsación que abrió
      // la hoja deja colgando un pointerup y un click sobre este fondo, que
      // todavía no existía cuando el dedo bajó: escuchando el click, la hoja
      // se cerraría sola apenas se levanta el dedo.
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="d2-glass-strong d2-holdsheet" role="dialog" aria-label={routine.name}>
        <p className="d2-holdsheet-title">{routine.name}</p>

        {confirming ? (
          <>
            <p className="d2-holdsheet-meta">
              No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en el historial.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deleteRoutine(routine.id), { keepOpen: true })}
              className="d2-holdsheet-action d2-holdsheet-danger"
            >
              {busy ? "Eliminando…" : "Sí, eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="d2-holdsheet-cancel"
            >
              Volver
            </button>
          </>
        ) : (
          <>
            {actions.map((action) =>
              action.id === "editar" ? (
                <Link
                  key={action.id}
                  href={`/rutinas/${routine.id}/editar`}
                  className="d2-holdsheet-action"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handle(action.id)}
                  className={
                    action.danger
                      ? "d2-holdsheet-action d2-holdsheet-danger"
                      : "d2-holdsheet-action"
                  }
                >
                  {action.label}
                </button>
              ),
            )}
            <button type="button" onClick={onClose} className="d2-holdsheet-cancel">
              Cancelar
            </button>
          </>
        )}

        {error && <p className="d2-holdsheet-meta">{error}</p>}
      </div>
    </div>
  );
}
