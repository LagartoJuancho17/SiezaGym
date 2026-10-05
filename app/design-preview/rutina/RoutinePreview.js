"use client";

import RoutineScreen from "@/components/design2/RoutineScreen";
import { liveExercise } from "@/lib/routines/liveExercise";

/**
 * El detalle de una rutina con datos de ejemplo, para revisar sin cuenta el
 * entrenamiento, "Agregar ejercicio" y el menú. El catálogo del selector es
 * local: no pide nada al servidor.
 */
const CATALOG = [
  { id: "press-de-banca-con-barra", nameEs: "Press de banca con barra", registrationType: "peso_reps", equipment: "barra", muscleWeights: { pecho: 0.6, triceps: 0.25, deltoideAnterior: 0.15 } },
  { id: "dominadas", nameEs: "Dominadas", registrationType: "reps", equipment: "peso_corporal", muscleWeights: { dorsal: 0.7, biceps: 0.3 } },
  { id: "prensa-de-piernas", nameEs: "Prensa de piernas", registrationType: "peso_reps", equipment: "maquina", muscleWeights: { cuadriceps: 0.7, gluteo: 0.3 } },
  { id: "plancha-abdominal", nameEs: "Plancha abdominal", registrationType: "tiempo", equipment: "peso_corporal", muscleWeights: { abdomen: 1 } },
];

const ROUTINE = {
  id: "preview",
  name: "Upper body",
  note: "",
  isAssigned: false,
  assignmentId: null,
  readOnly: false,
  weekNumber: null,
  weekLabel: null,
  showOnHome: true,
  students: [],
  exercises: [
    { ...liveExercise(CATALOG[0], 0), live: false, group: "Fuerza", groupColor: "amber", summary: "4 × 6" },
    { ...liveExercise(CATALOG[1], 1), live: false, group: "Fuerza", groupColor: "amber" },
  ],
  totalSets: 6,
  estimatedMinutes: 15,
  muscles: [],
  hasMedia: false,
};

export default function RoutinePreview() {
  return <RoutineScreen routine={ROUTINE} loadExercises={async () => CATALOG} />;
}
