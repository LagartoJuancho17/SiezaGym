"use client";

import Image from "next/image";
import "./routine-technique.css";
import { useId, useState } from "react";
import { CheckIcon, CheckRingIcon, ChevronDownIcon, CloseIcon, PlayIcon, WeightIcon } from "./Icons";
import { playSetCompleteSound, triggerHaptic } from "@/lib/audio/workoutSound";

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
 * botones de ajuste de peso cómodos, y un tilde por serie con feedback auditivo y háptico.
 */
function Log({
  exercise,
  rows,
  onRowChange,
  onToggleDone,
  onAddSet,
  onDropSet,
  savingSet,
  allowFailed,
  onShowMedia,
}) {
  const repsLabel = exercise.timeBased ? "Tiempo (s)" : "Reps";

  return (
    <>
      <div className="d2-log">
        <div className="d2-log-header-tools">
          <p className="d2-plan-row d2-log-labels">
            <span className="d2-plan-n" aria-hidden />
            <span className="d2-plan-head">{repsLabel}</span>
            {exercise.showWeight && <span className="d2-plan-head">Peso (kg)</span>}
            <span className="d2-log-spacer" aria-hidden />
          </p>

          {exercise.mediaUrl && (
            <button
              type="button"
              onClick={onShowMedia}
              className="d2-media-btn"
              aria-label={`Ver técnica animada de ${exercise.name}`}
            >
              <PlayIcon size={12} width={1.8} />
              <span>Ver GIF</span>
            </button>
          )}
        </div>

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
                <div className="d2-weight-stepper">
                  <button
                    type="button"
                    className="d2-stepper-btn"
                    aria-label={`Bajar 2.5 kg en serie ${index + 1}`}
                    onClick={() => {
                      const cur = Number(row.weight || 0);
                      const next = Math.max(0, Math.round((cur - 2.5) * 10) / 10);
                      onRowChange(index, { weight: next === 0 && row.weight == null ? null : next });
                    }}
                  >
                    -
                  </button>
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
                  <button
                    type="button"
                    className="d2-stepper-btn"
                    aria-label={`Subir 2.5 kg en serie ${index + 1}`}
                    onClick={() => {
                      const cur = Number(row.weight || 0);
                      const next = Math.round((cur + 2.5) * 10) / 10;
                      onRowChange(index, { weight: next });
                    }}
                  >
                    +
                  </button>
                </div>
              )}

              {allowFailed && (
                <button
                  type="button"
                  className="d2-log-failed"
                  aria-pressed={!!row.failed}
                  aria-label={`Serie ${index + 1} fallada de ${exercise.name}`}
                  onClick={() => onRowChange(index, { failed: !row.failed })}
                >
                  {row.failed ? "Fallada" : "Fallo"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!row.done) {
                    playSetCompleteSound();
                    triggerHaptic();
                  }
                  onToggleDone(index);
                }}
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
  allowFailed = true,
}) {
  const detailId = useId();
  const [showMediaModal, setShowMediaModal] = useState(false);

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
          <span
            className="d2-ex-thumb"
            onClick={(e) => {
              if (exercise.mediaUrl) {
                e.stopPropagation();
                setShowMediaModal(true);
              }
            }}
            title={exercise.mediaUrl ? "Tocar para ampliar GIF de técnica" : undefined}
          >
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

          {exercise.group && (
            <span className={`d2-group-pill d2-grp-${exercise.groupColor || "teal"}`} title={`Grupo: ${exercise.group}`}>
              <span className="d2-group-dot" />
              <span>{exercise.group}</span>
            </span>
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
              allowFailed={allowFailed}
              onShowMedia={() => setShowMediaModal(true)}
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
          <details className="d2-technique">
            <summary>Ver técnica</summary>
            {exercise.mediaUrl && (
              <Image src={exercise.mediaUrl} alt={`Técnica de ${exercise.name}`} width={300} height={300} unoptimized className="d2-technique-image" />
            )}
            <p>{exercise.description || "Todavía no hay una descripción de técnica para este ejercicio."}</p>
            {exercise.techniqueNote && <p><strong>Nota de la rutina:</strong> {exercise.techniqueNote}</p>}
            {exercise.mediaUrl && <p className="d2-technique-credit">Animación © <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">Gym visual</a></p>}
          </details>
        </div>
      )}

      {/* Modal flotante para ver GIF/video durante el entrenamiento */}
      {showMediaModal && exercise.mediaUrl && (
        <div className="d2-modal" onClick={() => setShowMediaModal(false)}>
          <div
            className="d2-glass-strong d2-modal-card d2-media-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d2-media-modal-head">
              <div>
                <h3 className="d2-media-modal-title">{exercise.name}</h3>
                <span className="d2-ex-muscle">{exercise.muscle}</span>
              </div>
              <button
                type="button"
                className="d2-media-close"
                onClick={() => setShowMediaModal(false)}
                aria-label="Cerrar demostración"
              >
                <CloseIcon size={18} width={2} />
              </button>
            </div>

            <div className="d2-media-modal-body">
              <div className="d2-media-modal-thumb">
                <Image
                  src={exercise.mediaUrl}
                  alt={`Demostración animada de ${exercise.name}`}
                  width={340}
                  height={340}
                  unoptimized
                  className="d2-media-modal-gif"
                />
              </div>

              {exercise.description && (
                <p className="d2-media-modal-desc">{exercise.description}</p>
              )}
              {exercise.techniqueNote && (
                <p className="d2-media-modal-note">
                  <strong>Nota del ejercicio:</strong> {exercise.techniqueNote}
                </p>
              )}
              <p className="d2-technique-credit">
                Animación ©{" "}
                <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
                  Gym visual
                </a>
              </p>
            </div>

            <div className="d2-modal-actions">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="d2-modal-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

