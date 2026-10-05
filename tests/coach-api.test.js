import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/admin", () => ({ getAdminAuth: vi.fn() }));
vi.mock("@/lib/users/users", () => ({ getUserProfile: vi.fn() }));
vi.mock("@/lib/coach/codes", () => ({
  getPendingCode: vi.fn(),
  generateCode: vi.fn(),
  revokeCode: vi.fn(),
  redeemCode: vi.fn(),
}));
vi.mock("@/lib/coach/students", () => ({
  listCoachStudents: vi.fn(),
  isLinkedToCoach: vi.fn(),
  removeStudent: vi.fn(),
  getLinkedCoach: vi.fn(),
  unlinkCoachFromStudent: vi.fn(),
}));
vi.mock("@/lib/assignments/assignments", () => ({
  listAssignmentsByCoach: vi.fn(),
  listStudentAssignments: vi.fn(),
  assignRoutineToStudent: vi.fn(),
  unassignRoutine: vi.fn(),
}));
vi.mock("@/lib/routines/routines", () => ({ getUserRoutine: vi.fn() }));
vi.mock("@/lib/sessions/sessions", () => ({ listUserSessions: vi.fn() }));
vi.mock("@/lib/exercises/exercises", () => ({ listExercises: vi.fn(async () => [{ id: "e", nameEs: "Press de banca" }]) }));
vi.mock("@/lib/customExercises/customExercises", () => ({ listCustomExercises: vi.fn(async () => []) }));

import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/users/users";
import { generateCode, getPendingCode, redeemCode } from "@/lib/coach/codes";
import { isLinkedToCoach, listCoachStudents, getLinkedCoach } from "@/lib/coach/students";
import { assignRoutineToStudent, listAssignmentsByCoach, listStudentAssignments } from "@/lib/assignments/assignments";
import { getUserRoutine } from "@/lib/routines/routines";
import { listUserSessions } from "@/lib/sessions/sessions";
import { GET as panel } from "@/app/api/coach/route";
import { POST as codigo } from "@/app/api/coach/codigo/route";
import { GET as alumno } from "@/app/api/coach/alumnos/[id]/route";
import { POST as asignar } from "@/app/api/coach/asignaciones/route";
import { POST as vincular } from "@/app/api/coach/vinculo/route";

const verifyIdToken = vi.fn();
const req = (body, method = "GET") =>
  new Request("https://example.test/api/coach", {
    method,
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const params = (id) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getAdminAuth.mockReturnValue({ verifyIdToken });
  verifyIdToken.mockResolvedValue({ uid: "coach1" });
  getUserProfile.mockResolvedValue({ isCoach: true, displayName: "Coach" });
});

