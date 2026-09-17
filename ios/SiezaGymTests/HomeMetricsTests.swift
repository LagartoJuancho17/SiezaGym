import Foundation
import Testing
@testable import SiezaGym

// MARK: - Fixtures

private func set(_ weight: Double, _ reps: Int, failed: Bool = false, number: Int = 1) -> LoggedSet {
    LoggedSet(setNumber: number, weight: weight, reps: reps, rir: nil, failed: failed)
}

private func session(
    id: String = "s1",
    finishedAt: Date? = Date(timeIntervalSince1970: 1_757_000_000),
    volume: Double = 0,
    sets: Int = 0,
    duration: Int = 0,
    _ exercises: [LoggedExercise] = []
) -> WorkoutSession {
    WorkoutSession(
        id: id,
        userID: "u1",
        routineName: "Test",
        routineID: nil,
        startedAt: nil,
        finishedAt: finishedAt,
        durationSeconds: duration,
        exercises: exercises,
        totalVolumeKg: volume,
        totalSetsCompleted: sets
    )
}

private func exercise(
    _ id: String,
    muscles: [MuscleGroup: Double] = [:],
    pattern: MovementPattern? = nil
) -> Exercise {
    Exercise(
        id: id,
        nameEs: id,
        nameEn: id,
        equipment: nil,
        pattern: pattern,
        muscleWeights: muscles,
        registrationType: .pesoReps,
        unilateral: false,
        descriptionEs: "",
        mediaURL: nil
    )
}

// MARK: - Epley

@Suite("1RM de Epley")
struct EpleyTests {
    @Test("en una sola repetición el 1RM es el peso levantado")
    func singleRep() {
        #expect(Epley.estimatedOneRepMax(weight: 100, reps: 1) == 100)
    }

    @Test("aplica peso × (1 + reps/30)")
    func formula() {
        #expect(abs(Epley.estimatedOneRepMax(weight: 100, reps: 10) - 133.333) < 0.01)
    }

    @Test("sin peso o sin reps no hay estimación", arguments: [(0.0, 10), (100.0, 0), (-5.0, 5)])
    func invalid(weight: Double, reps: Int) {
        #expect(Epley.estimatedOneRepMax(weight: weight, reps: reps) == 0)
    }

    @Test("la mejor serie ignora las falladas")
    func bestSetSkipsFailed() throws {
        let best = try #require(Epley.bestSet([
            set(80, 5),
            set(200, 5, failed: true),
            set(100, 5),
        ]))
        #expect(best.weight == 100)
    }

    @Test("el máximo real no estima nada")
    func maxWeight() {
        #expect(Epley.maxWeight([set(80, 5), set(120, 1), set(300, 1, failed: true)]) == 120)
    }
}

// MARK: - Volumen

@Suite("Volumen")
struct VolumeTests {
    @Test("una serie fallada no suma volumen")
    func failedSetIsZero() {
        #expect(set(100, 10, failed: true).volumeKg == 0)
        #expect(set(100, 10).volumeKg == 1000)
    }

    @Test("reparte el volumen según muscleWeights")
    func byMuscleGroup() {
        let catalog = ["press": exercise("press", muscles: [.pecho: 0.6, .triceps: 0.4])]
        let sessions = [session([LoggedExercise(exerciseID: "press", sets: [set(100, 10)])])]

        let result = HomeMetrics.volumeByMuscleGroup(sessions, catalog: catalog)

        #expect(result.totalKg == 1000)
        #expect(result.rows.first?.muscle == .pecho)
        #expect(result.rows.first?.kg == 600)
        #expect(abs((result.rows.first?.pct ?? 0) - 0.6) < 0.001)
    }

    @Test("un ejercicio que no está en el catálogo no rompe la cuenta")
    func unknownExercise() {
        let sessions = [session([LoggedExercise(exerciseID: "fantasma", sets: [set(100, 10)])])]
        #expect(HomeMetrics.volumeByMuscleGroup(sessions, catalog: [:]).totalKg == 0)
    }

