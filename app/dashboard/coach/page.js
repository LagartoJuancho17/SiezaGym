import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listCoachStudents } from "@/lib/coach/students";
import { listAssignmentsByCoach } from "@/lib/assignments/assignments";
import { buildCoachDashboardSummary } from "@/lib/coach/dashboardSummary";
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

  const summary = buildCoachDashboardSummary(students, assignments);

  return (
    <CoachDashboardClient students={students} profile={profile} summary={summary} recentActivity={summary.recentActivity} />
  );
}
