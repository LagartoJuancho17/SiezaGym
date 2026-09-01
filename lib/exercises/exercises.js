import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "exercises";

function serializeExercise(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    nameEs: data.nameEs,
    nameEn: data.nameEn,
    equipment: data.equipment,
    pattern: data.pattern,
    muscleWeights: data.muscleWeights || {},
    registrationType: data.registrationType,
    unilateral: !!data.unilateral,
    descriptionEs: data.descriptionEs || "",
    descriptionEn: data.descriptionEn || "",
    mediaUrl: data.mediaUrl || null,
    source: data.source || "seed",
  };
}

export async function listExercises() {
  const snapshot = await getDb().collection(COLLECTION).orderBy("nameEs").get();
  return snapshot.docs.map(serializeExercise);
}

export async function getExerciseById(exerciseId) {
  const doc = await getDb().collection(COLLECTION).doc(exerciseId).get();
  if (!doc.exists) {
    return null;
  }
  return serializeExercise(doc);
}