    @Test("sin sesiones devuelve cero, no rompe")
    func empty() {
        let result = HomeMetrics.volumeByMuscleGroup([], catalog: [:])
        #expect(result.rows.isEmpty)
        #expect(!result.hasData)
    }
}

// MARK: - Empuje / tracción

@Suite("Empuje contra tracción")
struct PushPullTests {
    private var catalog: [String: Exercise] {
        [
            "press": exercise("press", pattern: .empujeHorizontal),
            "remo": exercise("remo", pattern: .traccionHorizontal),
            "curl": exercise("curl", pattern: .aislamiento),
        ]
    }

    @Test("mitad y mitad da 50 y queda equilibrado")
    func balanced() {
        let sessions = [session([
            LoggedExercise(exerciseID: "press", sets: [set(100, 10)]),
            LoggedExercise(exerciseID: "remo", sets: [set(100, 10)]),
        ])]
        let result = HomeMetrics.pushPullBalance(sessions, catalog: catalog)
        #expect(result.pct == 50)
        #expect(result.label == "Equilibrado")
    }

    @Test("solo empuje avisa que falta espalda")
    func allPush() {
        let sessions = [session([LoggedExercise(exerciseID: "press", sets: [set(100, 10)])])]
        let result = HomeMetrics.pushPullBalance(sessions, catalog: catalog)
        #expect(result.pct == 100)
        #expect(result.label == "Falta espalda")
    }

    @Test("solo tracción avisa que falta pecho")
    func allPull() {
        let sessions = [session([LoggedExercise(exerciseID: "remo", sets: [set(100, 10)])])]
        #expect(HomeMetrics.pushPullBalance(sessions, catalog: catalog).label == "Falta pecho")
    }

    @Test("el aislamiento no entra en la cuenta")
    func isolationExcluded() {
        let sessions = [session([LoggedExercise(exerciseID: "curl", sets: [set(50, 10)])])]
        let result = HomeMetrics.pushPullBalance(sessions, catalog: catalog)
        #expect(!result.hasData)
        #expect(result.pct == 50)
    }
}

// MARK: - Series completadas

@Suite("Series completadas")
struct CompletionTests {
    @Test("cuenta las hechas sobre el total")
    func rate() {
        let sessions = [session([
            LoggedExercise(exerciseID: "a", sets: [set(50, 10), set(50, 10), set(50, 10, failed: true)]),
        ])]
        let result = HomeMetrics.setCompletionRate(sessions)
        #expect(result.completed == 2)
        #expect(result.total == 3)
        #expect(result.pct == 67)
        #expect(result.label == "Regular")
    }

    @Test("todo completo es excelente")
    func perfect() {
        let sessions = [session([LoggedExercise(exerciseID: "a", sets: [set(50, 10)])])]
        #expect(HomeMetrics.setCompletionRate(sessions).label == "Excelente")
    }

    @Test("sin series no inventa un porcentaje")
    func empty() {
        let result = HomeMetrics.setCompletionRate([])
        #expect(result.pct == 0)
        #expect(!result.hasData)
    }
}

// MARK: - Intensidad

@Suite("Intensidad")
struct IntensityTests {
    @Test("el mejor 1RM se toma de todo el historial")
    func bestOneRepMax() {
        let sessions = [
            session(id: "nueva", [LoggedExercise(exerciseID: "press", sets: [set(80, 5)])]),
            session(id: "vieja", [LoggedExercise(exerciseID: "press", sets: [set(100, 5)])]),
        ]
        let best = HomeMetrics.bestOneRepMaxByExercise(sessions)
        #expect(abs((best["press"] ?? 0) - 116.667) < 0.01)
    }

    @Test("la intensidad relativa mira solo la última sesión")
    func relative() {
        let sessions = [
            session(id: "nueva", [LoggedExercise(exerciseID: "press", sets: [set(100, 1)])]),
            session(id: "vieja", [LoggedExercise(exerciseID: "press", sets: [set(100, 1)])]),
        ]
        let result = HomeMetrics.relativeIntensity(sessions)
        #expect(result.pct == 100)
        #expect(result.label == "Muy alta")
    }

