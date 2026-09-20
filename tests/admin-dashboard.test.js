import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({ default: ({ children, ...props }) => createElement("a", props, children) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/firebase/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/admin/dashboard", () => ({
  formatAdminDate: (value) => value ? "16 sep 2026, 12:00" : "Sin fecha",
  formatDuration: (seconds) => `${Math.round(seconds / 60)} min`,
  getAdminDashboardData: vi.fn(),
}));
vi.mock("@/app/dashboard/actions", () => ({ logout: "/test/logout" }));

import { getCurrentUser } from "@/lib/firebase/session";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import AdminPage from "@/app/admin/page";

const fixture = {
  generatedAt: "2026-09-16T12:00:00.000Z",
  metrics: {
    userCount: 12,
    newUsers30: 4,
    activeUsers30: 8,
    coachCount: 2,
    sessionCount7: 17,
    sessionCount30: 60,
    routineCount: 21,
    templateCount: 3,
    assignmentCount: 9,
    customExerciseCount: 5,
    exerciseCount: 120,
    missingMediaCount: 2,
    inactiveUsers30: 4,
  },
  recentUsers: [{ uid: "u1", displayName: "Lucía", email: "lucia@example.com", isCoach: false, isAdmin: false, createdAt: "2026-09-15T12:00:00.000Z", lastLoginAt: "2026-09-16T12:00:00.000Z" }],
  recentCoaches: [{ uid: "c1", displayName: "Tobías", email: "tobias@example.com", isCoach: true, isAdmin: true }],
  recentRoutines: [{ id: "r1", kind: "Rutina personal", name: "Piernas", exerciseCount: 5, updatedAt: "2026-09-16T12:00:00.000Z" }],
  recentSessions: [{ id: "s1", userName: "Lucía", routineName: "Piernas", totalSetsCompleted: 12, durationSeconds: 2700, totalVolumeKg: 800, finishedAt: "2026-09-16T12:00:00.000Z" }],
  recentAssignments: [],
  catalogHealth: { total: 120, withMedia: 118, missingMedia: [{ id: "curl", nameEs: "Curl de bíceps" }] },
};

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ uid: "admin-uid", email: "totoarr17@gmail.com" });
  getAdminDashboardData.mockResolvedValue(fixture);
});

const render = (element) => renderToStaticMarkup(element);

describe("admin dashboard", () => {
  it("renders the operating overview and every admin section for an allowed email", async () => {
    const html = render(await AdminPage());
    for (const anchor of ["#overview", "#users", "#coaches", "#routines", "#catalog", "#sessions", "#security"]) {
      expect(html).toContain(`href=\"${anchor}\"`);
    }
    for (const text of ["Qué está pasando en SiezaGym", "12", "17", "Lucía", "Piernas", "Curl de bíceps", "totoarr17@gmail.com"]) {
      expect(html).toContain(text);
    }
    expect(getAdminDashboardData).toHaveBeenCalledOnce();
  });

  it("redirects anonymous visitors before reading admin data", async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    await expect(AdminPage()).rejects.toThrow("redirect:/login");
    expect(getAdminDashboardData).not.toHaveBeenCalled();
  });

  it("redirects signed-in users outside the allowlist", async () => {
    getCurrentUser.mockResolvedValueOnce({ uid: "student", email: "student@example.com" });
    await expect(AdminPage()).rejects.toThrow("redirect:/");
    expect(getAdminDashboardData).not.toHaveBeenCalled();
  });
});
