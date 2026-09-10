import Foundation
import Testing
@testable import SiezaGym

@Suite("Calendario de entrenamiento")
struct TrainingCalendarTests {
    /// Mediodía en Argentina, para que ningún corrimiento de zona cambie el día.
    private func date(_ iso: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        formatter.timeZone = TrainingCalendar.timeZone
        return formatter.date(from: "\(iso) 12:00")!
    }

    @Test("la clave del día es la del horario argentino")
    func dayKey() {
        #expect(TrainingCalendar.dayKey(date("2026-09-06")) == "2026-09-06")
    }

    @Test("las 22 de Buenos Aires siguen siendo el mismo día, no el siguiente en UTC")
    func lateNightStaysSameDay() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        formatter.timeZone = TrainingCalendar.timeZone
        let lateNight = formatter.date(from: "2026-09-06 22:30")!
        #expect(TrainingCalendar.dayKey(lateNight) == "2026-09-06")
    }

    @Test("el lunes es el índice 0 y el domingo el 6")
    func weekdayIndex() {
        // 2026-09-07 es lunes.
        #expect(TrainingCalendar.weekdayIndex(date("2026-09-07")) == 0)
        #expect(TrainingCalendar.weekdayIndex(date("2026-09-13")) == 6)
    }

    @Test("la semana del mes corta de a siete días", arguments: [
        (1, 1), (7, 1), (8, 2), (14, 2), (28, 4), (31, 5),
    ])
    func weekOfMonth(day: Int, expected: Int) {
        #expect(TrainingCalendar.weekOfMonth(day: day) == expected)
    }

    @Test("el mes se escribe en español")
    func monthLabel() {
        #expect(TrainingCalendar.monthLabel(year: 2026, month: 9) == "Septiembre 2026")
    }

    @Test("días consecutivos suman racha")
    func streak() {
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-06", "2026-09-05", "2026-09-04"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 3)
    }

    @Test("la racha sobrevive el día que todavía no entrenaste")
    func streakSurvivesToday() {
        // Hoy no hay entrenamiento, pero ayer y anteayer sí: la racha vive
        // hasta la medianoche siguiente.
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-05", "2026-09-04"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 2)
    }

    @Test("un hueco corta la racha")
    func streakBreaksOnGap() {
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-06", "2026-09-04", "2026-09-03"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 1)
    }

    @Test("sin entrenamientos la racha es cero")
    func noStreak() {
        #expect(TrainingCalendar.streak(trainedDayKeys: [], now: date("2026-09-06")) == 0)
    }
}

@Suite("Resumen de rutina")
struct RoutineSummaryTests {
    private func routine(_ exercises: [RoutineExercise]) -> Routine {
        Routine(
            id: "r1", ownerID: "u1", name: "Test", note: "",
            exercises: exercises, showOnHome: true,
            lastUsedAt: nil, createdAt: nil, updatedAt: nil, isAssigned: false
        )
    }

    private func item(_ id: String, sets: Int, reps: Int = 10) -> RoutineExercise {
        RoutineExercise(
            exerciseID: id, source: .catalog, order: 0,
            targetSets: sets, targetReps: reps, targetRIR: nil,
            targetWeight: nil, techniqueNote: "", sets: nil
        )
    }

    private func exercise(_ id: String, muscles: [MuscleGroup: Double], time: Bool = false) -> Exercise {
        Exercise(
            id: id, nameEs: id, nameEn: id, equipment: nil, pattern: nil,
            muscleWeights: muscles,
            registrationType: time ? .tiempo : .pesoReps,
            unilateral: false, descriptionEs: "", mediaURL: nil
        )
    }

    @Test("suma las series objetivo")
    func totalSets() {
        #expect(routine([item("a", sets: 3), item("b", sets: 4)]).totalSets == 7)
    }

    @Test("estima la duración con 40s de trabajo y 75s de descanso")
    func duration() {
        // 3 series × (40 + 75) = 345 s = 5.75 min -> 6.
        let minutes = RoutineSummary.estimatedMinutes(routine([item("a", sets: 3)]), catalog: [:])
        #expect(minutes == 6)
    }

    @Test("en un ejercicio de tiempo, targetReps son segundos de trabajo")
    func timeBasedDuration() {
        let catalog = ["plancha": exercise("plancha", muscles: [.abdomen: 1], time: true)]
        // 2 series × (60 + 75) = 270 s = 4.5 min -> 5 (redondeo hacia arriba).
        let minutes = RoutineSummary.estimatedMinutes(
            routine([item("plancha", sets: 2, reps: 60)]),
            catalog: catalog
        )
        #expect(minutes == 5)
    }

    @Test("el reparto muscular normaliza a 1")
    func muscleDistribution() {
        let catalog = [
            "press": exercise("press", muscles: [.pecho: 0.6, .triceps: 0.4]),
            "remo": exercise("remo", muscles: [.dorsal: 1]),
        ]
        let shares = RoutineSummary.muscleDistribution(
            routine([item("press", sets: 3), item("remo", sets: 3)]),
            catalog: catalog
        )
        #expect(abs(shares.reduce(0) { $0 + $1.pct } - 1) < 0.001)
        #expect(shares.first?.muscle == .dorsal)
    }

    @Test("una rutina sin ejercicios del catálogo no reparte nada")
    func unknownCatalog() {
        #expect(RoutineSummary.muscleDistribution(routine([item("x", sets: 3)]), catalog: [:]).isEmpty)
    }
}
