"use client";

import Image from "next/image";
import { useId } from "react";
import { CheckIcon, CheckRingIcon, ChevronDownIcon, WeightIcon } from "./Icons";

/** La celda de un valor prescrito. Vacío se muestra como raya, no como cero. */
function Cell({ value, unit = "" }) {
  if (value == null || value === "") {
    return <span className="d2-plan-cell d2-plan-cell-empty">—</span>;
  }
  return (
    <span className="d2-plan-cell">
      {value}
      {unit}
    </span>
  );
}

/** Lo prescrito, una fila por serie. Solo lectura. */
function Plan({ exercise }) {
  const repsLabel = exercise.timeBased ? "Tiempo" : "Reps";
  // La columna de RIR aparece solo si la rutina lo prescribió: una columna
  // entera de rayas ocupa lugar y no dice nada.
  const showRIR = exercise.sets.some((set) => set.rir != null);

  return (
    <div className="d2-plan">
      <p className="d2-plan-row">
        <span className="d2-plan-n" aria-hidden />
        <span className="d2-plan-head">{repsLabel}</span>
        {exercise.showWeight && <span className="d2-plan-head">Peso</span>}
        {showRIR && <span className="d2-plan-head">RIR</span>}
      </p>

      {exercise.sets.map((set) => (
        <div key={set.setNumber} className="d2-plan-row">
          <span className="d2-plan-n">{set.setNumber}</span>
          <Cell value={set.reps} unit={exercise.timeBased ? "s" : ""} />
          {exercise.showWeight && <Cell value={set.weight} unit=" kg" />}
          {showRIR && <Cell value={set.rir} />}
        </div>
      ))}
    </div>
  );
}

/**
 * La planilla del entrenamiento: lo prescrito como punto de partida, editable,
 * y un tilde por serie.
 *
 * El tilde es lo que hace que una serie cuente. Sin marcarla no entra en la
 * sesión: la planilla arranca con el plan, y guardar el plan sin confirmarlo
 * sería inventar un entrenamiento.
 */
function Log({ exercise, rows, onRowChange, onToggleDone, onAddSet, onDropSet, savingSet }) {
  const repsLabel = exercise.timeBased ? "Tiempo (s)" : "Reps";

  return (
    <>
      <div className="d2-log">
        <p className="d2-plan-row">
          <span className="d2-plan-n" aria-hidden />
          <span className="d2-plan-head">{repsLabel}</span>
          {exercise.showWeight && <span className="d2-plan-head">Peso (kg)</span>}
          <span className="d2-log-spacer" aria-hidden />
        </p>

        {rows.map((row, index) => {
          const saving = savingSet === index;

          return (
            <div
              key={index}
              className={row.done ? "d2-log-row d2-log-row-done" : "d2-log-row"}
            >
              <span className="d2-log-n">{index + 1}</span>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                placeholder="—"
                aria-label={`${repsLabel}, serie ${index + 1} de ${exercise.name}`}
                value={row.reps ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  onRowChange(index, { reps: raw === "" ? null : Number(raw) });
                }}
              />

              {exercise.showWeight && (
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  placeholder="—"
                  aria-label={`Peso en kilos, serie ${index + 1} de ${exercise.name}`}
                  value={row.weight ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    onRowChange(index, { weight: raw === "" ? null : Number(raw) });
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => onToggleDone(index)}
                disabled={saving}
                aria-pressed={row.done}
                aria-label={`Serie ${index + 1} hecha`}
                className={row.done ? "d2-log-check d2-log-check-on" : "d2-log-check"}
              >
                <CheckIcon size={15} width={2.2} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="d2-log-tools">
        <button type="button" onClick={onAddSet} className="d2-chip">
          Agregar serie
        </button>
        <button type="button" onClick={onDropSet} disabled={rows.length <= 1} className="d2-chip">
          Sacar la última
        </button>
      </div>
    </>
  );
}

/**
 * Un ejercicio de la rutina.
 *
 * Cerrado muestra el resumen de lo prescrito; abierto, las series. Mientras se
 * entrena, esas series pasan a ser la planilla donde se carga lo que se hizo.
 * Se abre de a uno, igual que al armar la rutina.
 */
export default function RoutineExercise({
  exercise,
  open,
  onToggle,
  running = false,
  rows = [],
  done = false,
  onRowChange,
  onToggleDone,
  onAddSet,
  onDropSet,
  savingSet = null,
}) {
  const detailId = useId();

  return (
    <div>
      <div className="d2-ex-head">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={detailId}
          className="d2-ex-toggle"
        >
          <span className="d2-ex-thumb">
            {exercise.mediaUrl ? (
              <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
            ) : (
              <WeightIcon size={22} width={1.5} />
            )}
          </span>

          <span className="d2-ex-body">
            <span className="d2-ex-name">{exercise.name}</span>
            <span className="d2-ex-muscle">{exercise.muscle}</span>
          </span>

          {done ? (
            <span className="d2-ex-check" role="img" aria-label="Ejercicio terminado">
              <CheckRingIcon size={18} width={1.7} />
            </span>
          ) : (
            <span className="d2-ex-summary">{exercise.summary}</span>
          )}

          <ChevronDownIcon size={15} width={1.8} className="d2-ex-chevron" />
        </button>
      </div>

      {open && (
        <div id={detailId} className="d2-ex-detail">
          {running ? (
            <Log
              exercise={exercise}
              rows={rows}
              onRowChange={onRowChange}
              onToggleDone={onToggleDone}
              onAddSet={onAddSet}
              onDropSet={onDropSet}
              savingSet={savingSet}
            />
          ) : (
            <>
              <Plan exercise={exercise} />
              {(exercise.equipment || exercise.techniqueNote) && (
                <p className="d2-ex-meta">
                  {exercise.equipment}
                  {exercise.equipment && exercise.techniqueNote ? " · " : ""}
                  {exercise.techniqueNote}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
