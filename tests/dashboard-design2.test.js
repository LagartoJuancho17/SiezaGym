import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({ default: ({ children, ...props }) => createElement("a", props, children) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path) => { throw new Error(`redirect:${path}`); }), notFound: vi.fn(() => { throw new Error("notFound"); }) }));
vi.mock("@/components/design2/PageShell", () => ({ default: ({ title, children }) => createElement("main", { className: "d2" }, createElement("h1", null, title), children) }));
vi.mock("@/lib/firebase/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/users/users", () => ({ getUserProfile: vi.fn() }));
vi.mock("@/lib/items/items", () => ({ listUserItems: vi.fn(), getUserItem: vi.fn() }));
vi.mock("@/lib/sessions/sessions", () => ({ listUserSessions: vi.fn(), listTrainedDates: vi.fn() }));
vi.mock("@/lib/exercises/exercises", () => ({ listExercises: vi.fn() }));
vi.mock("@/app/dashboard/actions", () => ({ logout: "/test/logout" }));
vi.mock("@/app/dashboard/items/actions", () => ({ createItem: "/test/create", deleteItem: vi.fn(), updateItem: vi.fn() }));

import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";
import { listUserItems, getUserItem } from "@/lib/items/items";
import { listUserSessions, listTrainedDates } from "@/lib/sessions/sessions";
import { listExercises } from "@/lib/exercises/exercises";
import Dashboard from "@/app/dashboard/page";
import Items from "@/app/dashboard/items/page";
import EditItem from "@/app/dashboard/items/[id]/edit/page";
import ItemForm from "@/components/items/ItemForm";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ uid: "private-uid", email: "athlete@example.com" });
  getUserProfile.mockResolvedValue({ displayName: "Tobías" });
  listUserItems.mockResolvedValue([]);
  listUserSessions.mockResolvedValue([]);
  listTrainedDates.mockResolvedValue([]);
  listExercises.mockResolvedValue([]);
});

const render = (element) => renderToStaticMarkup(element);

describe("Dashboard design2", () => {
  it("offers the complete personal navigation, items and sign out without exposing backend details", async () => {
    const html = render(await Dashboard());
    for (const path of ["/rutinas", "/historial", "/progreso", "/perfil", "/dashboard/items"]) expect(html).toContain(`href="${path}"`);
    expect(html).toContain("Cerrar sesión");
    expect(html).toContain("Tu progreso empieza con una sesión");
    expect(html).not.toMatch(/private-uid|Firestore|ABM|dashboard\/coach/);
  });
  it.each([{ isCoach: true }, { isAdmin: true }])("exposes the coach area for authorized profiles %j", async (profile) => {
    getUserProfile.mockResolvedValue(profile);
    expect(render(await Dashboard())).toContain('href="/dashboard/coach"');
  });
  it.each([Dashboard, Items, EditItem])("protects every page before reading user data", async (page) => {
    getCurrentUser.mockResolvedValue(null);
    await expect(page({ params: Promise.resolve({ id: "other" }) })).rejects.toThrow("redirect:/login");
    expect(listUserItems).not.toHaveBeenCalled();
    expect(getUserItem).not.toHaveBeenCalled();
  });
  it("renders saved items with translated status, edit and delete controls", async () => {
    listUserItems.mockResolvedValue([{ id: "one", title: "Movilidad", description: "Antes de entrenar", status: "active" }]);
    const html = render(await Items());
    expect(html).toContain("Movilidad");
    expect(html).toContain("Activo");
    expect(html).toContain('href="/dashboard/items/one/edit"');
    expect(html).toContain('aria-label="Eliminar Movilidad"');
    expect(listUserItems).toHaveBeenCalledWith("private-uid");
  });
  it("uses a helpful empty state and keeps item creation available", async () => {
    const html = render(await Items());
    expect(html).toContain("Todavía no tenés items");
    expect(html).toContain('name="title"');
    expect(html).toContain("Crear item");
  });
  it("never renders another user's or a missing item", async () => {
    getUserItem.mockResolvedValue(null);
    await expect(EditItem({ params: Promise.resolve({ id: "other" }) })).rejects.toThrow("notFound");
    expect(getUserItem).toHaveBeenCalledWith("private-uid", "other");
  });
  it("preserves the editable values and all three status options", () => {
    const html = render(createElement(ItemForm, { action: "/test", item: { title: "Plan", description: "Detalles", status: "completed" } }));
    expect(html).toContain('value="Plan"');
    expect(html).toContain("Detalles");
    expect(html).toMatch(/value="completed" selected=""/);
    for (const status of ["pending", "active", "completed"]) expect(html).toContain(`value="${status}"`);
  });
  it("shows real session metrics including failed sets, muscle volume and intensity", () => {
    const html = render(createElement(DashboardMetrics, {
      now: new Date("2026-09-16T15:00:00Z"), trainedDates: ["2026-09-16"], profile: {},
      exercises: [{ id: "bench", muscleWeights: { pecho: 1 }, pattern: "empuje_horizontal" }],
      sessions: [{ finishedAt: "2026-09-16T14:00:00Z", totalVolumeKg: 500, totalSetsCompleted: 1, durationSeconds: 120, exercises: [{ exerciseId: "bench", sets: [{ weight: 50, reps: 10 }, { weight: 70, reps: 5, failed: true }] }] }],
    }));
    expect(html).toContain("1 de 2 · 50%");
    expect(html).toContain("500 kg");
    expect(html).toContain("Volumen · esta semana");
    expect(html).toContain("75% · Alta");
    expect(html).toContain("usando 75 kg");
    expect(html).toContain("1 día");
    expect(html).toContain("Distribución y evolución");
  });
});
