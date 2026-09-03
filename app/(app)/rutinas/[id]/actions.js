"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserRoutine } from "@/lib/routines/routines";
import { isLinkedToCoach } from "@/lib/coach/students";
import {
  assignRoutineToStudent as assignDb,
  unassignRoutine as unassignDb,
  logExerciseSet as logExerciseSetDb,
} from "@/lib/assignments/assignments";

export async function assignRoutine(routineId, studentId) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  const routine = await getUserRoutine(user.uid, routineId);
  if (!routine) throw new Error("Rutina no encontrada.");

  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) throw new Error("El alumno no está vinculado a tu cuenta.");

  const assignmentId = await assignDb(user.uid, studentId, routine);
  revalidatePath("/rutinas");
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
