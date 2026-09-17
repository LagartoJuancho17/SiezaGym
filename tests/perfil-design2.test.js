import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isRedesigned } from "@/lib/nav/redesigned";
import { SEX_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/users/constants";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const pageSource = read("app/(app)/perfil/page.js");
const formSource = read("components/design2/ProfileForm.js");
const pickerSource = read("components/design2/ThemePicker.js");
const cssSource = read("app/design2.css");

describe("Pantalla de perfil", () => {
  it("usa los componentes de design2 y no el formulario viejo", () => {
    expect(pageSource).toContain("<ThemeRoot>");
    expect(pageSource).toContain("<ProfileForm");
    expect(pageSource).not.toContain("components/perfil/PerfilForm");
  });

  it("está declarada como rediseñada para que no le entre el chrome viejo", () => {
    expect(isRedesigned("/perfil")).toBe(true);
  });

  it("lleva la barra de pestañas, porque es una sección y no una pantalla de paso", () => {
    expect(pageSource).toContain("<TabBar />");
  });

  it("no fija colores a mano: todo sale del tema", () => {
    expect(pageSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
    expect(formSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
    expect(pickerSource).not.toMatch(/text-white\b|bg-white\b|#[0-9a-fA-F]{6}/);
  });
});

describe("Números del perfil", () => {
  it("los cuenta de las sesiones guardadas y no de una estimación", () => {
    expect(pageSource).toContain("sessions.length");
    expect(pageSource).toContain("session.totalSetsCompleted || 0");
  });

  it("la racha usa la misma función que la portada", () => {
    // Dos cuentas distintas para el mismo número terminan discrepando.
    expect(pageSource).toContain('from "@/lib/sessions/streak"');
    expect(pageSource).toContain("computeStreak(trainedDates)");
  });

  it("avisa si los totales quedaron recortados por el límite", () => {
    expect(pageSource).toContain("sessions.length === SESSION_LIMIT");
    expect(pageSource).toContain("Los totales cuentan tus últimos");
  });

  it("no inventa el proveedor de la cuenta", () => {
    // Un proveedor que no esté en la tabla se muestra crudo, no como "email".
    expect(pageSource).toContain("PROVIDER_LABELS[profile?.provider] || profile?.provider");
  });

  it("no afirma que hay entrenador cuando no hay ninguno", () => {
    expect(pageSource).toContain('linkedCoach?.displayName || "Sin vincular"');
  });
});

describe("Datos personales", () => {
  it("guarda con la acción de servidor que ya existía", () => {
    expect(formSource).toContain('from "@/app/(app)/perfil/actions"');
    expect(formSource).toContain("updateProfile({");
  });

  it("ofrece las opciones del catálogo y ninguna escrita a mano", () => {
    expect(formSource).toContain("SEX_OPTIONS");
    expect(formSource).toContain("EXPERIENCE_LEVELS");
    for (const label of ["masculino", "principiante"]) {
      expect(formSource).not.toContain(`"${label}"`);
    }
    expect(SEX_OPTIONS.length).toBeGreaterThan(0);
    expect(EXPERIENCE_LEVELS.length).toBeGreaterThan(0);
  });

  it("deja desmarcar una opción: ninguna es obligatoria", () => {
    expect(formSource).toContain("onChange(active ? null : option)");
  });

  it("no manda un nombre vacío al servidor", () => {
    // updateUserProfile lo rechaza; avisarlo antes ahorra el viaje.
    expect(formSource).toContain("El nombre no puede quedar vacío.");
  });

  it("un campo vacío se guarda como null y no como cero", () => {
    expect(formSource).toContain('bodyWeightKg: bodyWeightKg === "" ? null : Number(bodyWeightKg)');
    expect(formSource).toContain('heightCm: heightCm === "" ? null : Number(heightCm)');
  });

  it("el «Guardado» se borra al volver a tocar un campo", () => {
    // Si queda puesto, deja de decir la verdad apenas se edita algo.
    expect(formSource).toContain('if (status === "saved") setStatus(null);');
  });

  it("anuncia el resultado a las tecnologías de asistencia", () => {
    expect(formSource).toContain('role="status"');
  });
});

describe("Configuración", () => {
  it("tiene el cambio de tema adentro", () => {
    expect(pageSource).toContain("<ThemePicker />");
    expect(pageSource).toContain("El fondo de la app");
  });

  it("dice dónde se guarda el tema", () => {
    // Es una preferencia del aparato, no de la cuenta: no viaja a otro
    // teléfono ni sobrevive a limpiar los datos del navegador.
    expect(pageSource).toContain("Se guarda en este dispositivo");
  });

  it("el panel del entrenador aparece solo para un entrenador", () => {
    expect(pageSource).toContain("isCoach ? (");
    expect(pageSource).toContain('href="/dashboard/coach"');
  });

  it("deja cerrar sesión con la acción de servidor que ya existía", () => {
    expect(pageSource).toContain('from "@/app/dashboard/actions"');
    expect(pageSource).toContain("<form action={logout}>");
  });
});

describe("Estilo del perfil", () => {
  it("las opciones envuelven en vez de encogerse", () => {
    // "Prefiero no decir" no entra en un tercio de pantalla de teléfono.
    expect(cssSource).toMatch(/\.d2-segs \{[^}]*flex-wrap: wrap/);
  });

  it("la opción elegida usa el sólido del tema", () => {
    // El mismo que el día entrenado, la serie confirmada y la pestaña activa.
    expect(cssSource).toMatch(/\.d2-seg-on \{ background: var\(--d2-ink\); color: var\(--d2-on-ink\)/);
  });

  it("los campos de texto no disparan el zoom de iOS", () => {
    // Safari hace zoom en cualquier input de menos de 16 px.
    expect(cssSource).toMatch(/\.d2-input \{[^}]*font-size: max\(16px/);
  });
});
