/**
 * Datos locales de evaluación. Los textos y primeras métricas recrean la
 * captura del usuario; las sesiones adicionales son sintéticas para probar
 * búsqueda y desbordes. Nunca se importan desde la Home autenticada.
 */
export function homeReferenceFixture(scenario = "default") {
  const activities = [
    { id: "fixture-fullbody", name: "Fullbody A", when: "Hoy", volume: "4.165 kg", duration: "1 h 10" },
    { id: "fixture-empuje", name: "Empuje pesado", when: "Ayer", volume: "1.847 kg", duration: "48 min" },
    { id: "fixture-traccion", name: "Tracción y bíceps", when: "12 sept", volume: "2.680 kg", duration: "52 min" },
    ...Array.from({ length: 9 }, (_, index) => ({
      id: `fixture-session-${index + 4}`,
      name: `Entrenamiento de prueba ${index + 4}`,
      when: "Septiembre",
      volume: "2.400 kg",
      duration: "45 min",
    })),
  ];

  const fixture = {
    header: { name: "Tobías", photoURL: null, initial: "T", goalPct: 46, hasGoalData: true },
    headline: { lead: "Hoy toca", emphasis: "Fullbody A.", href: "/rutinas/fixture-fullbody" },
    cards: [
      { title: "Esta semana", value: "7.793", unit: "kg", badge: "Mejor 9.120", ring: 0.46, icon: "weight" },
      { title: "Calorías", value: "824", unit: "kcal", badge: "Meta 1.800", ring: 0.46, icon: "clock" },
      { title: "Series completadas", value: 92, unit: "%", badge: "46 de 50", ring: 0.92, icon: "check" },
    ],
    // La racha vive en el encabezado del calendario y no en una tarjeta:
    // repetirla seria decir lo mismo dos veces, una arriba de la otra.
    calendar: {
      // 2026-09-16 es miércoles: la semana va del lunes 14 al domingo 20, con
      // jueves a domingo todavía en el futuro.
      trainedDayKeys: ["2026-09-07", "2026-09-14", "2026-09-16"],
      todayKey: "2026-09-16",
      streak: 1,
    },
    activities,
  };

  if (scenario === "empty") {
    fixture.header.hasGoalData = false;
    fixture.headline = { lead: "Empezá por", emphasis: "armar tu primera rutina.", href: "/rutinas/nueva" };
    fixture.cards = fixture.cards.map((card) => ({ ...card, value: 0, badge: "Sin datos", ring: 0 }));
    fixture.calendar = { ...fixture.calendar, trainedDayKeys: [], streak: 0 };
    fixture.activities = [];
  }

  if (scenario === "long") {
    fixture.header.name = "Tobías Alejandro";
    fixture.headline.emphasis = "Fuerza, movilidad y acondicionamiento.";
    fixture.activities[0].name = "Entrenamiento completo de fuerza y acondicionamiento";
    fixture.activities[0].volume = "124.165 kg";
  }

  return fixture;
}
