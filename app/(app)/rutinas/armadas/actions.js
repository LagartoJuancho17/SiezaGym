"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { listExercises } from "@/lib/exercises/exercises";
import { createRoutine } from "@/lib/routines/routines";
import { getTemplate, templateRoutineInput } from "@/lib/routines/templates";

/** Copia una rutina armada a las rutinas del usuario y abre la copia. */
export async function addTemplate(templateId) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/rutinas/armadas");
  const template = getTemplate(templateId);
  if (!template) throw new Error("Esa rutina armada no existe.");
  const catalog = await listExercises();
  const routineId = await createRoutine(user.uid, templateRoutineInput(template, new Set(catalog.map((e) => e.id))));
  revalidatePath("/rutinas");
  redirect(`/rutinas/${routineId}`);
}
