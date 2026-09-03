import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "assignments";

function serializeAssignment(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    routineId: data.routineId || "",
    routineName: data.routineName || "",
    coachId: data.coachId || "",
    studentId: data.studentId || "",
    exercises: data.exercises || [],
    note: data.note || "",
    assignedAt: data.assignedAt?.toDate?.().toISOString() || null,
    lastUsedAt: data.lastUsedAt?.toDate?.().toISOString() || null,
    exerciseLogs: data.exerciseLogs || {},
  };
}

export async function assignRoutineToStudent(coachId, studentId, routine) {
  if (!coachId || !studentId || !routine) {
    throw new Error("Faltan datos para la asignación.");
  }

  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .where("studentId", "==", studentId)
    .where("routineId", "==", routine.id)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    throw new Error("Esta rutina ya está asignada a este alumno.");
  }

  const now = FieldValue.serverTimestamp();
  const ref = await getDb().collection(COLLECTION).add({
    routineId: routine.id,
    routineName: routine.name,
    coachId,
    studentId,
    exercises: routine.exercises.map((ex, i) => ({
      exerciseId: ex.exerciseId,
      exerciseSource: ex.exerciseSource,
      order: i,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetRIR: ex.targetRIR,
      targetWeight: ex.targetWeight,
      techniqueNote: ex.techniqueNote || "",
    })),
    note: routine.note || "",
    assignedAt: now,
    lastUsedAt: null,
    exerciseLogs: {},
  });

  return ref.id;
}

export async function unassignRoutine(coachId, assignmentId) {
  const docRef = getDb().collection(COLLECTION).doc(assignmentId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Asignación no encontrada.");
  }
  if (doc.data().coachId !== coachId) {
    throw new Error("No tenés permiso para desasignar esta rutina.");
  }
  await docRef.delete();
}

export async function listStudentAssignments(studentId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("studentId", "==", studentId)
    .get();
  return snapshot.docs
    .map(serializeAssignment)
    .sort(
      (a, b) =>
        new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0),
    );
}

export async function listAssignmentsByCoach(coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .get();
  return snapshot.docs.map(serializeAssignment);
}

export async function getAssignment(assignmentId) {
  const doc = await getDb().collection(COLLECTION).doc(assignmentId).get();
  if (!doc.exists) return null;
  return serializeAssignment(doc);
}

export async function logExercise(studentId, assignmentId, exerciseIndex, logData) {
  const docRef = getDb().collection(COLLECTION).doc(assignmentId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Asignación no encontrada.");
  }
  if (doc.data().studentId !== studentId) {
    throw new Error("No tenés permiso para registrar en esta asignación.");
  }

  const key = `exerciseLogs.${exerciseIndex}`;
  await docRef.update({
    [key]: {
      actualSets: Number(logData.actualSets) || 0,
      actualReps: logData.actualReps || "",
      actualWeight: logData.actualWeight === "" || logData.actualWeight == null
        ? null
        : Number(logData.actualWeight),
      finalRIR: logData.finalRIR === "" || logData.finalRIR == null
        ? null
        : Number(logData.finalRIR),
      note: logData.note?.trim() || "",
      loggedAt: FieldValue.serverTimestamp(),
    },
    lastUsedAt: FieldValue.serverTimestamp(),
  });
}
