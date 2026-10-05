import StudentDetailView from "@/components/coach/StudentDetailView";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listUserRoutines } from "@/lib/routines/routines";
import { listCustomExercises } from "@/lib/customExercises/customExercises";
import { markRecordSets, personalRecords } from "@/lib/progress/records";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  if (!profile?.isCoach && !profile?.isAdmin) redirect("/");

  const { studentId } = await params;
  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) notFound();

  const [studentProfile, history, catalogExercises, customExercises, assignments, coachRoutines] = await Promise.all([
    getUserProfile(studentId),
    listUserSessions(studentId, { limitCount: 150 }),
    listExercises(),
    listCustomExercises(studentId),
    listStudentAssignments(studentId),
    listUserRoutines(user.uid),
  ]);

  if (!studentProfile) notFound();

  // Cada serie sabe si batió el mejor 1RM que el ejercicio tenía antes, y
  // los récords salen de toda la historia (lib/progress/records.js, igual que
  // el panel de la app).
  const sessions = markRecordSets(history).slice(0, 100);
  const records = personalRecords(history);

  const coachAssignments = (assignments || []).filter((a) => a.coachId === user.uid);

  return (
    <StudentDetailView
      studentProfile={{
        ...studentProfile,
        studentId: studentProfile.studentId || studentId,
      }}
      sessions={sessions}
      catalogExercises={[...catalogExercises, ...customExercises]}
      records={records}
      assignments={coachAssignments}
      coachRoutines={coachRoutines || []}
    />
  );
}
