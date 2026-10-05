import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("Evaluación: coach, compartir, rutinas armadas y agregar ejercicio (iOS)", () => {
  it("el panel del entrenador está en la app y habla con la API de la web", () => {
    const profile = read("ios/SiezaGym/Features/Profile/ProfileScreen.swift");
    expect(profile).toContain("CoachPanelScreen(store: store)");
    expect(profile).toContain("VinculoCoachScreen(store: store)");
    const api = read("ios/SiezaGym/Services/CoachAPI.swift");
    for (const ruta of ["/api/coach", "/api/coach/codigo", "/api/coach/alumnos/", "/api/coach/asignaciones", "/api/coach/vinculo"]) {
      expect(api).toContain(ruta);
    }
    for (const ruta of ["route.js", "codigo/route.js", "alumnos/[id]/route.js", "asignaciones/route.js", "asignaciones/[id]/route.js", "vinculo/route.js"]) {
      expect(existsSync(new URL(`../app/api/coach/${ruta}`, import.meta.url)), ruta).toBe(true);
    }
    // Cada pedido lleva el ID token, y el servidor saca el uid de ahí.
    expect(read("ios/SiezaGym/Services/WebAPI.swift")).toContain('"Bearer \\(token)"');
    expect(read("lib/api/auth.js")).toContain("verifyIdToken");
  });

  it("compartir: botón en el detalle, link público y apertura en la app", () => {
    expect(read("ios/SiezaGym/Features/Routines/RoutineDetailScreen.swift")).toContain("WebAPI().compartir(actual");
    expect(read("ios/project.yml")).toMatch(/CFBundleURLSchemes:\s*\n\s*- siezagym/);
    expect(read("ios/SiezaGym/SiezaGymApp.swift")).toContain("EnlacesEntrantes.compartido.abrir(url)");
    const page = read("app/r/[id]/page.js");
    expect(page).toContain("siezagym://r/${id}");
    expect(page).toContain("Agregar a mis rutinas");
  });

  it("10 rutinas armadas a un toque desde Rutinas", () => {
    expect(read("ios/SiezaGym/Features/Routines/RoutinesScreen.swift")).toContain("RutinasArmadasScreen(store: store)");
    const data = JSON.parse(read("contracts/rutinas-armadas.json"));
    expect(data.rutinas).toHaveLength(10);
  });

  it("agregar ejercicio en medio del entrenamiento", () => {
    const view = read("ios/SiezaGym/Features/Workout/WorkoutView.swift");
    expect(view).toContain('Label("Agregar ejercicio", systemImage: "plus")');
    expect(view).toContain("draft.agregarEjercicios(elegidos)");
  });
});

describe("Evaluación: lo mismo en la web", () => {
  it("compartir desde el detalle de la rutina, con el mismo link que la app", () => {
    const screen = read("components/design2/RoutineScreen.js");
    expect(screen).toContain("Compartir link");
    expect(screen).toContain("shareRoutineLink({ routineId: routine.id, isAssigned: routine.isAssigned })");
    expect(read("app/(app)/rutinas/[id]/actions.js")).toContain("shareRoutine(");
  });

  it("rutinas armadas desde Rutinas, de la misma lista que la app", () => {
    expect(read("app/(app)/rutinas/page.js")).toContain('href="/rutinas/armadas"');
    expect(read("lib/routines/templates.js")).toContain('@/contracts/rutinas-armadas.json');
    expect(read("ios/project.yml")).toContain("../contracts/rutinas-armadas.json");
  });

  it("agregar ejercicio en la planilla, que llega a la sesión también en rutinas asignadas", () => {
    const screen = read("components/design2/RoutineScreen.js");
    expect(screen).toContain("Agregar ejercicio");
    expect(screen).toContain("liveExercises: liveSessionExercises(extra, sheet, notes)");
    expect(read("lib/assignments/assignments.js")).toContain("cleanLiveExercises(liveExercises");
  });
});
