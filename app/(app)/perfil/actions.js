"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { updateUserProfile } from "@/lib/users/users";

export async function updateProfile(data) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  await updateUserProfile(user.uid, data);

  revalidatePath("/perfil");
  revalidatePath("/");
}
