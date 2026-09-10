import Foundation

/// Estimacion de duracion y reparto muscular de una rutina.
/// Los segundos por serie son los mismos que usa la web, para que la app no
/// tenga dos ideas distintas de cuanto dura un entrenamiento.
nonisolated enum RoutineSummary {
    static let secondsPerWorkingSet = 40
    static let secondsPerRest = 75

    static func estimatedMinutes(_ routine: Routine, catalog: [String: Exercise]) -> Int {
        let seconds = routine.exercises.reduce(0) { total, item in
            let exercise = catalog[item.exerciseID]
            let working = exercise?.registrationType.isTimeBased == true
                ? (item.targetReps > 0 ? item.targetReps : secondsPerWorkingSet)
                : secondsPerWorkingSet
            return total + item.targetSets * (working + secondsPerRest)
        }
        return Int((Double(seconds) / 60).rounded())
    }

    struct MuscleShare: Sendable, Hashable, Identifiable {
        let muscle: MuscleGroup
        let pct: Double
        var id: MuscleGroup { muscle }
    }

    /// Los targetSets de cada ejercicio se reparten entre sus musculos segun
    /// `muscleWeights`, y el total se normaliza sobre el volumen de la rutina.
    static func muscleDistribution(_ routine: Routine, catalog: [String: Exercise]) -> [MuscleShare] {
        var raw: [MuscleGroup: Double] = [:]
        var total: Double = 0

        for item in routine.exercises {
            guard let exercise = catalog[item.exerciseID] else { continue }
            for (muscle, weight) in exercise.muscleWeights {
                let contribution = Double(item.targetSets) * weight
                raw[muscle, default: 0] += contribution
                total += contribution
            }
        }

        guard total > 0 else { return [] }
        return raw
            .map { MuscleShare(muscle: $0.key, pct: $0.value / total) }
            .sorted { $0.pct > $1.pct }
    }
}
