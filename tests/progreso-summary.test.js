import { describe, expect, it } from "vitest";
import { exerciseProgress, formatKg, trendLabel, weekBars } from "@/lib/progress/summary";
import { DAY_INITIALS, heatmapWeeks, mondayOf } from "@/lib/progress/heatmap";

describe("formatKg", () => {
  it("usa toneladas recién cuando el número entero deja de decir algo", () => {
    expect(formatKg(820)).toBe("820 kg");
    expect(formatKg(999)).toBe("999 kg");
    expect(formatKg(1000)).toBe("1,0 t");
    expect(formatKg(4235)).toBe("4,2 t");
  });

  it("arriba de diez toneladas saca el decimal", () => {
    expect(formatKg(12400)).toBe("12 t");
  });

  it("cero es cero y no una raya", () => {
    // Una semana sin entrenar es un dato, no un dato faltante.
    expect(formatKg(0)).toBe("0");
    expect(formatKg(null)).toBe("0");
  });
});

describe("weekBars", () => {
  const points = [
    { weekStartKey: "2026-08-24", totalVolumeKg: 0 },
    { weekStartKey: "2026-08-31", totalVolumeKg: 5000 },
    { weekStartKey: "2026-09-07", totalVolumeKg: 2500 },
  ];

  it("normaliza contra la semana más alta", () => {
    const bars = weekBars(points);
    expect(bars.map((b) => b.heightPct)).toEqual([4, 100, 50]);
  });

  it("una semana en cero conserva una línea visible", () => {
    // Una barra de altura cero se lee como "no hay dato".
    expect(weekBars(points)[0]).toMatchObject({ kg: 0, empty: true, heightPct: 4 });
  });

  it("sin ninguna semana con volumen no divide por cero", () => {
    const bars = weekBars([{ weekStartKey: "a", totalVolumeKg: 0 }]);
    expect(bars[0].heightPct).toBe(4);
  });

  it("aguanta que no haya puntos", () => {
    expect(weekBars(null)).toEqual([]);
  });
});

describe("trendLabel", () => {
  it("lleva el signo adelante", () => {
    expect(trendLabel(20)).toBe("+20%");
    expect(trendLabel(-5)).toBe("−5%");
    expect(trendLabel(0)).toBe("0%");
  });

  it("sin semana anterior no inventa un cero", () => {
    expect(trendLabel(null)).toBe("—");
    expect(trendLabel(undefined)).toBe("—");
  });
});

describe("exerciseProgress", () => {
  const sessions = [
    {
      finishedAt: "2026-09-14T10:00:00.000Z",
      exercises: [
        { exerciseId: "press", sets: [{ weight: 80, reps: 5 }, { weight: 85, reps: 3 }] },
        { exerciseId: "remo", sets: [{ weight: 60, reps: 10 }] },
      ],
    },
    {
      finishedAt: "2026-09-10T10:00:00.000Z",
      exercises: [{ exerciseId: "press", sets: [{ weight: 100, reps: 1 }] }],
    },
  ];

  it("cuenta entrenamientos por ejercicio", () => {
    const rows = exerciseProgress(sessions);
    expect(rows.find((r) => r.exerciseId === "press").sessions).toBe(2);
    expect(rows.find((r) => r.exerciseId === "remo").sessions).toBe(1);
  });

  it("se queda con la mejor marca estimada de todas las sesiones", () => {
    // 100×1 da 100 exacto; 85×3 da 93,5. Gana la primera aunque sea más vieja.
    expect(exerciseProgress(sessions).find((r) => r.exerciseId === "press").bestOneRepMax).toBe(100);
  });

  it("ordena por lo último entrenado", () => {
    // La pregunta al abrir progreso es "cómo vengo", no "qué levanté más".
    expect(exerciseProgress(sessions).map((r) => r.exerciseId)).toEqual(["press", "remo"]);
  });

  it("no cuenta las series falladas para la marca", () => {
    const conFallo = [
      { finishedAt: "2026-09-14", exercises: [{ exerciseId: "x", sets: [{ weight: 200, reps: 1, failed: true }, { weight: 50, reps: 1 }] }] },
    ];
    expect(exerciseProgress(conFallo)[0].bestOneRepMax).toBe(50);
  });

  it("el peso corporal no inventa una marca", () => {
    const plancha = [{ finishedAt: "2026-09-14", exercises: [{ exerciseId: "plancha", sets: [{ weight: 0, reps: 45 }] }] }];
    expect(exerciseProgress(plancha)[0].bestOneRepMax).toBe(0);
  });

  it("recorta a los que entran en pantalla", () => {
    const muchos = [{
      finishedAt: "2026-09-14",
      exercises: Array.from({ length: 20 }, (_, i) => ({ exerciseId: `e${i}`, sets: [{ weight: 10, reps: 1 }] })),
    }];
    expect(exerciseProgress(muchos, { limit: 5 })).toHaveLength(5);
  });

  it("aguanta una cuenta sin sesiones", () => {
    expect(exerciseProgress([])).toEqual([]);
    expect(exerciseProgress(null)).toEqual([]);
  });
});

