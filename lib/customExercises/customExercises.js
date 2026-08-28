import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { normalizeSearchText } from "@/lib/text/normalize";
import { isValidMuscleWeights } from "@/lib/exercises/constants";

function collection(uid) {
  return getDb().collection("users").doc(uid).collection("customExercises");
}

function serializeCustomExercise(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ownerId: data.ownerId,
    nameEs: data.nameEs,
    nameEn: data.nameEn || data.nameEs,
    equipment: data.equipment,
    pattern: data.pattern,
    muscleWeights: data.muscleWeights || {},
    registrationType: data.registrationType,
    unilateral: !!data.unilateral,
    descriptionEs: data.descriptionEs || "",
    descriptionEn: data.descriptionEn || "",
    mediaUrl: null,
    source: "custom",
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

export async function listCustomExercises(uid) {
  const snapshot = await collection(uid).orderBy("nameEs").get();
  return snapshot.docs.map(serializeCustomExercise);
}

export async function getCustomExercise(uid, exerciseId) {
  const doc = await collection(uid).doc(exerciseId).get();
  if (!doc.exists || doc.data().ownerId !== uid) {
    return null;
  }
  return serializeCustomExercise(doc);
}

export async function createCustomExercise(uid, data) {
  if (!data.nameEs?.trim()) {
    throw new Error("El nombre es obligatorio.");
  }
  if (!isValidMuscleWeights(data.muscleWeights)) {
    throw new Error("Los pesos musculares tienen que sumar 1.0.");
  }

  const now = FieldValue.serverTimestamp();
  const ref = await collection(uid).add({
    ownerId: uid,
    nameEs: data.nameEs.trim(),
    nameEn: data.nameEn?.trim() || data.nameEs.trim(),
    equipment: data.equipment,
    pattern: data.pattern,
    muscleWeights: data.muscleWeights,
    registrationType: data.registrationType,
    unilateral: !!data.unilateral,
    descriptionEs: data.descriptionEs?.trim() || "",
    descriptionEn: data.descriptionEn?.trim() || "",
    searchTextEs: normalizeSearchText(data.nameEs.trim()),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteCustomExercise(uid, exerciseId) {
  const docRef = collection(uid).doc(exerciseId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().ownerId !== uid) {
    throw new Error("Ejercicio no encontrado.");
  }
  await docRef.delete();
}
