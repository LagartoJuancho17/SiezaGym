import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "sessions";

function serializeSession(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    source: data.source || null,
    routineName: data.routineName || null,
    startedAt: data.startedAt?.toDate?.().toISOString() || null,
    finishedAt: data.finishedAt?.toDate?.().toISOString() || null,
    durationSeconds: data.durationSeconds || 0,
    exercises: data.exercises || [],
    exerciseIds: data.exerciseIds || [],
    totalVolumeKg: data.totalVolumeKg || 0,
    totalSetsCompleted: data.totalSetsCompleted || 0,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

export async function createSession(userId, data) {
  const exercises = Array.isArray(data.exercises) ? data.exercises : [];
  if (!exercises.length) {
    throw new Error("La sesión no tiene series cargadas.");
  }
  if (exercises.length > 40) {
    throw new Error("Demasiados ejercicios en una sesión.");
  }

  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;
  for (const exercise of exercises) {
    for (const set of exercise.sets || []) {
      totalSetsCompleted += 1;
      if (!set.failed) {
        totalVolumeKg += (Number(set.weight) || 0) * (Number(set.reps) || 0);
      }
    }
  }

  if (totalSetsCompleted === 0) {
    throw new Error("La sesión no tiene series cargadas.");
  }

  const exerciseIds = [...new Set(exercises.map((e) => e.exerciseId).filter(Boolean))];
  const now = FieldValue.serverTimestamp();
  totalVolumeKg = Math.round(totalVolumeKg * 100) / 100;

  const ref = await getDb()
    .collection(COLLECTION)
    .add({
      userId,
      source: data.source || null,
      routineName: data.routineName || null,
      startedAt: data.startedAt ? new Date(data.startedAt) : now,
      finishedAt: now,
      durationSeconds: Number(data.durationSeconds) || 0,
      exercises,
      exerciseIds,
      totalVolumeKg,
      totalSetsCompleted,
      createdAt: now,
    });

  return { id: ref.id, totalVolumeKg, totalSetsCompleted };
}

export async function listUserSessions(userId, { limitCount = 50 } = {}) {
  try {
    const snapshot = await getDb()
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .orderBy("finishedAt", "desc")
      .limit(limitCount)
      .get();
    return snapshot.docs.map(serializeSession);
  } catch (error) {
    console.warn("[listUserSessions] Firestore quota/error:", error.message);
    return [];
  }
}

export async function getUserSession(userId, sessionId) {
  try {
    const doc = await getDb().collection(COLLECTION).doc(sessionId).get();
    if (!doc.exists) return null;
    const session = serializeSession(doc);
    if (session.userId !== userId) return null;
    return session;
  } catch (error) {
    console.warn("[getUserSession] Firestore quota/error:", error.message);
    return null;
  }
}

export async function listSessionsForExercise(userId, exerciseId) {
  try {
    const snapshot = await getDb()
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("exerciseIds", "array-contains", exerciseId)
      .orderBy("finishedAt", "desc")
      .get();
    return snapshot.docs.map(serializeSession);
  } catch (error) {
    console.warn("[listSessionsForExercise] Firestore quota/error:", error.message);
    return [];
  }
}

export async function weeklyVolumeKg(userId) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const snapshot = await getDb()
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("finishedAt", ">=", weekAgo)
      .get();
    return (
      Math.round(
        snapshot.docs.reduce((total, doc) => total + (doc.data().totalVolumeKg || 0), 0) * 100,
      ) / 100
    );
  } catch (error) {
    console.warn("[weeklyVolumeKg] Firestore quota/error:", error.message);
    return 0;
  }
}

