"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { createSession } from "@/lib/sessions/sessions";

export async function finishSession(data) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const result = await createSession(user.uid, data);

  revalidatePath("/");
  revalidatePath("/progreso");
  revalidatePath("/historial");
  if (data.exercises) {
    for (const exercise of data.exercises) {
      revalidatePath(`/progreso/${exercise.exerciseId}`);
    }
  }

  return result;
}
