"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { importSharedRoutine } from "@/lib/sharing/sharedRoutines";

export async function importShared(id) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/r/${id}`)}`);
  const catalog = await listExercises();
  const routineId = await importSharedRoutine(user.uid, id, new Set(catalog.map((e) => e.id)));
  redirect(`/rutinas/${routineId}`);
}