    @Test("sin sesiones no hay intensidad")
    func empty() {
        #expect(!HomeMetrics.relativeIntensity([]).hasData)
    }

    @Test("las zonas se calculan contra el mejor 1RM del mismo ejercicio")
    func zones() {
        let sessions = [session([
            LoggedExercise(exerciseID: "press", sets: [set(100, 1), set(50, 1)]),
        ])]
        let result = HomeMetrics.intensityZones(sessions)
        #expect(result.total == 2)
        #expect(result.count(.peak) == 1)
        #expect(result.count(.light) == 1)
    }

    @Test("la zona se elige por porcentaje del máximo", arguments: [
        (95.0, HomeMetrics.Zone.peak),
        (85.0, HomeMetrics.Zone.high),
        (70.0, HomeMetrics.Zone.med),
        (40.0, HomeMetrics.Zone.light),
    ])
    func zoneBoundaries(pct: Double, expected: HomeMetrics.Zone) {
        #expect(HomeMetrics.Zone.forPercentOfMax(pct) == expected)
    }
}

// MARK: - Duración y calorías

@Suite("Duración y calorías")
struct CalorieTests {
    @Test("una duración físicamente imposible se estima por series")
    func impossibleDurationIsEstimated() {
        // El caso real: una sesión de 6 series guardada con 25 segundos.
        let broken = session(sets: 6, duration: 25)
        #expect(HomeMetrics.sessionSeconds(broken) == 6 * HomeMetrics.secondsPerSet)
    }

    @Test("una duración creíble se respeta tal cual")
    func believableDurationIsKept() {
        #expect(HomeMetrics.sessionSeconds(session(sets: 6, duration: 3600)) == 3600)
    }

    @Test("las calorías salen de MET × peso × horas")
    func calories() {
        // 5 MET × 80 kg × 1 h = 400 kcal.
        let hour = session(sets: 6, duration: 3600)
        #expect(HomeMetrics.calories(for: hour, bodyWeightKg: 80) == 400)
    }

    @Test("sin peso en el perfil usa 75 kg y lo declara")
    func defaultWeightIsFlagged() {
        let result = HomeMetrics.weeklyCalories(
            [session(sets: 6, duration: 3600)],
            bodyWeightKg: nil,
            goal: 2000
        )
        #expect(result.usesDefaultWeight)
        #expect(result.kcal == 375) // 5 × 75 × 1
    }

    @Test("el porcentaje de la meta no pasa de 100")
    func goalIsCapped() {
        let result = HomeMetrics.weeklyCalories(
            [session(sets: 100, duration: 36000)],
            bodyWeightKg: 80,
            goal: 100
        )
        #expect(result.pct == 100)
        #expect(result.label == "Objetivo cumplido")
    }
}

// MARK: - Ventanas de tiempo

@Suite("Ventanas de tiempo")
struct WindowTests {
    @Test("solo entran las sesiones dentro de los últimos días")
    func lastDays() {
        let now = Date(timeIntervalSince1970: 1_757_000_000)
        let sessions = [
            session(id: "hoy", finishedAt: now),
            session(id: "hace3", finishedAt: now.addingTimeInterval(-3 * 86400)),
            session(id: "hace30", finishedAt: now.addingTimeInterval(-30 * 86400)),
        ]
        let result = HomeMetrics.sessionsInLastDays(sessions, days: 7, now: now)
        #expect(result.map(\.id) == ["hoy", "hace3"])
    }

    @Test("una sesión sin fecha de fin no entra en la ventana")
    func missingDate() {
        let sessions = [session(id: "sinfecha", finishedAt: nil)]
        #expect(HomeMetrics.sessionsInLastDays(sessions, days: 7).isEmpty)
    }

    @Test("la tendencia va de la más vieja a la más nueva")
    func trendIsChronological() {
        let sessions = [
            session(id: "nueva", volume: 300),
            session(id: "media", volume: 200),
            session(id: "vieja", volume: 100),
        ]
        let trend = HomeMetrics.volumePerSession(sessions)
        #expect(trend.points == [100, 200, 300])
        #expect(trend.averageKg == 200)
    }
}
