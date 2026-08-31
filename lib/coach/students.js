import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "coachStudents";

async function fetchStudentProfile(studentId) {
  const doc = await getDb().collection("users").doc(studentId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    uid: doc.id,
    displayName: data.displayName || null,
    email: data.email || null,
    photoURL: data.photoURL || null,
  };
}

export async function listCoachStudents(coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .where("status", "==", "active")
    .get();

  const students = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const profile = await fetchStudentProfile(data.studentId);
      return {
        id: doc.id,
        studentId: data.studentId,
        linkedAt: data.linkedAt?.toDate?.().toISOString() || null,
        displayName: profile?.displayName || "Sin nombre",
        email: profile?.email || null,
        photoURL: profile?.photoURL || null,
      };
    }),
  );

  return students.sort(
    (a, b) => new Date(b.linkedAt || 0) - new Date(a.linkedAt || 0),
  );
}

export async function removeStudent(coachId, studentId) {
  const db = getDb();

  const snapshot = await db
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .where("studentId", "==", studentId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("Vínculo no encontrado.");
  }

  await snapshot.docs[0].ref.update({
    status: "removed",
  });
}

export async function isLinkedToCoach(studentId, coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .where("studentId", "==", studentId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function getStudentCount(coachId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("coachId", "==", coachId)
    .where("status", "==", "active")
    .get();

  return snapshot.size;
}