describe("/api/coach", () => {
  it("una cuenta que no es coach recibe 403, no el panel", async () => {
    getUserProfile.mockResolvedValue({ isCoach: false });
    const response = await panel(req());
    expect(response.status).toBe(403);
    expect(listCoachStudents).not.toHaveBeenCalled();
  });

  it("el panel trae alumnos, resumen y el código vigente", async () => {
    listCoachStudents.mockResolvedValue([{ studentId: "s1", displayName: "Ana", linkedAt: "2026-10-01T00:00:00Z" }]);
    listAssignmentsByCoach.mockResolvedValue([{ id: "a1", studentId: "s1", routineName: "Upper", lastCompletedAt: "2026-10-03T00:00:00Z" }]);
    getPendingCode.mockResolvedValue({ code: "ABC-234", expiresAt: "2026-10-06T00:00:00Z" });
    const body = await (await panel(req())).json();
    expect(body.code.code).toBe("ABC-234");
    expect(body.students[0]).toMatchObject({ studentId: "s1", displayName: "Ana", plans: 1 });
    expect(body.summary.linkedStudents).toBe(1);
    expect(body.recentActivity[0].routineName).toBe("Upper");
  });

  it("generar el código lo puede pedir cualquiera con sesión: así se vuelve coach", async () => {
    getUserProfile.mockResolvedValue({ isCoach: false });
    generateCode.mockResolvedValue({ code: "XYZ-789", expiresAt: "x" });
    const response = await codigo(req(null, "POST"));
    expect((await response.json()).code).toBe("XYZ-789");
    expect(generateCode).toHaveBeenCalledWith("coach1");
  });

  it("no se ve el detalle de un alumno que no está vinculado", async () => {
    isLinkedToCoach.mockResolvedValue(false);
    const response = await alumno(req(), params("ajeno"));
    expect(response.status).toBe(404);
    expect(listUserSessions).not.toHaveBeenCalled();
  });

  it("el detalle muestra solo las asignaciones de este coach", async () => {
    isLinkedToCoach.mockResolvedValue(true);
    getUserProfile.mockImplementation(async (uid) => (uid === "coach1" ? { isCoach: true } : { displayName: "Ana" }));
    listUserSessions.mockResolvedValue([
      { id: "nueva", routineName: "Upper", finishedAt: "2026-10-03T10:00:00Z", exercises: [{ exerciseId: "e", sets: [{ reps: 8, weight: 80 }] }] },
      { id: "vieja", routineName: "Upper", finishedAt: "2026-09-28T10:00:00Z", exercises: [{ exerciseId: "e", sets: [{ reps: 8, weight: 70 }] }] },
    ]);
    listStudentAssignments.mockResolvedValue([
      { id: "a1", coachId: "coach1", routineName: "Upper", exercises: [1, 2] },
      { id: "a2", coachId: "otro", routineName: "De otro", exercises: [] },
    ]);
    const body = await (await alumno(req(), params("s1"))).json();
    expect(body.student.displayName).toBe("Ana");
    expect(body.assignments.map((a) => a.id)).toEqual(["a1"]);
    // Peso, reps y si batió el récord anterior (80 × 8 > 70 × 8).
    expect(body.sessions[0].exercises[0].sets).toEqual([{ weight: 80, reps: 8, failed: false, pr: true }]);
    expect(body.sessions[1].exercises[0].sets[0].pr).toBe(false);
    expect(body.records[0]).toMatchObject({ exerciseId: "e", bestSet: { weight: 80, reps: 8 }, maxWeightKg: 80 });
    expect(body.exerciseNames).toEqual({ e: "Press de banca" });
  });

  it("asignar exige que la rutina sea del coach y el alumno esté vinculado", async () => {
    getUserRoutine.mockResolvedValue(null);
    expect((await asignar(req({ studentId: "s1", routineId: "r" }, "POST"))).status).toBe(404);

    getUserRoutine.mockResolvedValue({ id: "r", name: "Upper" });
    isLinkedToCoach.mockResolvedValue(false);
    expect((await asignar(req({ studentId: "s1", routineId: "r" }, "POST"))).status).toBe(403);
    expect(assignRoutineToStudent).not.toHaveBeenCalled();

    isLinkedToCoach.mockResolvedValue(true);
    assignRoutineToStudent.mockResolvedValue("nuevo");
    const ok = await asignar(req({ studentId: "s1", routineId: "r", weekNumber: "2" }, "POST"));
    expect((await ok.json()).id).toBe("nuevo");
    expect(assignRoutineToStudent).toHaveBeenCalledWith("coach1", "s1", { id: "r", name: "Upper" }, { weekNumber: 2, note: "" });
  });
});

describe("/api/coach/vinculo (alumno)", () => {
  it("un código inválido devuelve el motivo", async () => {
    redeemCode.mockResolvedValue({ success: false, error: "Código inválido o ya utilizado." });
    const response = await vincular(req({ code: "nope" }, "POST"));
    expect(response.status).toBe(400);
    expect((await response.json()).mensaje).toBe("Código inválido o ya utilizado.");
  });

  it("con un código válido queda vinculado y devuelve el coach", async () => {
    redeemCode.mockResolvedValue({ success: true, coachId: "c" });
    getLinkedCoach.mockResolvedValue({ coachId: "c", displayName: "Coach" });
    const body = await (await vincular(req({ code: "ABC-234" }, "POST"))).json();
    expect(body.coach.displayName).toBe("Coach");
    expect(redeemCode).toHaveBeenCalledWith("ABC-234", "coach1");
  });
});