describe("heatmapWeeks", () => {
  // 2026-09-15 es martes.
  const hoy = "2026-09-15";

  it("la semana arranca el lunes", () => {
    expect(mondayOf(hoy)).toBe("2026-09-14");
    expect(mondayOf("2026-09-14")).toBe("2026-09-14");
    // Domingo pertenece a la semana que arrancó el lunes anterior.
    expect(mondayOf("2026-09-20")).toBe("2026-09-14");
  });

  it("devuelve una columna por semana y siete días por columna", () => {
    const { columns } = heatmapWeeks([], { weeks: 26, todayKey: hoy });
    expect(columns).toHaveLength(26);
    expect(columns.every((c) => c.days.length === 7)).toBe(true);
    expect(DAY_INITIALS).toHaveLength(7);
  });

  it("la última columna es la semana en curso", () => {
    const { columns } = heatmapWeeks([], { weeks: 4, todayKey: hoy });
    expect(columns[columns.length - 1].monday).toBe("2026-09-14");
  });

  it("marca los días entrenados", () => {
    const { columns, total } = heatmapWeeks(["2026-09-14", "2026-09-08"], { weeks: 4, todayKey: hoy });
    const ultima = columns[columns.length - 1].days;
    expect(ultima[0]).toMatchObject({ key: "2026-09-14", trained: true });
    expect(ultima[1]).toMatchObject({ key: "2026-09-15", trained: false });
    expect(total).toBe(2);
  });

  it("separa los días que todavía no pasaron", () => {
    // No haber entrenado mañana no es lo mismo que haberte salteado ayer.
    const { columns } = heatmapWeeks([], { weeks: 1, todayKey: hoy });
    const [lunes, martes, miercoles] = columns[0].days;
    expect(lunes.isFuture).toBe(false);
    expect(martes.isFuture).toBe(false);
    expect(miercoles.isFuture).toBe(true);
  });

  it("no cuenta un día entrenado de antes del rango", () => {
    const { total } = heatmapWeeks(["2020-01-01"], { weeks: 4, todayKey: hoy });
    expect(total).toBe(0);
  });

  it("pone una marca de mes cuando cambia", () => {
    const { monthTicks } = heatmapWeeks([], { weeks: 10, todayKey: hoy });
    expect(monthTicks[0].week).toBe(0);
    expect(monthTicks.map((t) => t.label)).toContain("sep");
    // Sin repetir el mismo mes dos veces seguidas.
    const labels = monthTicks.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("cruza el año sin romperse", () => {
    const { columns } = heatmapWeeks([], { weeks: 8, todayKey: "2027-01-05" });
    expect(columns[0].monday).toBe("2026-11-16");
    expect(columns[columns.length - 1].monday).toBe("2027-01-04");
  });
});
