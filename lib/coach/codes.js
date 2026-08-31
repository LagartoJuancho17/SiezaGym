import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "invitationCodes";
const CODE_LENGTH = 6;
const EXPIRY_MS = 24 * 60 * 60 * 1000;

function generateRandomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function serializeCode(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    code: data.code,
    coachId: data.coachId,
    status: data.status,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    expiresAt: data.expiresAt?.toDate?.().toISOString() || null,
    usedBy: data.usedBy || null,
    usedAt: data.usedAt?.toDate?.().toISOString() || null,
  };
}

export async function generateCode(coachId) {
  const now = Date.now();
  const expiresAt = new Date(now + EXPIRY_MS);
  const db = getDb();

  let code;
  let attempts = 0;

  while (attempts < 10) {
    code = generateRandomCode();

    const existing = await db
      .collection(COLLECTION)
      .where("code", "==", code)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (existing.empty) break;
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error("No se pudo generar un código único. Intentá de nuevo.");
  }

  const docRef = await db.collection(COLLECTION).add({
    code,
    coachId,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    usedBy: null,
    usedAt: null,
  });

  await db.collection("users").doc(coachId).set(
    { isCoach: true, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  return { id: docRef.id, code, expiresAt: expiresAt.toISOString() };
}

export async function redeemCode(code, studentId) {
  const db = getDb();

  const snapshot = await db
    .collection(COLLECTION)
    .where("code", "==", code.toUpperCase().trim())
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { success: false, error: "Código inválido o ya utilizado." };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  const expiresAt = data.expiresAt?.toDate?.();

  if (!expiresAt || expiresAt < new Date()) {
    await doc.ref.update({ status: "expired" });
    return { success: false, error: "El código expiró. Pedí uno nuevo al entrenador." };
  }

  if (data.coachId === studentId) {
    return { success: false, error: "No podés vincularte a vos mismo." };
  }

  const alreadyLinked = await db
    .collection("coachStudents")
    .where("coachId", "==", data.coachId)
    .where("studentId", "==", studentId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!alreadyLinked.empty) {
    return { success: false, error: "Ya estás vinculado a este entrenador." };
  }

  const batch = db.batch();

  batch.update(doc.ref, {
    status: "used",
    usedBy: studentId,
    usedAt: FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("coachStudents").doc(), {
    coachId: data.coachId,
    studentId,
    status: "active",
    linkedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { success: true, coachId: data.coachId };
}

export async function cleanupExpiredCodes() {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "==", "pending")
    .get();

  const now = new Date();
  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const expiresAt = doc.data().expiresAt?.toDate?.();
    if (!expiresAt || expiresAt < now) {
      batch.update(doc.ref, { status: "expired" });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}
