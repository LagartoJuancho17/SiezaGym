"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteRoutine, duplicateRoutine, setRoutineShowOnHome } from "@/app/(app)/rutinas/actions";

export default function RoutineListItem({ routine, sets, minutes, muscleLabels, isAssigned = false }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnHome, setShowOnHome] = useState(routine.showOnHome !== false);
  const [isPending, startTransition] = useTransition();

  function handleToggleShowOnHome() {
    const next = !showOnHome;
    setShowOnHome(next);
    setMenuOpen(false);
    startTransition(() => setRoutineShowOnHome(routine.id, next));
  }

  return (
    <div className="relative rounded-2xl border border-hair bg-glass p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/rutinas/${routine.id}`} className="block min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-1.5 text-base font-semibold text-text">
            <span className="truncate">{routine.name}</span>
            {isAssigned && (
              <span className="shrink-0 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal2">
                Asignada
              </span>
            )}
            {!isAssigned &&
              (showOnHome ? (
                <span className="shrink-0 rounded-full border border-teal2/40 bg-teal2/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal2">
                  En inicio
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-hair px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Oculta del inicio
                </span>
              ))}
          </h3>
          <p className="mt-1 text-xs text-faint">
            {routine.exercises.length} ejercicios · {sets} series · ~{minutes} min
          </p>
          {muscleLabels.length ? (
            <p className="mt-1.5 truncate text-xs text-muted">{muscleLabels.join(" · ")}</p>
          ) : null}
        </Link>

        {!isAssigned && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Más opciones"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-hair text-text transition hover:border-teal2"
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-2xl border border-hair bg-deep shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setMenuOpen(false);
                      startTransition(() => duplicateRoutine(routine.id));
                    }}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-text transition hover:bg-glass2 disabled:opacity-40"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleToggleShowOnHome}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-text transition hover:bg-glass2 disabled:opacity-40"
                  >
                    {showOnHome ? "Quitar del inicio" : "Agregar a inicio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingDelete(true);
                    }}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-destructive transition hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {confirmingDelete && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2.5">
          <span className="flex-1 text-xs text-text">¿Eliminar &quot;{routine.name}&quot;?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteRoutine(routine.id))}
            className="h-8 shrink-0 rounded-full border border-destructive/50 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
          >
            Sí, eliminar
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="h-8 shrink-0 rounded-full px-2 text-xs font-medium text-faint transition hover:text-text"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
