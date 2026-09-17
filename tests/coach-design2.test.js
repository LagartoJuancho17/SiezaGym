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
  it("coach components never restore legacy hardcoded palette", () => {
    const dir = new URL("../components/coach/", import.meta.url);
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".js"))) {
      const source = readFileSync(new URL(file, dir), "utf8");
      expect(source, file).not.toMatch(/#[a-fA-F0-9]{3,8}\b|var\(--(?:hair|faint|teal2|deep)\)|\b(?:bg-deep|text-teal2|text-white|text-faint)\b/);
    }
  });
});

const security = vi.hoisted(() => ({ getCurrentUser: vi.fn(), getUserProfile: vi.fn(), isLinkedToCoach: vi.fn(), listUserSessions: vi.fn(), listExercises: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path) => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("notFound"); } }));
vi.mock("@/lib/firebase/session", () => ({ getCurrentUser: security.getCurrentUser }));
vi.mock("@/lib/users/users", () => ({ getUserProfile: security.getUserProfile }));
vi.mock("@/lib/coach/students", () => ({ isLinkedToCoach: security.isLinkedToCoach }));
vi.mock("@/lib/sessions/sessions", () => ({ listUserSessions: security.listUserSessions }));
vi.mock("@/lib/exercises/exercises", () => ({ listExercises: security.listExercises }));
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
    expect(security.listUserSessions).toHaveBeenLastCalledWith("student-1", { limitCount: 100 });
  });
});
