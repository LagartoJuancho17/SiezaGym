import StudentDetailView from "@/components/coach/StudentDetailView";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import { listStudentAssignments } from "@/lib/assignments/assignments";
import { listUserRoutines } from "@/lib/routines/routines";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  if (!profile?.isCoach && !profile?.isAdmin) redirect("/");

  const { studentId } = await params;
  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) notFound();

  const [studentProfile, sessions, catalogExercises, assignments, coachRoutines] = await Promise.all([
    getUserProfile(studentId),
    listUserSessions(studentId, { limitCount: 100 }),
    listExercises(),
    listStudentAssignments(studentId),
    listUserRoutines(user.uid),
  ]);

  if (!studentProfile) notFound();

  const coachAssignments = (assignments || []).filter((a) => a.coachId === user.uid);

  return (
    <StudentDetailView
      studentProfile={{
        ...studentProfile,
        studentId: studentProfile.studentId || studentId,
      }}
      sessions={sessions}
      catalogExercises={catalogExercises}
      assignments={coachAssignments}
      coachRoutines={coachRoutines || []}
    />
  );
}
