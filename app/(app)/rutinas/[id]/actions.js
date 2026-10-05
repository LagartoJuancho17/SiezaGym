"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserRoutine, markRoutineUsed } from "@/lib/routines/routines";
import { getAssignment } from "@/lib/assignments/assignments";
import { listExercises } from "@/lib/exercises/exercises";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { getUserProfile } from "@/lib/users/users";
import { shareRoutine, shareUrl } from "@/lib/sharing/sharedRoutines";
import { createSession } from "@/lib/sessions/sessions";
import { isLinkedToCoach } from "@/lib/coach/students";
import {
  assignRoutineToStudent as assignDb,
  unassignRoutine as unassignDb,
  logExerciseSet as logExerciseSetDb,
  completeAssignmentSession as completeAssignmentSessionDb,
} from "@/lib/assignments/assignments";

export async function assignRoutine(routineId, studentId, options = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  const routine = await getUserRoutine(user.uid, routineId);
  if (!routine) throw new Error("Rutina no encontrada.");

  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) throw new Error("El alumno no está vinculado a tu cuenta.");

  const opts =
    typeof options === "number"
      ? { weekNumber: options }
      : options || {};

  const assignmentId = await assignDb(user.uid, studentId, routine, opts);
  revalidatePath("/rutinas");
  revalidatePath("/dashboard/coach");
  revalidatePath(`/dashboard/coach/alumnos/${studentId}`);
  return assignmentId;
}

export async function unassignRoutine(assignmentId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  await unassignDb(user.uid, assignmentId);
  revalidatePath("/rutinas");
}

export async function logExerciseSet(assignmentId, exerciseIndex, setIndex, setData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  await logExerciseSetDb(user.uid, assignmentId, exerciseIndex, setIndex, setData);
  revalidatePath("/rutinas");
}

/**
 * Cierra un entrenamiento de una rutina propia.
 *
 * Guarda la sesión (la fuente de verdad de /historial, /progreso, el volumen
 * semanal y la racha) y marca la rutina como usada, para que suba en la lista.
 * Devuelve los totales que calculó el servidor: la pantalla muestra esos y no
 * una cuenta propia.
 */
export async function finishRoutineWorkout({ routineId, routineName, durationSeconds, exercises }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  const routine = await getUserRoutine(user.uid, routineId);
  if (!routine) throw new Error("Rutina no encontrada.");

  const result = await createSession(user.uid, {
    source: { type: "routine", routineId },
    routineName: routineName || routine.name,
    durationSeconds,
    exercises,
  });

  await markRoutineUsed(user.uid, routineId);

  revalidatePath("/");
  revalidatePath("/rutinas");
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath("/historial");
  revalidatePath("/progreso");
  for (const exercise of exercises || []) {
    revalidatePath(`/progreso/${exercise.exerciseId}`);
  }

  return result;
}

/**
 * Cierra un entrenamiento de una rutina asignada por el entrenador.
 *
 * Acá las series ya se fueron guardando de a una en la asignación (para que el
 * entrenador las vea mientras el alumno entrena), así que la sesión la arma
 * completeAssignmentSession con lo que quedó registrado y no con lo que manda
 * el navegador.
 */
export async function finishAssignmentWorkout({ assignmentId, durationSeconds, notes = {}, liveExercises = [] }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  const result = await completeAssignmentSessionDb(user.uid, assignmentId, durationSeconds, notes, liveExercises);

  revalidatePath("/");
  revalidatePath("/rutinas");
  revalidatePath(`/rutinas/${assignmentId}`);
  revalidatePath("/historial");
  revalidatePath("/progreso");
  revalidatePath("/dashboard/coach");

  return result;
}

/**
 * El link para compartir una rutina (la misma que comparte la app). Sirve
 * para las propias y para las que te asignó el coach; nunca para la de otro.
 */
export async function shareRoutineLink({ routineId, isAssigned }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  let source = null;
  if (isAssigned) {
    const assignment = await getAssignment(routineId);
    if (assignment && assignment.studentId === user.uid) {
      source = { name: assignment.routineName, note: assignment.note, exercises: assignment.exercises };
    }
  } else {
    source = await getUserRoutine(user.uid, routineId);
  }
  if (!source) throw new Error("Rutina no encontrada.");

  const [catalog, custom, profile] = await Promise.all([
    listExercises(),
    listCustomExercises(user.uid),
    getUserProfile(user.uid),
  ]);
  const names = Object.fromEntries([...catalog, ...custom].map((exercise) => [exercise.id, exercise.nameEs]));
  const id = await shareRoutine(
    { uid: user.uid, displayName: profile?.displayName },
    { sourceId: routineId, name: source.name, note: source.note, exercises: source.exercises, exerciseNames: names },
  );
  return shareUrl(id);
}

/**
 * El catálogo (y los ejercicios propios) para "Agregar ejercicio" entrenando.
 * Se pide recién al tocar el botón: el detalle de la rutina no carga el
 * catálogo entero de entrada.
 */
export async function pickerExercises() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const [catalog, custom] = await Promise.all([listExercises(), listCustomExercises(user.uid)]);
  return [...catalog, ...custom].map((exercise) => ({
    id: exercise.id,
    nameEs: exercise.nameEs,
    nameEn: exercise.nameEn,
    equipment: exercise.equipment || "peso_corporal",
    mediaUrl: exercise.mediaUrl || null,
    videoUrl: exercise.videoUrl || null,
    muscleWeights: exercise.muscleWeights || {},
    registrationType: exercise.registrationType,
    source: exercise.source,
  }));
}
