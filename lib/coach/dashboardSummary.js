/** Metrics for the coach dashboard. Only linked students count toward totals. */
export function buildCoachDashboardSummary(students = [], assignments = []) {
  const linkedIds = new Set(students.map((student) => student.studentId));
  const visibleAssignments = assignments.filter((assignment) => linkedIds.has(assignment.studentId));
  const assignedStudentIds = new Set(visibleAssignments.map((assignment) => assignment.studentId));
  const completed = visibleAssignments.filter((assignment) => assignment.lastCompletedAt);
  const activeStudentIds = new Set(completed.map((assignment) => assignment.studentId));
  const names = new Map(students.map((student) => [student.studentId, student.displayName || "Alumno"]));
  const plansByStudent = Object.fromEntries(students.map((student) => [student.studentId, 0]));

  for (const assignment of visibleAssignments) plansByStudent[assignment.studentId] += 1;

  return {
    linkedStudents: students.length,
    assignedPlans: visibleAssignments.length,
    studentsWithPlans: assignedStudentIds.size,
    studentsWithActivity: activeStudentIds.size,
    planCoveragePct: students.length ? Math.round((assignedStudentIds.size / students.length) * 100) : 0,
    plansByStudent,
    recentActivity: completed
      .map((assignment) => ({
        id: assignment.id,
        studentId: assignment.studentId,
        studentName: names.get(assignment.studentId),
        routineName: assignment.routineName || "Rutina sin nombre",
        completedAt: assignment.lastCompletedAt,
        durationSeconds: assignment.lastDurationSeconds || 0,
      }))
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10),
  };
}
