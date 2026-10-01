"use client";

import Image from "next/image";
import "./routine-technique.css";
import { useId, useState } from "react";
import {
  CheckIcon,
  CheckRingIcon,
  ChevronDownIcon,
  CloseIcon,
  NoteIcon,
  PlayIcon,
  StopwatchIcon,
  WeightIcon,
} from "./Icons";
import { playSetFeedback } from "@/lib/audio/workoutSound";
import { completesExercise } from "@/lib/routines/workout";
import { groupTone } from "@/lib/routines/groupColors";
import { EXERCISE_NOTE_MAX } from "@/lib/sessions/notes";
import StopwatchSheet from "./StopwatchSheet";
import VideoEmbed from "./VideoEmbed";
import ModalPortal from "./ModalPortal";

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
 * Lo que dejó escrito la rutina y lo que anotaste la última vez, arriba de la
 * planilla: es lo primero que hay que leer antes de la primera serie.
 */
function Notes({ techniqueNote, lastNote }) {
  if (!techniqueNote && !lastNote) return null;
  return (
    <div className="d2-ex-notes">
      {techniqueNote && (
        <p className="d2-ex-note d2-ex-note-plan">
          <span className="d2-ex-note-tag">Nota de la rutina</span>
          {techniqueNote}
        </p>
      )}
      {lastNote && (
        <p className="d2-ex-note d2-ex-note-last">
          <span className="d2-ex-note-tag">La última vez anotaste</span>
          {lastNote.note}
        </p>
      )}
    </div>
  );
}

