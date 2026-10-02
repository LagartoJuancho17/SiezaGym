import { describe, expect, it } from "vitest";
import { buildCoachDashboardSummary } from "@/lib/coach/dashboardSummary";

const students = [
  { studentId: "a", displayName: "Ana" },
  { studentId: "b", displayName: "Bruno" },
];

describe("coach dashboard summary", () => {
  it("counts only current linked students and their assigned plans", () => {
    const result = buildCoachDashboardSummary(students, [
      { id: "p1", studentId: "a", routineName: "Piernas", lastCompletedAt: "2026-09-30T12:00:00Z", lastDurationSeconds: 2700 },
      { id: "p2", studentId: "a", routineName: "Torso" },
      { id: "removed", studentId: "old", lastCompletedAt: "2026-10-01T12:00:00Z" },
    ]);
    expect(result).toMatchObject({ linkedStudents: 2, assignedPlans: 2, studentsWithPlans: 1, studentsWithActivity: 1, planCoveragePct: 50, plansByStudent: { a: 2, b: 0 } });
    expect(result.recentActivity).toEqual([{ id: "p1", studentId: "a", studentName: "Ana", routineName: "Piernas", completedAt: "2026-09-30T12:00:00Z", durationSeconds: 2700 }]);
  });

  it("sorts latest completions and remains honest for an empty team", () => {
    expect(buildCoachDashboardSummary([], [{ id: "ghost", studentId: "old" }])).toMatchObject({ linkedStudents: 0, assignedPlans: 0, planCoveragePct: 0, recentActivity: [] });
    const result = buildCoachDashboardSummary(students, [
      { id: "older", studentId: "a", lastCompletedAt: "2026-09-01T12:00:00Z" },
      { id: "newer", studentId: "b", lastCompletedAt: "2026-10-01T12:00:00Z" },
    ]);
    expect(result.recentActivity.map((item) => item.id)).toEqual(["newer", "older"]);
  });
});
