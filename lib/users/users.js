import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { SEX_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/users/constants";

const COLLECTION = "users";

function serializeUser(doc) {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email || null,
    displayName: data.displayName || null,
    photoURL: data.photoURL || null,
    provider: data.provider || null,
    isCoach: data.isCoach || false,
    isAdmin: data.isAdmin || false,
    sex: data.sex || null,
    bodyWeightKg: data.bodyWeightKg || null,
    heightCm: data.heightCm || null,
    experienceLevel: data.experienceLevel || null,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    lastLoginAt: data.lastLoginAt?.toDate?.().toISOString() || null,
  };
}

export async function getUserProfile(uid) {
  try {
    const doc = await getDb().collection(COLLECTION).doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return serializeUser(doc);
  } catch (error) {
    console.warn(`[getUserProfile] No se pudo leer perfil para uid ${uid}:`, error.message);
    return null;
  }
}

export async function ensureUserProfile({ uid, email, displayName, photoURL, provider }) {
  try {
    const docRef = getDb().collection(COLLECTION).doc(uid);
    const doc = await docRef.get();
    const now = FieldValue.serverTimestamp();

    if (!doc.exists) {
      await docRef.set({
        email: email || null,
        displayName: displayName || null,
        photoURL: photoURL || null,
        provider: provider || "password",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      return;
    }

    const existing = doc.data();
    await docRef.set(
      {
        email: email || existing.email || null,
        displayName: displayName || existing.displayName || null,
        photoURL: photoURL || existing.photoURL || null,
        updatedAt: now,
        lastLoginAt: now,
      },
      { merge: true },
    );
  } catch (error) {
    console.warn(`[ensureUserProfile] No se pudo asegurar perfil para uid ${uid}:`, error.message);
  }
}

export async function updateUserProfile(uid, data) {
  const update = { updatedAt: FieldValue.serverTimestamp() };

  if (data.displayName !== undefined) {
    const trimmed = data.displayName?.trim();
    if (!trimmed) {
      throw new Error("El nombre no puede estar vacío.");
    }
    update.displayName = trimmed;
  }

  if (data.sex !== undefined) {
    if (data.sex !== null && !SEX_OPTIONS.includes(data.sex)) {
      throw new Error("Valor de sexo inválido.");
    }
    update.sex = data.sex;
  }

  if (data.experienceLevel !== undefined) {
    if (data.experienceLevel !== null && !EXPERIENCE_LEVELS.includes(data.experienceLevel)) {
      throw new Error("Nivel de experiencia inválido.");
    }
    update.experienceLevel = data.experienceLevel;
  }

  if (data.bodyWeightKg !== undefined) {
    const value = data.bodyWeightKg === null || data.bodyWeightKg === "" ? null : Number(data.bodyWeightKg);
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 400)) {
      throw new Error("Peso corporal inválido.");
    }
    update.bodyWeightKg = value;
  }

  if (data.heightCm !== undefined) {
    const value = data.heightCm === null || data.heightCm === "" ? null : Number(data.heightCm);
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 260)) {
      throw new Error("Altura inválida.");
    }
    update.heightCm = value;
  }

  await getDb().collection(COLLECTION).doc(uid).set(update, { merge: true });
}

