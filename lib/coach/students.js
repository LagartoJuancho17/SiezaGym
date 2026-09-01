import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "coachStudents";

export function buildLinkDocId(coachId, studentId) {
  return `${coachId}__${studentId}`;
}

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
    .get();

  const activeDocs = snapshot.docs.filter(
    (doc) => doc.data().status === "active",
  );

  const students = await Promise.all(
    activeDocs.map(async (doc) => {
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
  const docRef = getDb()
    .collection(COLLECTION)
    .doc(buildLinkDocId(coachId, studentId));

  const doc = await docRef.get();

  if (!doc.exists || doc.data().status !== "active") {
    throw new Error("Vínculo no encontrado.");
  }

  await docRef.update({
    status: "removed",
  });
}

export async function isLinkedToCoach(studentId, coachId) {
  const doc = await getDb()
    .collection(COLLECTION)
    .doc(buildLinkDocId(coachId, studentId))
    .get();

  return doc.exists && doc.data().status === "active";
}

export async function getStudentCount(coachId) {
  const students = await listCoachStudents(coachId);
  return students.length;
}