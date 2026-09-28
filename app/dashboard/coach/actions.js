"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { generateCode, revokeCode } from "@/lib/coach/codes";
import { isLinkedToCoach, removeStudent as removeStudentDb } from "@/lib/coach/students";
import { getUserRoutine } from "@/lib/routines/routines";
import {
  assignRoutineToStudent as assignDb,
  unassignRoutine as unassignDb,
} from "@/lib/assignments/assignments";

export async function generateInvitationCode() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const result = await generateCode(user.uid);
  revalidatePath("/");
  revalidatePath("/dashboard/coach");
  return result;
}

export async function revokeInvitationCode() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const revoked = await revokeCode(user.uid);
  revalidatePath("/");
  revalidatePath("/dashboard/coach");
  return { revoked };
}

export async function removeStudent(studentId) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  await removeStudentDb(user.uid, studentId);
  revalidatePath("/");
  revalidatePath("/dashboard/coach");
}

export async function assignRoutineToStudentAction({ studentId, routineId, weekNumber, note }) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  if (!studentId) {
    throw new Error("Falta el identificador del alumno.");
  }

  const routine = await getUserRoutine(user.uid, routineId);
  if (!routine) {
    throw new Error("Rutina no encontrada.");
  }

  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) {
    throw new Error("El alumno no está vinculado a tu cuenta.");
  }

  const assignmentId = await assignDb(user.uid, studentId, routine, {
    weekNumber: weekNumber != null && weekNumber !== "" ? Number(weekNumber) : null,
    note,
  });

  revalidatePath("/rutinas");
  revalidatePath("/dashboard/coach");
  revalidatePath(`/dashboard/coach/alumnos/${studentId}`);
  return assignmentId;
}

export async function unassignRoutineAction({ studentId, assignmentId }) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  await unassignDb(user.uid, assignmentId);

  revalidatePath("/rutinas");
  revalidatePath("/dashboard/coach");
  if (studentId) {
    revalidatePath(`/dashboard/coach/alumnos/${studentId}`);
  }
}