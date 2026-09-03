import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import { listAssignmentsByCoach } from "@/lib/assignments/assignments";
import CoachDashboardClient from "@/components/coach/CoachDashboardClient";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.uid);

  if (!profile?.isCoach && !profile?.isAdmin) {
    redirect("/");
  }

  const [students, assignments] = await Promise.all([
    listCoachStudents(user.uid),
    listAssignmentsByCoach(user.uid),
  ]);

  const studentNameById = new Map(students.map((s) => [s.studentId, s.displayName]));
  const recentActivity = assignments
    .filter((a) => a.lastCompletedAt)
    .map((a) => ({
      id: a.id,
      studentName: studentNameById.get(a.studentId) || "Alumno",
      routineName: a.routineName,
      completedAt: a.lastCompletedAt,
      durationSeconds: a.lastDurationSeconds || 0,
    }))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 10);

  return (
    <CoachDashboardClient students={students} profile={profile} recentActivity={recentActivity} />
  );
}
