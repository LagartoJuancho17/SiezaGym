import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

vi.mock("next/link", () => ({ default: ({ children, ...props }) => createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: (props) => createElement("img", props) }));
vi.mock("@/app/dashboard/coach/actions", () => ({ removeStudent: vi.fn(), generateInvitationCode: vi.fn(), revokeInvitationCode: vi.fn() }));
vi.mock("@/components/design2/PageShell", () => ({ default: ({ title, children, backHref }) => createElement("main", null, createElement("h1", null, title), createElement("a", { href: backHref }, "Volver"), children) }));
import StudentList from "@/components/coach/StudentList";
import CoachDashboardClient from "@/components/coach/CoachDashboardClient";
import StudentDetailView from "@/components/coach/StudentDetailView";
import AddStudentModal from "@/components/coach/AddStudentModal";

const student = { id: "link-1", studentId: "student-1", displayName: "Lucía Fernández", email: "lucia@example.com", linkedAt: "2026-09-14T12:00:00Z" };
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

describe("Coach design2 render contracts", () => {
  it("keeps student detail navigation, contact and accessible unlink action", () => {
    const html = render(StudentList, { students: [student] });
    expect(html).toContain('href="/dashboard/coach/alumnos/student-1"');
    expect(html).toContain("lucia@example.com");
    expect(html).toContain('aria-label="Eliminar a Lucía Fernández"');
    expect(html).toContain("d2-glass");
  });
  it("empty roster includes invitation entry point", () => {
    const html = render(StudentList, { students: [], onOpenAdd: () => {} });
    expect(html).toContain("No hay alumnos vinculados aún");
    expect(html).toContain("Invitar alumno");
  });
  it("dashboard shows actual roster and completion data", () => {
    const html = render(CoachDashboardClient, { students: [student], profile: { displayName: "Tobias Arraiza", isCoach: true }, recentActivity: [{ id: "a", studentName: student.displayName, routineName: "Piernas", completedAt: "2026-09-16T12:00:00Z", durationSeconds: 2700 }] });
    expect(html).toContain("<strong>1</strong>");
    expect(html).toContain("Piernas");
    expect(html).toContain("45 min");
    expect(html).toContain("Agregar alumno");
  });
  it("student history retains catalog exercise names, load, reps and session totals", () => {
    const html = render(StudentDetailView, { studentProfile: student, catalogExercises: [{ id: "squat", nameEs: "Sentadilla" }], sessions: [{ id: "s1", routineName: "Piernas", finishedAt: "2026-09-16T12:00:00Z", durationSeconds: 2700, totalVolumeKg: 600, exercises: [{ exerciseId: "squat", sets: [{ weight: 60, reps: 10 }] }] }] });
    for (const text of ["Sentadilla", "60kg×10", "600", "45 min", "Piernas", "Necesita al menos 2 sesiones"]) expect(html).toContain(text);
    expect(html).toContain('href="/dashboard/coach"');
  });
  it("empty student history is honest and invitation stays unmounted until opened", () => {
    const html = render(StudentDetailView, { studentProfile: student, sessions: [], catalogExercises: [] });
    expect(html).toContain("Todavía no entrenó.");
    expect(html).toContain("Todavía no tiene sesiones registradas.");
    expect(render(AddStudentModal, { open: false, onClose: () => {} })).toBe("");
  });
  it("student history displays rich multi-session analytics, kpis, search controls, and exercise set pills with top-set and 1RM", () => {
    const sessions = [
      {
        id: "s1",
        routineName: "Piernas",
        finishedAt: "2026-09-20T12:00:00Z",
        durationSeconds: 3000,
        totalVolumeKg: 1200,
        exercises: [{ exerciseId: "squat", sets: [{ weight: 100, reps: 6 }, { weight: 100, reps: 6 }] }],
      },
      {
        id: "s2",
        routineName: "Torso",
        finishedAt: "2026-09-24T12:00:00Z",
        durationSeconds: 2400,
        totalVolumeKg: 890,
        exercises: [{ exerciseId: "bench", sets: [{ weight: 80, reps: 8 }] }],
      },
    ];
    const catalog = [
      { id: "squat", nameEs: "Sentadilla", equipment: "barra", muscleWeights: { cuadriceps: 0.8, gluteo: 0.2 } },
      { id: "bench", nameEs: "Press de banca", equipment: "barra", muscleWeights: { pecho: 0.7, triceps: 0.3 } },
    ];
    const html = render(StudentDetailView, { studentProfile: student, sessions, catalogExercises: catalog });
    expect(html).toContain("Volumen (kg)");
    expect(html).toContain("Duración (min)");
    expect(html).toContain("Series");
    expect(html).toContain("Músculos");
    expect(html).toContain("Volumen Acumulado");
    expect(html).toContain("Promedio / Sesión");
    expect(html).toContain("Buscar por rutina o ejercicio...");
    expect(html).toContain("Sentadilla");
    expect(html).toContain("Press de banca");
    expect(html).toContain("100kg×6");
    expect(html).toContain("80kg×8");
    expect(html).toContain("Barra");
    expect(html).toContain("Colapsar todo");
  });
  it("coach components never restore legacy hardcoded palette", () => {
    const dir = new URL("../components/coach/", import.meta.url);
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".js"))) {
      const source = readFileSync(new URL(file, dir), "utf8");
      expect(source, file).not.toMatch(/#[a-fA-F0-9]{3,8}\b|var\(--(?:hair|faint|teal2|deep)\)|\b(?:bg-deep|text-teal2|text-white|text-faint)\b/);
    }
  });
});

