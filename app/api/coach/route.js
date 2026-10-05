import { NextResponse } from "next/server";
import { withCoach } from "@/lib/api/auth";
import { getPendingCode } from "@/lib/coach/codes";
import { listCoachStudents } from "@/lib/coach/students";
import { listAssignmentsByCoach } from "@/lib/assignments/assignments";
import { buildCoachDashboardSummary } from "@/lib/coach/dashboardSummary";

/**
 * El panel del entrenador para la app de iOS: alumnos, resumen y el código de
 * invitación vigente. Mismas funciones que /dashboard/coach en la web.
 */
export async function GET(request) {
  return withCoach(request, async (uid) => {
    const [students, assignments, code] = await Promise.all([
      listCoachStudents(uid),
      listAssignmentsByCoach(uid),
      getPendingCode(uid),
    ]);
    const summary = buildCoachDashboardSummary(students, assignments);
    return NextResponse.json({
      code,
      students: students.map((student) => ({
        studentId: student.studentId,
        displayName: student.displayName,
        email: student.email,
        photoURL: student.photoURL,
        linkedAt: student.linkedAt,
        plans: summary.plansByStudent[student.studentId] || 0,
      })),
      summary: {
        linkedStudents: summary.linkedStudents,
        assignedPlans: summary.assignedPlans,
        studentsWithActivity: summary.studentsWithActivity,
        planCoveragePct: summary.planCoveragePct,
      },
      recentActivity: summary.recentActivity,
    });
  });
}
