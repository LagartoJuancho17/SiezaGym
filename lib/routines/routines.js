import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "routines";

function serializeRoutine(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ownerId: data.ownerId,
    name: data.name || "",
    note: data.note || "",
    exercises: data.exercises || [],
    showOnHome: data.showOnHome !== false,
    lastUsedAt: data.lastUsedAt?.toDate?.().toISOString() || null,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

function sanitizeExercises(exercises) {
  if (!Array.isArray(exercises)) return [];
  return exercises.map((exercise, index) => ({
    exerciseId: exercise.exerciseId,
    exerciseSource: exercise.exerciseSource === "custom" ? "custom" : "catalog",
    order: index,
    targetSets: Number(exercise.targetSets) || 3,
    targetReps: Number(exercise.targetReps) || 10,
    targetRIR: exercise.targetRIR === "" || exercise.targetRIR == null ? null : Number(exercise.targetRIR),
    targetWeight: exercise.targetWeight === "" || exercise.targetWeight == null ? null : Number(exercise.targetWeight),
    techniqueNote: exercise.techniqueNote?.trim() || "",
  }));
}

export async function listUserRoutines(userId) {
  try {
    const snapshot = await getDb()
      .collection(COLLECTION)
      .where("ownerId", "==", userId)
      .get();
    return snapshot.docs
      .map(serializeRoutine)
      .sort((a, b) => new Date(b.lastUsedAt || b.createdAt || 0) - new Date(a.lastUsedAt || a.createdAt || 0));
  } catch (error) {
    console.warn("[listUserRoutines] Firestore quota/error:", error.message);
    return [];
  }
}

export async function getUserRoutine(userId, routineId) {
  try {
    const doc = await getDb().collection(COLLECTION).doc(routineId).get();
    if (!doc.exists) return null;
    const routine = serializeRoutine(doc);
    if (routine.ownerId !== userId) return null;
    return routine;
  } catch (error) {
    console.warn("[getUserRoutine] Firestore quota/error:", error.message);
    return null;
  }
}


export async function createRoutine(userId, data) {
  if (!data.name?.trim()) {
    throw new Error("El nombre es obligatorio.");
  }
  const exercises = sanitizeExercises(data.exercises);
  if (!exercises.length) {
    throw new Error("Agregá al menos un ejercicio.");
  }

  const now = FieldValue.serverTimestamp();
  const ref = await getDb().collection(COLLECTION).add({
    ownerId: userId,
    name: data.name.trim(),
    note: data.note?.trim() || "",
    exercises,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateRoutine(userId, routineId, data) {
  const docRef = getDb().collection(COLLECTION).doc(routineId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().ownerId !== userId) {
    throw new Error("Rutina no encontrada.");
  }
  if (!data.name?.trim()) {
    throw new Error("El nombre es obligatorio.");
  }
  const exercises = sanitizeExercises(data.exercises);
  if (!exercises.length) {
    throw new Error("Agregá al menos un ejercicio.");
  }

  await docRef.update({
    name: data.name.trim(),
    note: data.note?.trim() || "",
    exercises,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function setRoutineShowOnHome(userId, routineId, showOnHome) {
  const docRef = getDb().collection(COLLECTION).doc(routineId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().ownerId !== userId) {
    throw new Error("Rutina no encontrada.");
  }
  await docRef.update({
    showOnHome: !!showOnHome,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteRoutine(userId, routineId) {
  const docRef = getDb().collection(COLLECTION).doc(routineId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().ownerId !== userId) {
    throw new Error("Rutina no encontrada.");
  }
  await docRef.delete();
}

export async function duplicateRoutine(userId, routineId) {
  const original = await getUserRoutine(userId, routineId);
  if (!original) {
    throw new Error("Rutina no encontrada.");
  }
  return createRoutine(userId, {
    name: `${original.name} (copia)`,
    note: original.note,
    exercises: original.exercises,
  });
}
