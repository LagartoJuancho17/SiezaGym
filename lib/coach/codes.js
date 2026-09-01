import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { buildLinkDocId } from "@/lib/coach/students";

const COLLECTION = "invitationCodes";
const LINK_COLLECTION = "coachStudents";
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

async function findPendingCode(coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .get();

  const now = Date.now();
  const pending = snapshot.docs
    .map((doc) => doc.data())
    .filter((data) => data.status === "pending")
    .filter((data) => {
      const expiresAt = data.expiresAt?.toDate?.();
      return expiresAt && expiresAt.getTime() > now;
    })
    .sort(
      (a, b) =>
        (b.createdAt?.toDate?.()?.getTime() || 0) -
        (a.createdAt?.toDate?.()?.getTime() || 0),
    );

  if (pending.length === 0) return null;
  return pending[0];
}

export async function generateCode(coachId) {
  const existing = await findPendingCode(coachId);

  if (existing) {
    return {
      id: existing.code,
      code: existing.code,
      expiresAt: existing.expiresAt.toDate().toISOString(),
    };
  }

  const db = getDb();
  let docRef = null;
  let attempts = 0;

  while (attempts < 10) {
    const code = generateRandomCode();
    docRef = db.collection(COLLECTION).doc(code);

    try {
      await docRef.create({
        code,
        coachId,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + EXPIRY_MS),
        usedBy: null,
        usedAt: null,
      });
      break;
    } catch (err) {
      const isConflict = err?.code === "already-exists" || err?.message?.includes("already exists");
      if (!isConflict) throw err;
      docRef = null;
      attempts++;
    }
  }

  if (!docRef) {
    throw new Error("No se pudo generar un código único. Intentá de nuevo.");
  }

  await db.collection("users").doc(coachId).set(
    { isCoach: true, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  const created = await docRef.get();
  const data = created.data();

  return {
    id: docRef.id,
    code: docRef.id,
    expiresAt: data.expiresAt.toDate().toISOString(),
  };
}

export async function revokeCode(coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .get();

  const now = Date.now();
  const batch = getDb().batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.status !== "pending") return;
    const expiresAt = data.expiresAt?.toDate?.();
    if (!expiresAt || expiresAt.getTime() <= now) return;
    batch.update(doc.ref, { status: "expired", revokedAt: FieldValue.serverTimestamp() });
    count++;
  });

  if (count > 0) await batch.commit();
  return count;
}

export async function redeemCode(code, studentId) {
  const normalized = code.toUpperCase().trim();
  const db = getDb();
  const codeRef = db.collection(COLLECTION).doc(normalized);

  try {
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(codeRef);

      if (!doc.exists) {
        return { success: false, error: "Código inválido o ya utilizado." };
      }

      const data = doc.data();

      if (data.status !== "pending") {
        return { success: false, error: "Código inválido o ya utilizado." };
      }

      const expiresAt = data.expiresAt?.toDate?.();
      if (!expiresAt || expiresAt.getTime() < Date.now()) {
        tx.update(codeRef, { status: "expired" });
        return {
          success: false,
          error: "El código expiró. Pedí uno nuevo al entrenador.",
        };
      }

      if (data.coachId === studentId) {
        return { success: false, error: "No podés vincularte a vos mismo." };
      }

      const linkRef = db
        .collection(LINK_COLLECTION)
        .doc(buildLinkDocId(data.coachId, studentId));
      const linkDoc = await tx.get(linkRef);

      if (linkDoc.exists && linkDoc.data().status === "active") {
        return { success: false, error: "Ya estás vinculado a este entrenador." };
      }

      tx.update(codeRef, {
        status: "used",
        usedBy: studentId,
        usedAt: FieldValue.serverTimestamp(),
      });

      tx.set(linkRef, {
        coachId: data.coachId,
        studentId,
        status: "active",
        linkedAt: FieldValue.serverTimestamp(),
      });

      return { success: true, coachId: data.coachId };
    });

    return result;
  } catch (err) {
    console.error("redeemCode error:", err);
    return { success: false, error: "No se pudo procesar el código. Intentá de nuevo." };
  }
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