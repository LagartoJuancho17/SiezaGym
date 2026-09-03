import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { createSession } from "@/lib/sessions/sessions";

const COLLECTION = "assignments";

// Firestore puede devolver loggedAt como instancia de Timestamp (clase, no
// objeto plano) - Next.js no puede pasar eso de Server a Client Component tal
// cual. Sanitiza ambas formas: la actual (por serie, array `sets`) y la
// forma vieja (un solo log agregado por ejercicio), por si quedó data de
// pruebas anteriores en Firestore.
function serializeLoggedAt(value) {
  if (!value) return null;
  return typeof value === "string" ? value : value.toDate?.().toISOString() || null;
}

function serializeExerciseLogs(exerciseLogs) {
  if (!exerciseLogs) return {};
  const result = {};
  for (const [index, log] of Object.entries(exerciseLogs)) {
    if (Array.isArray(log?.sets)) {
      result[index] = {
        sets: log.sets.map((set) => ({ ...set, loggedAt: serializeLoggedAt(set?.loggedAt) })),
      };
    } else {
      result[index] = { ...log, loggedAt: serializeLoggedAt(log?.loggedAt) };
    }
  }
  return result;
}

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
    lastCompletedAt: data.lastCompletedAt?.toDate?.().toISOString() || null,
    lastDurationSeconds: data.lastDurationSeconds || null,
    exerciseLogs: serializeExerciseLogs(data.exerciseLogs),
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

// Registra UNA serie dentro de un ejercicio de la asignación. Guarda todo el
// array de sets de ese ejercicio (no un campo por índice) porque cada serie
// puede tener reps/peso distintos (ej: 10/12/14 reps subiendo carga) y así
// el array completo queda consistente en una sola escritura.
export async function logExerciseSet(studentId, assignmentId, exerciseIndex, setIndex, setData) {
  const docRef = getDb().collection(COLLECTION).doc(assignmentId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Asignación no encontrada.");
  }
  const data = doc.data();
  if (data.studentId !== studentId) {
    throw new Error("No tenés permiso para registrar en esta asignación.");
  }

  const existingSets = Array.isArray(data.exerciseLogs?.[exerciseIndex]?.sets)
    ? [...data.exerciseLogs[exerciseIndex].sets]
    : [];
  existingSets[setIndex] = {
    setNumber: setIndex + 1,
    reps: Number(setData.reps) || 0,
    weight: setData.weight === "" || setData.weight == null ? null : Number(setData.weight),
    loggedAt: new Date().toISOString(),
  };

  const key = `exerciseLogs.${exerciseIndex}`;
  await docRef.update({
    [key]: { sets: existingSets },
    lastUsedAt: FieldValue.serverTimestamp(),
  });
}

// Cierra un entrenamiento sobre una rutina asignada (timer del alumno). Queda
// en el documento de la asignación, que el coach ya puede leer
// (listAssignmentsByCoach) - así se entera cuando su alumno entrena y cuánto
// tardó, sin necesitar una colección de sesiones separada por asignación.
export async function completeAssignmentSession(studentId, assignmentId, durationSeconds) {
  const docRef = getDb().collection(COLLECTION).doc(assignmentId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Asignación no encontrada.");
  }
  const data = doc.data();
  if (data.studentId !== studentId) {
    throw new Error("No tenés permiso para registrar en esta asignación.");
  }

  // Además de cerrar el timer de la asignación (para que el coach la vea en
  // "Actividad reciente"), crea una sesión real - la misma fuente de verdad
  // que usan /progreso, /historial, el volumen semanal y la racha. Sin esto,
  // entrenar una rutina asignada no contaba para ninguna estadística.
  const exerciseLogs = data.exerciseLogs || {};
  const exercisesForSession = (data.exercises || [])
    .map((assignedExercise, exerciseIndex) => {
      const sets = exerciseLogs[exerciseIndex]?.sets;
      if (!Array.isArray(sets) || sets.length === 0) return null;
      return {
        exerciseId: assignedExercise.exerciseId,
        exerciseSource: assignedExercise.exerciseSource,
        order: exerciseIndex,
        sets: sets.map((set, setIndex) => ({
          setNumber: setIndex + 1,
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          failed: false,
        })),
      };
    })
    .filter(Boolean);

  if (exercisesForSession.length > 0) {
    await createSession(studentId, {
      source: { type: "assignment", assignmentId, routineId: data.routineId || null },
      routineName: data.routineName,
      durationSeconds,
      exercises: exercisesForSession,
    });
  }

  await docRef.update({
    lastCompletedAt: FieldValue.serverTimestamp(),
    lastDurationSeconds: Number(durationSeconds) || 0,
    lastUsedAt: FieldValue.serverTimestamp(),
  });
}
