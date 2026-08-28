"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  createRoutine as createRoutineData,
  updateRoutine as updateRoutineData,
  deleteRoutine as deleteRoutineData,
  duplicateRoutine as duplicateRoutineData,
} from "@/lib/routines/routines";
import { createCustomExercise as createCustomExerciseData } from "@/lib/customExercises/customExercises";

export async function createRoutine(formPayload) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = await createRoutineData(user.uid, formPayload);
  revalidatePath("/rutinas");
  return id;
}

export async function updateRoutine(routineId, formPayload) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await updateRoutineData(user.uid, routineId, formPayload);
  revalidatePath("/rutinas");
  revalidatePath(`/rutinas/${routineId}`);
}

export async function deleteRoutine(routineId) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await deleteRoutineData(user.uid, routineId);
  revalidatePath("/rutinas");
  redirect("/rutinas");
}

export async function duplicateRoutine(routineId) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await duplicateRoutineData(user.uid, routineId);
  revalidatePath("/rutinas");
}

export async function createCustomExercise(data) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = await createCustomExerciseData(user.uid, data);
  return id;
}