/** La nota de hoy: se abre con un toque y queda abierta si ya tiene texto. */
function WorkoutNote({ exerciseName, note, onNoteChange }) {
  const [editing, setEditing] = useState(false);
  const id = useId();

  if (!editing && !note) {
    return (
      <button type="button" className="d2-chip d2-note-add" onClick={() => setEditing(true)}>
        <NoteIcon size={16} width={1.7} />
        Agregar nota
      </button>
    );
  }

  return (
    <div className="d2-note-field">
      <label htmlFor={id}>Nota de hoy</label>
      <textarea
        id={id}
        className="d2-input d2-textarea"
        value={note || ""}
        maxLength={EXERCISE_NOTE_MAX}
        rows={2}
        autoFocus={editing && !note}
        placeholder="Cómo salió, qué cambiar la próxima…"
        aria-label={`Nota de hoy para ${exerciseName}`}
        onChange={(event) => onNoteChange(event.target.value)}
      />
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
  note,
  onNoteChange,
}) {
  const repsLabel = exercise.timeBased ? "Tiempo (s)" : "Reps";
  const [timing, setTiming] = useState(null); // índice de la serie con el cronómetro abierto

  function toggle(index) {
    if (!rows[index].done) {
      playSetFeedback({ completesExercise: completesExercise(rows, index) });
    }
    onToggleDone(index);
  }

  return (
    <>
      <Notes techniqueNote={exercise.techniqueNote} lastNote={exercise.lastNote} />

      <div className="d2-log">
        <div className="d2-log-header-tools">
          <p className="d2-plan-row d2-log-labels">
            <span className="d2-plan-n" aria-hidden />
            <span className="d2-plan-head">{repsLabel}</span>
            {exercise.showWeight && <span className="d2-plan-head">Peso (kg)</span>}
            <span className="d2-log-spacer" aria-hidden />
          </p>

          {(exercise.mediaUrl || exercise.videoUrl) && (
            <button
              type="button"
              onClick={onShowMedia}
              className="d2-media-btn"
              aria-label={
                exercise.videoUrl ? `Ver video de ${exercise.name}` : `Ver técnica animada de ${exercise.name}`
              }
            >
              <PlayIcon size={13} width={1.8} />
              <span>{exercise.videoUrl ? "Ver video" : "Ver GIF"}</span>
            </button>
          )}
        </div>

        {rows.map((row, index) => {
          const saving = savingSet === index;

          return (
            <div key={index} className={row.done ? "d2-log-row d2-log-row-done" : "d2-log-row"}>
              <span className="d2-log-n">{index + 1}</span>

              {exercise.timeBased ? (
                <button
                  type="button"
                  className="d2-log-time"
                  onClick={() => setTiming(index)}
                  aria-label={`Tiempo, serie ${index + 1} de ${exercise.name}: ${
                    row.reps ? `${row.reps} segundos` : "sin cargar"
                  }. Abrir cronómetro`}
                >
                  <StopwatchIcon size={17} width={1.7} />
                  <span>{row.reps ? `${row.reps} s` : "—"}</span>
                </button>
              ) : (
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
              )}

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
                    −
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
                onClick={() => toggle(index)}
                disabled={saving}
                aria-pressed={row.done}
                aria-label={`Serie ${index + 1} hecha`}
                className={row.done ? "d2-log-check d2-log-check-on" : "d2-log-check"}
              >
                <CheckIcon size={18} width={2.4} />
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

      {onNoteChange && <WorkoutNote exerciseName={exercise.name} note={note} onNoteChange={onNoteChange} />}

      {timing != null && rows[timing] && (
        <StopwatchSheet
          exerciseName={exercise.name}
          setNumber={timing + 1}
          targetSeconds={targetFor(exercise, timing)}
          currentSeconds={rows[timing].reps}
          onClose={() => setTiming(null)}
          onSave={(seconds, { markDone }) => {
            const index = timing;
            onRowChange(index, { reps: seconds });
            setTiming(null);
            if (markDone && !rows[index].done) toggle(index);
          }}
        />
      )}
    </>
  );
}

/**
 * El tiempo prescrito de una serie. Una serie agregada entrenando no tiene
 * prescripción propia: toma la de la última prescrita, igual que appendSet
 * copia la última fila.
 */
function targetFor(exercise, index) {
  const sets = exercise.sets || [];
  return sets[index]?.reps ?? sets[sets.length - 1]?.reps ?? null;
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
  note = "",
  onNoteChange,
}) {
  const detailId = useId();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const hasMedia = Boolean(exercise.mediaUrl || exercise.videoUrl);
  const tone = exercise.group ? groupTone(exercise.groupColor) : null;

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
              if (hasMedia) {
                e.stopPropagation();
                setShowMediaModal(true);
              }
            }}
            title={
              exercise.videoUrl
                ? "Tocar para ver el video"
                : exercise.mediaUrl
                  ? "Tocar para ampliar GIF de técnica"
                  : undefined
            }
          >
            {exercise.mediaUrl ? (
              <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
            ) : (
              <WeightIcon size={22} width={1.5} />
            )}
            {exercise.videoUrl && (
              <span className="d2-ex-thumb-play" aria-hidden>
                <PlayIcon size={12} width={2} />
              </span>
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

          {tone && (
            <span className={`d2-group-pill ${tone.className}`} style={tone.style} title={`Grupo: ${exercise.group}`}>
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
              note={note}
              onNoteChange={onNoteChange}
            />
          ) : (
            <>
              <Plan exercise={exercise} />
              {exercise.equipment && <p className="d2-ex-meta">{exercise.equipment}</p>}
              <Notes techniqueNote={exercise.techniqueNote} lastNote={exercise.lastNote} />
            </>
          )}
          <details className="d2-technique">
            <summary>{exercise.videoUrl ? "Ver técnica y video" : "Ver técnica"}</summary>
            {exercise.videoUrl ? (
              <VideoEmbed
                url={exercise.videoUrl}
                title={`Video de técnica de ${exercise.name}`}
                className="d2-technique-video"
              />
            ) : (
              exercise.mediaUrl && (
                <Image
                  src={exercise.mediaUrl}
                  alt={`Técnica de ${exercise.name}`}
                  width={300}
                  height={300}
                  unoptimized
                  className="d2-technique-image"
                />
              )
            )}
            <p>{exercise.description || "Todavía no hay una descripción de técnica para este ejercicio."}</p>
            <Credit exercise={exercise} />
          </details>
        </div>
      )}

      {/* Modal flotante para ver el GIF o el video durante el entrenamiento */}
      {showMediaModal && hasMedia && (
        <ModalPortal>
        <div className="d2-modal" onClick={() => setShowMediaModal(false)}>
          <div className="d2-glass-strong d2-modal-card d2-media-modal-card" onClick={(e) => e.stopPropagation()}>
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
              {exercise.videoUrl ? (
                <VideoEmbed url={exercise.videoUrl} title={`Demostración de ${exercise.name}`} />
              ) : (
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
              )}

              {exercise.description && <p className="d2-media-modal-desc">{exercise.description}</p>}
              {exercise.techniqueNote && (
                <p className="d2-media-modal-note">
                  <strong>Nota de la rutina:</strong> {exercise.techniqueNote}
                </p>
              )}
              <Credit exercise={exercise} />
            </div>

            <div className="d2-modal-actions">
              <button type="button" onClick={() => setShowMediaModal(false)} className="d2-modal-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

/** De quién es lo que se ve: el video es de YouTube, el GIF de Gym visual. */
function Credit({ exercise }) {
  if (exercise.videoUrl) {
    return (
      <p className="d2-technique-credit">
        Video de{" "}
        <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
          YouTube
        </a>
      </p>
    );
  }
  if (!exercise.mediaUrl) return null;
  return (
    <p className="d2-technique-credit">
      Animación ©{" "}
      <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
        Gym visual
      </a>
    </p>
  );
}