const security = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getUserProfile: vi.fn(),
  isLinkedToCoach: vi.fn(),
  listUserSessions: vi.fn(),
  listExercises: vi.fn(),
  listStudentAssignments: vi.fn().mockResolvedValue([]),
  listUserRoutines: vi.fn().mockResolvedValue([]),
}));
vi.mock("next/navigation", () => ({
  redirect: (path) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("notFound"); },
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/firebase/session", () => ({ getCurrentUser: security.getCurrentUser }));
vi.mock("@/lib/users/users", () => ({ getUserProfile: security.getUserProfile }));
vi.mock("@/lib/coach/students", () => ({ isLinkedToCoach: security.isLinkedToCoach }));
vi.mock("@/lib/sessions/sessions", () => ({ listUserSessions: security.listUserSessions }));
vi.mock("@/lib/exercises/exercises", () => ({ listExercises: security.listExercises }));
vi.mock("@/lib/assignments/assignments", () => ({ listStudentAssignments: security.listStudentAssignments }));
vi.mock("@/lib/routines/routines", () => ({ listUserRoutines: security.listUserRoutines }));
vi.mock("@/lib/customExercises/customExercises", () => ({ listCustomExercises: vi.fn(async () => []) }));
import StudentDetailPage from "@/app/dashboard/coach/alumnos/[studentId]/page";

describe("Student detail authorization survives redesign", () => {
  it("requires a signed-in user", async () => {
    security.getCurrentUser.mockResolvedValueOnce(null);
    await expect(StudentDetailPage({ params: Promise.resolve({ studentId: "s" }) })).rejects.toThrow("redirect:/login");
  });
  it("rejects ordinary students", async () => {
    security.getCurrentUser.mockResolvedValueOnce({ uid: "student" });
    security.getUserProfile.mockResolvedValueOnce({ isCoach: false, isAdmin: false });
    await expect(StudentDetailPage({ params: Promise.resolve({ studentId: "s" }) })).rejects.toThrow("redirect:/");
  });
  it("rejects unrelated students even for coaches", async () => {
    security.getCurrentUser.mockResolvedValueOnce({ uid: "coach" });
    security.getUserProfile.mockResolvedValueOnce({ isCoach: true });
    security.isLinkedToCoach.mockResolvedValueOnce(false);
    await expect(StudentDetailPage({ params: Promise.resolve({ studentId: "s" }) })).rejects.toThrow("notFound");
    expect(security.isLinkedToCoach).toHaveBeenLastCalledWith("s", "coach");
  });
  it("passes only the linked student's fetched data to the view", async () => {
    security.getCurrentUser.mockResolvedValueOnce({ uid: "coach" });
    security.getUserProfile.mockResolvedValueOnce({ isCoach: true }).mockResolvedValueOnce(student);
    security.isLinkedToCoach.mockResolvedValueOnce(true);
    security.listUserSessions.mockResolvedValueOnce([]);
    security.listExercises.mockResolvedValueOnce([]);
    const element = await StudentDetailPage({ params: Promise.resolve({ studentId: "student-1" }) });
    expect(element.type).toBe(StudentDetailView);
    expect(element.props.studentProfile).toEqual(student);
    // 150 para que los récords y los PR miren toda la historia reciente.
    expect(security.listUserSessions).toHaveBeenLastCalledWith("student-1", { limitCount: 150 });
    expect(element.props.records).toEqual([]);
  });
});
