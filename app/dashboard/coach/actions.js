"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { generateCode } from "@/lib/coach/codes";
import { removeStudent as removeStudentDb } from "@/lib/coach/students";

export async function generateInvitationCode() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const result = await generateCode(user.uid);
  revalidatePath("/dashboard/coach");
  return result;
}

export async function removeStudent(studentId) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  await removeStudentDb(user.uid, studentId);
  revalidatePath("/dashboard/coach");
}
