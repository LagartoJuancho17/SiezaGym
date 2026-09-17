import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const data = vi.hoisted(() => ({ user: { uid: "owner" }, sessions: [], session: null, exercise: null, custom: null }));
vi.mock("@/lib/firebase/session", () => ({ getCurrentUser: vi.fn(async () => data.user) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("LOGIN"); }), notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
vi.mock("@/lib/sessions/sessions", () => ({ listUserSessions: vi.fn(async () => data.sessions), getUserSession: vi.fn(async () => data.session), listSessionsForExercise: vi.fn(async () => data.sessions) }));
vi.mock("@/lib/exercises/exercises", () => ({ listExercises: vi.fn(async () => []), getExerciseById: vi.fn(async () => data.exercise) }));
vi.mock("@/lib/customExercises/customExercises", () => ({ listCustomExercises: vi.fn(async () => data.custom ? [data.custom] : []), getCustomExercise: vi.fn(async () => data.custom) }));
vi.mock("@/components/design2/PageShell", () => ({ default: ({ title, children }) => createElement("main", { className: "d2" }, createElement("h1", null, title), children) }));
vi.mock("@/components/progress/ExerciseProgressChart", () => ({ default: ({ points }) => createElement("div", { "data-points": JSON.stringify(points) }) }));
import History from "@/app/(app)/historial/page";
import Detail from "@/app/(app)/historial/[id]/page";
import Progress from "@/app/(app)/progreso/[exerciseId]/page";
import { getUserSession, listSessionsForExercise } from "@/lib/sessions/sessions";
import { getCustomExercise } from "@/lib/customExercises/customExercises";

const session = (id, date, sets) => ({ id, routineName: "Fuerza", finishedAt: date, durationSeconds: 1800, totalSetsCompleted: sets.length, totalVolumeKg: 420, exercises: [{ exerciseId: "custom", sets }] });
const params = (key, value) => ({ params: Promise.resolve({ [key]: value }) });
beforeEach(() => { vi.clearAllMocks(); Object.assign(data, { user: { uid: "owner" }, sessions: [], session: null, exercise: null, custom: null }); });
describe("History and progress keep real data and ownership in design2", () => {
  it("requires login before reading private history", async () => { data.user = null; await expect(History()).rejects.toThrow("LOGIN"); });
  it("offers a working routine link in empty history", async () => { const html = renderToStaticMarkup(await History()); expect(html).toContain('href="/rutinas"'); expect(html).toContain("Todavía no terminaste"); });
  it("links real sessions and renders actual volume", async () => { data.sessions = [session("s1", "2026-09-15T15:00:00Z", [])]; const html = renderToStaticMarkup(await History()); expect(html).toContain('href="/historial/s1"'); expect(html).toContain("420 kg"); });
  it("looks up session detail within the current user", async () => { await expect(Detail(params("id", "foreign"))).rejects.toThrow("NOT_FOUND"); expect(getUserSession).toHaveBeenCalledWith("owner", "foreign"); });
  it("shows custom exercise names, failed sets and estimated labels", async () => { data.custom = { id: "custom", nameEs: "Mi ejercicio" }; data.session = session("s1", "2026-09-15T15:00:00Z", [{ weight: 60, reps: 5 }, { weight: 60, reps: 5, failed: true }]); const html = renderToStaticMarkup(await Detail(params("id", "s1"))); expect(html).toContain("Mi ejercicio"); expect(html).toContain("fallada"); expect(html).toContain("1RM est."); expect(html).toContain('href="/progreso/custom"'); });
  // Una serie fallada no da una marca: el resto de la app la descarta para el
  // 1RM, y mostrarla acá diría que levantaste algo que no levantaste.
  it("no le pone marca estimada a una serie fallada", async () => { data.custom = { id: "custom", nameEs: "Mi ejercicio" }; data.session = session("s1", "2026-09-15T15:00:00Z", [{ weight: 60, reps: 5, failed: true }]); const html = renderToStaticMarkup(await Detail(params("id", "s1"))); expect(html).toContain("sin marca"); expect(html).not.toContain("1RM est."); });
  it("supports owner custom exercises and excludes failed records", async () => { data.custom = { id: "custom", nameEs: "Mi ejercicio" }; data.sessions = [session("new", "2026-09-15T15:00:00Z", [{ weight: 200, reps: 5, failed: true }, { weight: 60, reps: 5 }]), session("old", "2026-09-14T15:00:00Z", [{ weight: 50, reps: 5 }])]; const view = await Progress(params("exerciseId", "custom")); const html = renderToStaticMarkup(view); expect(getCustomExercise).toHaveBeenCalledWith("owner", "custom"); expect(listSessionsForExercise).toHaveBeenCalledWith("owner", "custom"); expect(html).toContain("60 kg"); expect(html).not.toContain("200 kg"); expect(html).toContain("70.0 kg"); const chart = view.props.children.find((child) => child?.props?.points); expect(chart.props.points.map((point) => point.sessionId)).toEqual(["old", "new"]); });
  it("rejects unknown or inaccessible exercise ids", async () => { await expect(Progress(params("exerciseId", "foreign"))).rejects.toThrow("NOT_FOUND"); });
});
