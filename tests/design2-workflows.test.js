import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { moveExercise, chosenExercises } from "@/lib/routines/compose";

vi.mock("next/link", () => ({ default: ({ children, ...props }) => createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ unoptimized: _u, ...props }) => createElement("img", props) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/coach", useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/app/actions", () => ({ redeemInvitationCode: vi.fn() }));
vi.mock("@/app/(app)/rutinas/actions", () => ({ createCustomExercise: vi.fn(), createRoutine: vi.fn(), updateRoutine: vi.fn() }));
import PageShell from "@/components/design2/PageShell";
import CoachConnection from "@/components/design2/CoachConnection";
import RoutineComposer from "@/components/design2/RoutineComposer";
import ExercisePicker from "@/components/design2/ExercisePicker";
import CustomExerciseForm from "@/components/routines/CustomExerciseForm";

const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
const exercises = [
  { id: "press", nameEs: "Press banca", registrationType: "peso_reps", muscleWeights: { pectorales: 1 } },
  { id: "remo", nameEs: "Remo", registrationType: "peso_reps", muscleWeights: { dorsales: 1 } },
];

describe("Migración completa design2", () => {
  it("cada pantalla secundaria conserva título, regreso y una sola navegación", () => {
    const html = render(PageShell, { title: "Mis alumnos", backHref: "/", children: "Contenido" });
    expect(html).toContain("Mis alumnos");
    expect(html).toContain('aria-label="Volver"');
    expect(html.match(/aria-label="Navegación principal"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/perfil"[^>]+aria-current="page"/);
  });
  it("ofrece código de profesor solo sin vínculo y conserva el nombre cuando lo hay", () => {
    const empty = render(CoachConnection, {});
    expect(empty).toContain("Vincular profesor");
    expect(empty).toContain('pattern="[A-Za-z0-9]{3}-[A-Za-z0-9]{3}"');
    const linked = render(CoachConnection, { coach: { displayName: "Lucía" } });
    expect(linked).toContain("Entrenás con Lucía");
    expect(linked).not.toContain("<input");
  });
  it("restaura notas y controles para ordenar sin descartar prescripciones", () => {
    const html = render(RoutineComposer, { exercises, routine: { id: "r1", name: "Fuerza", note: "Descansar dos minutos", exercises: exercises.map(e => ({ exerciseId: e.id, targetSets: 3, targetReps: 10 })) } });
    expect(html).toContain("Descansar dos minutos");
    expect(html).toContain('aria-label="Bajar Press banca"');
    expect(html).toContain('aria-label="Subir Remo"');
  });
  it("permite crear ejercicios propios desde el selector", () => {
    const html = render(ExercisePicker, { exercises, alreadyAdded: new Set(), onCreated: vi.fn() });
    expect(html).toContain("Crear ejercicio propio");
    expect(html).toContain("Press banca");
    const form = render(CustomExerciseForm, {});
    for (const label of ["Nombre", "Equipamiento", "Patrón", "Tipo de registro", "Descripción", "Músculos que trabaja"]) expect(form).toContain(label);
    expect(form).not.toMatch(/text-teal|bg-glass2|border-hair/);
  });
  it("equipamiento, patrón y músculos son opcionales al crear un ejercicio propio", () => {
    const form = render(CustomExerciseForm, {});
    expect(form).toContain("Sin especificar (opcional)");
    expect(form).toContain("Músculos que trabaja (opcional)");
  });
});

describe("Selección y orden: regresión y casos límite", () => {
  it("seleccionar en distintos filtros conserva todos los ejercicios al confirmar", () => {
    const chosen = new Set(["remo", "press"]);
    expect(chosenExercises(exercises, chosen)).toEqual(exercises);
    expect(chosenExercises(exercises, new Set())).toEqual([]);
    expect(chosenExercises(exercises, new Set(["missing"]))).toEqual([]);
  });
  it("mover conserva referencias y datos y nunca modifica el array original", () => {
    const items = exercises.map(e => ({ exerciseId: e.id, sets: [{ reps: 10, weight: 25 }] }));
    const result = moveExercise(items, 0, 1);
    expect(result).toEqual([items[1], items[0]]);
    expect(result[1]).toBe(items[0]);
    expect(items[0].exerciseId).toBe("press");
    expect(moveExercise(items, 0, -1)).toBe(items);
    expect(moveExercise(items, 1, 2)).toBe(items);
    expect(moveExercise([], 0, 1)).toEqual([]);
  });
});
