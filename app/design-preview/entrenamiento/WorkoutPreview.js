"use client";

import { useState } from "react";
import RoutineExercise from "@/components/design2/RoutineExercise";
import StopwatchSheet from "@/components/design2/StopwatchSheet";

/**
 * La planilla del entrenamiento con datos de ejemplo, para revisar a mano y
 * en evaluaciones las mejoras de entrenamiento sin una cuenta: notas, video,
 * botones grandes, bloques con color y el cronómetro.
 */
const EXERCISES = [
  {
    position: 0,
    exerciseId: "sentadilla",
    name: "Sentadilla con barra",
    muscle: "Cuádriceps",
    summary: "3 × 8",
    showWeight: true,
    group: "Fuerza",
    groupColor: "amber",
    videoUrl: "https://www.youtube.com/watch?v=SZC3B7vEjV0",
    techniqueNote: "Bajar en 3 segundos, pausa abajo.",
    lastNote: { note: "Subir 2,5 kg la próxima.", finishedAt: "2026-09-28T10:00:00Z" },
    description: "Pies al ancho de hombros, espalda neutra, rodillas siguiendo la punta de los pies.",
  },
  {
    position: 1,
    exerciseId: "plancha",
    name: "Plancha",
    muscle: "Core",
    summary: "3 × 45 s",
    timeBased: true,
    showWeight: false,
    group: "Core propio",
    groupColor: "#ff3201",
  },
];

const START = {
  0: [
    { reps: 8, weight: 80, done: true },
    { reps: 8, weight: 80, done: true },
    { reps: 8, weight: 82.5, done: false },
  ],
  1: [
    { reps: 45, done: true },
    { reps: null, done: false },
    { reps: null, done: false },
  ],
};

export default function WorkoutPreview({ stopwatch }) {
  const [sheet, setSheet] = useState(START);
  const [notes, setNotes] = useState({ 0: "" });
  const [open, setOpen] = useState({ 0: true, 1: true });

  const update = (position, index, patch) =>
    setSheet((current) => ({
      ...current,
      [position]: current[position].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));

  return (
    <div className="d2-panel" style={{ margin: "16px" }}>
      {EXERCISES.map((exercise) => (
        <RoutineExercise
          key={exercise.position}
          exercise={exercise}
          open={open[exercise.position]}
          onToggle={() => setOpen((o) => ({ ...o, [exercise.position]: !o[exercise.position] }))}
          running
          rows={sheet[exercise.position]}
          onRowChange={(index, patch) => update(exercise.position, index, patch)}
          onToggleDone={(index) => update(exercise.position, index, { done: !sheet[exercise.position][index].done })}
          onAddSet={() => {}}
          onDropSet={() => {}}
          note={notes[exercise.position] || ""}
          onNoteChange={(value) => setNotes((n) => ({ ...n, [exercise.position]: value }))}
        />
      ))}
      {stopwatch && (
        <StopwatchSheet
          exerciseName="Plancha"
          setNumber={2}
          targetSeconds={45}
          currentSeconds={null}
          onSave={() => {}}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
