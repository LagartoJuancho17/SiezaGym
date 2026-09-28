"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { redeemCode } from "@/lib/coach/codes";
import { getUserProfile } from "@/lib/users/users";

export async function redeemInvitationCode(code) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const result = await redeemCode(code, user.uid);

  if (!result.success) {
    throw new Error(result.error);
  }

  const coachProfile = await getUserProfile(result.coachId);
  const coachName = coachProfile?.displayName || "tu entrenador";

  revalidatePath("/");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: true, coachName };
}

export async function unlinkCurrentCoach() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const { unlinkCoachFromStudent } = await import("@/lib/coach/students");
  await unlinkCoachFromStudent(user.uid);

  revalidatePath("/");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: true };
}
