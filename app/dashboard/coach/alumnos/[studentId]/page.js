import StudentDetailView from "@/components/coach/StudentDetailView";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { isLinkedToCoach } from "@/lib/coach/students";
import { listUserSessions } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  if (!profile?.isCoach && !profile?.isAdmin) redirect("/");

  const { studentId } = await params;
  const linked = await isLinkedToCoach(studentId, user.uid);
  if (!linked) notFound();

  const [studentProfile, sessions, catalogExercises] = await Promise.all([
    getUserProfile(studentId),
    listUserSessions(studentId, { limitCount: 100 }),
    listExercises(),
  ]);

  if (!studentProfile) notFound();

  return <StudentDetailView studentProfile={studentProfile} sessions={sessions} catalogExercises={catalogExercises} />;
}
