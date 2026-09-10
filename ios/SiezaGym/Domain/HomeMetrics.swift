import Foundation

/// Metricas de la Home. Todo funcion pura: entran sesiones + catalogo, sale el
/// numero. Sin Firestore y sin SwiftUI, para poder testearlo.
///
/// Convencion: `sessions` viene de la mas nueva a la mas vieja, igual que la
/// query de Firestore (`orderBy finishedAt desc`).
nonisolated enum HomeMetrics {
    /// Misma asuncion que `RoutineSummary` (40s de trabajo + 75s de descanso),
    /// para que la app no tenga dos ideas distintas de cuanto dura una serie.
    static let secondsPerSet = 115

    /// Compendium of Physical Activities, codigo 02050: entrenamiento de fuerza
    /// con esfuerzo vigoroso. Es un MET promedio, por eso son calorias estimadas.
    static let resistanceMET = 5.0

    /// Cuando el usuario no cargo su peso en el perfil. Se marca como estimado.
    static let defaultBodyWeightKg = 75.0
    static let defaultWeeklyCalorieGoal = 2000.0

    static let dayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

    // MARK: - Volumen por grupo muscular

    struct MuscleVolumeRow: Sendable, Hashable, Identifiable {
        let muscle: MuscleGroup
        let kg: Int
        let pct: Double
        var id: MuscleGroup { muscle }
        var label: String { muscle.label }
    }

    struct MuscleVolume: Sendable, Hashable {
        let rows: [MuscleVolumeRow]
        let totalKg: Int
        var hasData: Bool { totalKg > 0 }
    }

    /// Reparte el volumen de cada ejercicio entre sus musculos segun
    /// `muscleWeights`. Un press con {pecho: 0.6, triceps: 0.4} suma 60% de su
    /// volumen a pecho y 40% a triceps.
    static func volumeByMuscleGroup(
        _ sessions: [WorkoutSession],
        catalog: [String: Exercise],
        limit: Int = 3
    ) -> MuscleVolume {
        var raw: [MuscleGroup: Double] = [:]
        var total: Double = 0

        for session in sessions {
            for exercise in session.exercises {
                let volume = exercise.volumeKg
                guard volume > 0, let weights = catalog[exercise.exerciseID]?.muscleWeights else { continue }
                for (muscle, share) in weights {
                    let part = volume * share
                    raw[muscle, default: 0] += part
                    total += part
                }
            }
        }

        let rows = raw
            .map { MuscleVolumeRow(muscle: $0.key, kg: Int($0.value.rounded()), pct: total > 0 ? $0.value / total : 0) }
            .sorted { $0.kg > $1.kg }

        return MuscleVolume(rows: Array(rows.prefix(limit)), totalKg: Int(total.rounded()))
    }

    // MARK: - Empuje contra traccion

    struct PushPull: Sendable, Hashable {
        let pushKg: Int
        let pullKg: Int
        /// 50 = equilibrado, 100 = todo empuje, 0 = todo traccion.
        let pct: Int
        let label: String
        let hasData: Bool
    }

    /// Los patrones que no son ni empuje ni traccion (core, aislamiento) no entran.
    static func pushPullBalance(_ sessions: [WorkoutSession], catalog: [String: Exercise]) -> PushPull {
        var push: Double = 0
        var pull: Double = 0

        for session in sessions {
            for exercise in session.exercises {
                let volume = exercise.volumeKg
                guard volume > 0, let pattern = catalog[exercise.exerciseID]?.pattern else { continue }
                if pattern.isPush { push += volume }
                else if pattern.isPull { pull += volume }
            }
        }

        let total = push + pull
        guard total > 0 else {
            return PushPull(pushKg: 0, pullKg: 0, pct: 50, label: "Sin datos", hasData: false)
        }

        let pct = (push / total) * 100
        let label = switch pct {
        case 65...: "Falta espalda"
        case ...35: "Falta pecho"
        default: "Equilibrado"
        }

        return PushPull(
            pushKg: Int(push.rounded()),
            pullKg: Int(pull.rounded()),
            pct: Int(pct.rounded()),
            label: label,
            hasData: true
        )
    }

    // MARK: - Series completadas

    struct Completion: Sendable, Hashable {
        let pct: Int
        let completed: Int
        let total: Int
        let label: String
        let hasData: Bool
    }

    static func setCompletionRate(_ sessions: [WorkoutSession]) -> Completion {
        var done = 0
        var total = 0
        for session in sessions {
            for exercise in session.exercises {
                for set in exercise.sets {
                    total += 1
                    if !set.failed { done += 1 }
                }
            }
        }

        guard total > 0 else {
            return Completion(pct: 0, completed: 0, total: 0, label: "Sin datos", hasData: false)
        }

        let pct = Int((Double(done) / Double(total) * 100).rounded())
        let label = switch pct {
        case ..<90: "Regular"
        case ..<97: "Bien"
        default: "Excelente"
        }
        return Completion(pct: pct, completed: done, total: total, label: label, hasData: true)
    }

    // MARK: - Volumen por dia de la semana

    struct WeekdayVolume: Sendable, Hashable, Identifiable {
        let index: Int
        let label: String
        let kg: Int
        /// Alto de la barra relativo al mejor dia.
        let pct: Double
        var id: Int { index }
    }

    static func volumeByWeekday(_ sessions: [WorkoutSession]) -> [WeekdayVolume] {
        var totals = [Double](repeating: 0, count: 7)
        for session in sessions {
            guard let finishedAt = session.finishedAt else { continue }
            totals[TrainingCalendar.weekdayIndex(finishedAt)] += session.totalVolumeKg
        }

        let max = totals.max() ?? 0
        return totals.enumerated().map { index, kg in
            WeekdayVolume(
                index: index,
                label: dayLabels[index],
                kg: Int(kg.rounded()),
                pct: max > 0 ? kg / max : 0
            )
        }
    }

    // MARK: - Ventanas de tiempo

    static func sessionsInLastDays(_ sessions: [WorkoutSession], days: Int = 7, now: Date = Date()) -> [WorkoutSession] {
        let cutoff = now.addingTimeInterval(-Double(days) * 24 * 60 * 60)
        return sessions.filter { ($0.finishedAt ?? .distantPast) >= cutoff }
    }

    static func trainedDayKeys(_ sessions: [WorkoutSession]) -> Set<String> {
        Set(sessions.compactMap(\.finishedAt).map(TrainingCalendar.dayKey))
    }

    // MARK: - Intensidad

    /// Mejor 1RM estimado historico por ejercicio: la referencia de intensidad.
    static func bestOneRepMaxByExercise(_ sessions: [WorkoutSession]) -> [String: Double] {
        var best: [String: Double] = [:]
        for session in sessions {
            for exercise in session.exercises {
                for set in exercise.sets where !set.failed {
                    let value = Epley.estimatedOneRepMax(set)
                    guard value > 0 else { continue }
                    if value > best[exercise.exerciseID, default: 0] {
                        best[exercise.exerciseID] = value
                    }
                }
            }
        }
        return best
    }

    struct Intensity: Sendable, Hashable {
        let pct: Int
        let label: String
        let hasData: Bool
    }

    /// Que tan fuerte le pegaste en la ultima sesion: peso promedio de las
    /// series contra tu mejor marca historica en esos mismos ejercicios.
    static func relativeIntensity(_ sessions: [WorkoutSession]) -> Intensity {
        guard let last = sessions.first else {
            return Intensity(pct: 0, label: "Sin datos", hasData: false)
        }

        let reference = bestOneRepMaxByExercise(sessions)
        var sum: Double = 0
        var count = 0

        for exercise in last.exercises {
            guard let max = reference[exercise.exerciseID], max > 0 else { continue }
            for set in exercise.sets where !set.failed && set.weight > 0 {
                sum += (set.weight / max) * 100
                count += 1
            }
        }

        guard count > 0 else { return Intensity(pct: 0, label: "Sin datos", hasData: false) }

        let pct = Int((sum / Double(count)).rounded())
        let label = switch pct {
        case 85...: "Muy alta"
        case 70...: "Alta"
        case 55...: "Moderada"
        default: "Suave"
        }
        return Intensity(pct: pct, label: label, hasData: true)
    }

    // MARK: - Volumen por sesion

    struct VolumeTrend: Sendable, Hashable {
        /// De la mas vieja a la mas nueva, para dibujarlas de izquierda a derecha.
        let points: [Int]
        let averageKg: Int
        let hasData: Bool
    }

    static func volumePerSession(_ sessions: [WorkoutSession], limit: Int = 8) -> VolumeTrend {
        let points = sessions.prefix(limit).map { Int($0.totalVolumeKg.rounded()) }.reversed().map { $0 }
        guard !points.isEmpty else { return VolumeTrend(points: [], averageKg: 0, hasData: false) }
        let average = Double(points.reduce(0, +)) / Double(points.count)
        return VolumeTrend(points: points, averageKg: Int(average.rounded()), hasData: true)
    }

    // MARK: - Zonas de intensidad

    enum Zone: Int, CaseIterable, Sendable {
        case light, med, high, peak

        var label: String {
            switch self {
            case .light: "Suave"
            case .med: "Media"
            case .high: "Alta"
            case .peak: "Pico"
            }
        }

        /// Zona segun el peso como porcentaje del mejor 1RM estimado.
        static func forPercentOfMax(_ pct: Double) -> Zone {
            switch pct {
            case 90...: .peak
            case 80...: .high
            case 65...: .med
            default: .light
            }
        }
    }

    struct Zones: Sendable, Hashable {
        let counts: [Zone: Int]
        let total: Int
        var hasData: Bool { total > 0 }

        func count(_ zone: Zone) -> Int { counts[zone] ?? 0 }
        func share(_ zone: Zone) -> Double { total > 0 ? Double(count(zone)) / Double(total) : 0 }
    }

    static func intensityZones(_ sessions: [WorkoutSession]) -> Zones {
        let reference = bestOneRepMaxByExercise(sessions)
        var counts: [Zone: Int] = [:]
        var total = 0

        for session in sessions {
            for exercise in session.exercises {
                guard let max = reference[exercise.exerciseID], max > 0 else { continue }
                for set in exercise.sets where !set.failed && set.weight > 0 {
                    counts[Zone.forPercentOfMax((set.weight / max) * 100), default: 0] += 1
                    total += 1
                }
            }
        }

        return Zones(counts: counts, total: total)
    }

    /// Zona serie por serie de la ultima sesion, para el grafico escalonado.
    static func intensitySequence(_ sessions: [WorkoutSession], limit: Int = 14) -> [Zone] {
        guard let last = sessions.first else { return [] }
        let reference = bestOneRepMaxByExercise(sessions)
        var steps: [Zone] = []

        for exercise in last.exercises {
            guard let max = reference[exercise.exerciseID], max > 0 else { continue }
            for set in exercise.sets where !set.failed && set.weight > 0 {
                steps.append(Zone.forPercentOfMax((set.weight / max) * 100))
            }
        }
        return Array(steps.prefix(limit))
    }

    // MARK: - Calorias

    /// Duracion util de una sesion en segundos.
    /// `durationSeconds` esta mal guardado en muchas sesiones (hay sesiones de 6
    /// series con 25 segundos), asi que si el valor es fisicamente imposible se
    /// estima a partir de las series.
    static func sessionSeconds(_ session: WorkoutSession) -> Int {
        let sets = session.totalSetsCompleted
        let stored = session.durationSeconds
        let floor = sets * 30
        if stored > 0, stored >= floor { return stored }
        return sets * secondsPerSet
    }

    /// MET x peso corporal x horas. Es una estimacion, no una medicion: no hay
    /// sensor. Se marca como estimada cuando falta el peso del perfil.
    static func calories(for session: WorkoutSession, bodyWeightKg: Double?) -> Int {
        let weight = (bodyWeightKg ?? 0) > 0 ? bodyWeightKg! : defaultBodyWeightKg
        let hours = Double(sessionSeconds(session)) / 3600
        return Int((resistanceMET * weight * hours).rounded())
    }

    struct CalorieGoal: Sendable, Hashable {
        let kcal: Int
        let goal: Int
        let pct: Int
        let label: String
        /// true cuando se uso el peso por defecto porque el perfil no lo tiene.
        let usesDefaultWeight: Bool
        let hasData: Bool
    }

    static func weeklyCalories(
        _ sessions: [WorkoutSession],
        bodyWeightKg: Double?,
        goal: Double?
    ) -> CalorieGoal {
        let target = (goal ?? 0) > 0 ? goal! : defaultWeeklyCalorieGoal
        let kcal = sessions.reduce(0) { $0 + calories(for: $1, bodyWeightKg: bodyWeightKg) }
        let pct = target > 0 ? min(100, Int((Double(kcal) / target * 100).rounded())) : 0

        let label = switch pct {
        case 100...: "Objetivo cumplido"
        case 70...: "Casi"
        case 35...: "En camino"
        default: "Vas lento"
        }

        return CalorieGoal(
            kcal: kcal,
            goal: Int(target),
            pct: pct,
            label: label,
            usesDefaultWeight: !((bodyWeightKg ?? 0) > 0),
            hasData: kcal > 0
        )
    }
}
