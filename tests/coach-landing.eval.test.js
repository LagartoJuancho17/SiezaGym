import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("evaluación de entrada al panel web", () => {
  it("redirige desde la raíz antes de cargar datos exclusivos de atleta", () => {
    const home = read("app/(app)/page.js");
    expect(home.indexOf('redirect("/dashboard/coach")')).toBeLessThan(home.indexOf("listUserRoutines(user.uid)"));
    expect(home).toContain("shouldOpenCoachWorkspace({");
  });

  it("conserva una salida explícita a la Home de atleta", () => {
    expect(read("components/coach/CoachPageShell.js")).toContain('href="/?view=athlete"');
    expect(read("components/coach/CoachDashboardClient.js")).toContain('backHref="/?view=athlete"');
  });
});
