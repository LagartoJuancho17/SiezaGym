import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const listSource = read("components/design2/RoutineList.js");
const holdSource = read("components/design2/useHold.js");
const sheetSource = read("components/design2/RoutineHoldSheet.js");
const pageSource = read("app/(app)/rutinas/page.js");
const cssSource = read("app/design2.css");

describe("Mantener presionada una rutina", () => {
  it("la lista abre la hoja al mantener presionado", () => {
    expect(listSource).toContain("useHold(() => onHold(routine)");
    expect(listSource).toContain("<RoutineHoldSheet");
  });

  it("no la ofrece en las rutinas asignadas", () => {
    // No hay ninguna acción que el alumno pueda hacer sobre la copia del coach:
    // abrir un menú con todo apagado es peor que no abrirlo.
    expect(listSource).toContain("enabled: hasMenu(routine)");
  });

  it("la lista sabe si la rutina está en la portada", () => {
    // Sin esto la acción no puede decir si pone o saca.
    expect(pageSource).toContain("showOnHome: item.showOnHome !== false");
  });
});

describe("El gesto", () => {
  it("escucha eventos de puntero, que cubren dedo, mouse y lápiz", () => {
    for (const handler of ["onPointerDown", "onPointerMove", "onPointerUp", "onPointerCancel"]) {
      expect(holdSource).toContain(handler);
    }
  });

  it("se cancela si el dedo se corre, para no romper el scroll", () => {
    expect(holdSource).toContain("MOVE_TOLERANCE_PX");
    expect(holdSource).toContain("if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancel();");
  });

  it("no navega al detalle después de abrir el menú", () => {
    // Al levantar el dedo se dispara un click sobre la fila, que es un enlace.
    expect(holdSource).toContain("opened.current = true");
    expect(holdSource).toContain("event.preventDefault()");
  });

  it("en una computadora se abre con el clic derecho", () => {
    expect(holdSource).toContain("onContextMenu");
  });

  it("limpia el temporizador al desmontar", () => {
    expect(holdSource).toContain("useEffect(() => cancel, [cancel])");
  });

  it("aguanta que no haya vibración", () => {
    // navigator.vibrate no existe en iOS.
    expect(holdSource).toContain("navigator.vibrate?.(");
  });
});

describe("La hoja", () => {
  it("usa las acciones de servidor que ya existían", () => {
    expect(sheetSource).toContain('from "@/app/(app)/rutinas/actions"');
    for (const action of ["deleteRoutine", "duplicateRoutine", "setRoutineShowOnHome"]) {
      expect(sheetSource).toContain(action);
    }
  });

  it("pide confirmación antes de eliminar, en la misma hoja", () => {
    // Dos capas de superposición sobre una lista no se pueden seguir.
    expect(sheetSource).toContain("setConfirming(true)");
    expect(sheetSource).toContain("No se puede deshacer.");
  });

  it("se cierra con Escape y tocando afuera", () => {
    expect(sheetSource).toContain('event.key === "Escape"');
    expect(sheetSource).toContain("event.target === event.currentTarget");
  });

  it("se cierra con el dedo que baja y no con el click", () => {
    // La pulsación que la abrió deja colgando un click sobre el fondo, que
    // todavía no existía cuando el dedo bajó.
    expect(sheetSource).toContain("onPointerDown={(event)");
    expect(sheetSource).not.toContain("onClick={(event) => {\n        if (event.target");
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(sheetSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});

describe("Estilo", () => {
  it("la fila no dispara la lupa ni la vista previa de iOS", () => {
    expect(cssSource).toMatch(/\.d2-routine \{[^}]*-webkit-touch-callout: none/);
  });

  it("la hoja sube desde abajo, donde llega el pulgar", () => {
    expect(cssSource).toMatch(/\.d2-scrim \{[^}]*align-items: flex-end/);
    expect(cssSource).toContain("@keyframes d2-rise");
  });

  it("eliminar se separa con una línea y no con rojo", () => {
    // El rojo sale del tema, y en Brasa todo el fondo ya es rojo.
    expect(cssSource).toMatch(/\.d2-holdsheet-danger \{[^}]*border-top: 1px solid var\(--d2-border\)/);
  });
});
