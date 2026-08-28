"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteRoutine, duplicateRoutine } from "@/app/rutinas/actions";

export default function RoutineListItem({ routine, sets, minutes, muscleLabels }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-hair bg-glass p-4">
      <Link href={`/rutinas/${routine.id}`} className="block">
        <h3 className="text-base font-semibold text-text">{routine.name}</h3>
        <p className="mt-1 text-xs text-faint">
          {routine.exercises.length} ejercicios · {sets} series · ~{minutes} min
        </p>
        {muscleLabels.length ? (
          <p className="mt-1.5 truncate text-xs text-muted">{muscleLabels.join(" · ")}</p>
        ) : null}
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => duplicateRoutine(routine.id))}
          className="h-8 rounded-full border border-hair px-3 text-xs font-medium text-muted transition hover:border-teal2 hover:text-text disabled:opacity-40"
        >
          Duplicar
        </button>

        {confirmingDelete ? (
          <>
            <span className="text-xs text-faint">¿Eliminar?</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => deleteRoutine(routine.id))}
              className="h-8 rounded-full border border-destructive/50 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
            >
              Sí, eliminar
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="h-8 rounded-full px-2 text-xs font-medium text-faint transition hover:text-text"
            >
              No
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="h-8 rounded-full border border-hair px-3 text-xs font-medium text-muted transition hover:border-destructive hover:text-destructive"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
