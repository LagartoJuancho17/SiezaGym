import { describe, expect, it } from "vitest";
import { shouldOpenCoachWorkspace } from "@/lib/coach/landing";

const macChrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/129.0 Safari/537.36";

describe("entrada al espacio del entrenador", () => {
  it("abre el panel para entrenadores y admins en escritorio", () => {
    expect(shouldOpenCoachWorkspace({ profile: { isCoach: true }, userAgent: macChrome, mobileHint: "?0" })).toBe(true);
    expect(shouldOpenCoachWorkspace({ profile: { isAdmin: true }, userAgent: macChrome, mobileHint: "?0" })).toBe(true);
  });

  it("mantiene la Home de atleta para usuarios comunes y móviles", () => {
    expect(shouldOpenCoachWorkspace({ profile: {}, userAgent: macChrome })).toBe(false);
    expect(shouldOpenCoachWorkspace({ profile: { isAdmin: true }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" })).toBe(false);
    expect(shouldOpenCoachWorkspace({ profile: { isCoach: true }, userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)", mobileHint: "?1" })).toBe(false);
    expect(shouldOpenCoachWorkspace({ profile: { isAdmin: true } })).toBe(false);
  });

  it("permite volver voluntariamente a la Home de atleta sin bucle", () => {
    expect(shouldOpenCoachWorkspace({ profile: { isAdmin: true }, userAgent: macChrome, requestedView: "athlete" })).toBe(false);
  });
});
