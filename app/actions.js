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
  return { success: true, coachName };
}
