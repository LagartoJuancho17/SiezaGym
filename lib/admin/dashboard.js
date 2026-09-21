import { getDb } from "@/lib/firebase/firestore";
import { listExercises } from "@/lib/exercises/exercises";
import { isAdminEmail } from "@/lib/admin/access";

const RECENT_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return value.toDate?.() || null;
}

function toIso(value) {
  const date = toDate(value);
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function serializeUser(doc) {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email || null,
    displayName: data.displayName || "Sin nombre",
    isCoach: data.isCoach === true,
    isAdmin: data.isAdmin === true || isAdminEmail(data.email),
    createdAt: toIso(data.createdAt),
    lastLoginAt: toIso(data.lastLoginAt),
  };
}

function serializeSession(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId || null,
    routineName: data.routineName || "Entrenamiento libre",
    finishedAt: toIso(data.finishedAt || data.createdAt),
    durationSeconds: Number(data.durationSeconds) || 0,
    totalVolumeKg: Number(data.totalVolumeKg) || 0,
    totalSetsCompleted: Number(data.totalSetsCompleted) || 0,
  };
}

function serializeRoutine(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || data.routineName || "Sin nombre",
    ownerId: data.ownerId || data.coachId || null,
    exerciseCount: Array.isArray(data.exercises) ? data.exercises.length : 0,
    updatedAt: toIso(data.updatedAt || data.assignedAt || data.createdAt),
    kind: data.coachId ? "Plantilla" : "Rutina personal",
  };
}

function serializeAssignment(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    routineName: data.routineName || "Sin nombre",
    coachId: data.coachId || null,
    studentId: data.studentId || null,
    assignedAt: toIso(data.assignedAt),
    lastCompletedAt: toIso(data.lastCompletedAt),
  };
}

async function countQuery(query) {
  try {
    const aggregate = await query.count().get();
    return Number(aggregate.data().count) || 0;
  } catch (error) {
    try {
      const snapshot = await query.get();
      return snapshot.size;
    } catch (fallbackError) {
      console.warn("[admin] No se pudo contar una colección:", fallbackError.message || error.message);
      return 0;
    }
  }
}

async function recentDocs(query, fallbackQuery = null) {
  try {
    const snapshot = await query.limit(RECENT_LIMIT).get();
    if (!snapshot.empty || !fallbackQuery) return snapshot.docs;
  } catch (error) {
    if (!fallbackQuery) {
      console.warn("[admin] No se pudo leer una colección:", error.message);
      return [];
    }
  }

  try {
    const snapshot = await fallbackQuery.limit(RECENT_LIMIT).get();
    return snapshot.docs;
  } catch (error) {
    console.warn("[admin] No se pudo leer la colección alternativa:", error.message);
    return [];
  }
}

async function getUserLabels(userIds) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const doc = await getDb().collection("users").doc(uid).get();
        if (!doc.exists) return [uid, "Usuario eliminado"];
        const data = doc.data();
        return [uid, data.displayName || data.email || "Sin nombre"];
      } catch {
        return [uid, "Usuario"];
      }
    }),
  );
  return new Map(entries);
}

export async function getAdminDashboardData(now = new Date()) {
  const db = getDb();
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const since30 = new Date(now.getTime() - 30 * DAY_MS);

  const users = db.collection("users");
  const sessions = db.collection("sessions");
  const routines = db.collection("routines");
  const templates = db.collection("templates");
  const assignments = db.collection("assignments");

  const [
    userCount,
    newUsers30,
    activeUsers30,
    coachCount,
    sessionCount7,
    sessionCount30,
    routineCount,
    templateCount,
    assignmentCount,
    customExerciseCount,
    recentUserDocs,
    recentCoachDocs,
    recentSessionDocs,
    recentRoutineDocs,
    recentTemplateDocs,
    recentAssignmentDocs,
    exercises,
  ] = await Promise.all([
    countQuery(users),
    countQuery(users.where("createdAt", ">=", since30)),
    countQuery(users.where("lastLoginAt", ">=", since30)),
    countQuery(users.where("isCoach", "==", true)),
    countQuery(sessions.where("finishedAt", ">=", since7)),
    countQuery(sessions.where("finishedAt", ">=", since30)),
    countQuery(routines),
    countQuery(templates),
    countQuery(assignments),
    countQuery(db.collectionGroup("customExercises")),
    recentDocs(
      users.orderBy("lastLoginAt", "desc"),
      users.orderBy("createdAt", "desc"),
    ),
    recentDocs(
      users.where("isCoach", "==", true).orderBy("updatedAt", "desc"),
      users.where("isCoach", "==", true).orderBy("createdAt", "desc"),
    ),
    recentDocs(sessions.orderBy("finishedAt", "desc"), sessions.orderBy("createdAt", "desc")),
    recentDocs(routines.orderBy("updatedAt", "desc"), routines.orderBy("createdAt", "desc")),
    recentDocs(templates.orderBy("updatedAt", "desc"), templates.orderBy("createdAt", "desc")),
    recentDocs(assignments.orderBy("assignedAt", "desc")),
    listExercises(),
  ]);

  const recentUsers = recentUserDocs.map(serializeUser);
  const recentCoaches = recentCoachDocs.map(serializeUser);
  const recentSessions = recentSessionDocs.map(serializeSession);
  const userLabels = await getUserLabels(recentSessions.map((session) => session.userId));
  const recentRoutines = [
    ...recentRoutineDocs.map(serializeRoutine),
    ...recentTemplateDocs.map(serializeRoutine),
  ]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, RECENT_LIMIT);
  const recentAssignments = recentAssignmentDocs.map(serializeAssignment);
  const missingMedia = exercises.filter((exercise) => !exercise.mediaUrl);

  return {
    generatedAt: now.toISOString(),
    metrics: {
      userCount,
      newUsers30,
      activeUsers30,
      coachCount,
      sessionCount7,
      sessionCount30,
      routineCount,
      templateCount,
      assignmentCount,
      customExerciseCount,
      exerciseCount: exercises.length,
      missingMediaCount: missingMedia.length,
      inactiveUsers30: Math.max(0, userCount - activeUsers30),
    },
    recentUsers,
    recentCoaches,
    recentSessions: recentSessions.map((session) => ({
      ...session,
      userName: userLabels.get(session.userId) || "Usuario",
    })),
    recentRoutines,
    recentAssignments,
    catalogHealth: {
      total: exercises.length,
      withMedia: exercises.length - missingMedia.length,
      missingMedia: missingMedia.slice(0, RECENT_LIMIT).map((exercise) => ({
        id: exercise.id,
        nameEs: exercise.nameEs,
      })),
    },
  };
}

export function formatAdminDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDuration(seconds) {
  const minutes = Math.round((Number(seconds) || 0) / 60);
  return minutes > 0 ? `${minutes} min` : "—";
}
