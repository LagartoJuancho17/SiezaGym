import { getDb } from "@/lib/firebase/firestore";
import { EXERCISES } from "@/scripts/seed/exercises-data.mjs";
import { MEDIA_MAP } from "@/scripts/seed/media-map.mjs";
import { slugify } from "@/lib/text/normalize.js";

const COLLECTION = "exercises";

// Static catalog built directly from seed data (0 Firestore reads required)
const STATIC_EXERCISES = EXERCISES.map((data) => ({
  id: slugify(data.nameEs),
  nameEs: data.nameEs,
  nameEn: data.nameEn,
  equipment: data.equipment,
  pattern: data.pattern,
  muscleWeights: data.muscleWeights || {},
  registrationType: data.registrationType,
  unilateral: !!data.unilateral,
  descriptionEs: data.descriptionEs || "",
  descriptionEn: data.descriptionEn || "",
  mediaUrl: MEDIA_MAP[data.nameEs] || null,
  source: "seed",
})).sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));

const STATIC_MAP = new Map(STATIC_EXERCISES.map((e) => [e.id, e]));

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

let cachedExercises = null;

export async function listExercises() {
  if (cachedExercises) {
    return cachedExercises;
  }

  try {
    const snapshot = await getDb().collection(COLLECTION).orderBy("nameEs").get();
    if (!snapshot.empty) {
      cachedExercises = snapshot.docs.map(serializeExercise);
      return cachedExercises;
    }
  } catch (error) {
    console.warn("[listExercises] Firestore quota/error, usando catálogo estático:", error.message);
  }

  cachedExercises = STATIC_EXERCISES;
  return STATIC_EXERCISES;
}

export async function getExerciseById(exerciseId) {
  if (STATIC_MAP.has(exerciseId)) {
    return STATIC_MAP.get(exerciseId);
  }

  try {
    const doc = await getDb().collection(COLLECTION).doc(exerciseId).get();
    if (!doc.exists) {
      return null;
    }
    return serializeExercise(doc);
  } catch (error) {
    console.warn("[getExerciseById] Firestore quota/error:", error.message);
    return null;
  }
}

