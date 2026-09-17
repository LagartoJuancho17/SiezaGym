import Foundation

/// 1RM estimado por la formula de Epley: w * (1 + reps/30). Exacto en reps = 1.
nonisolated enum Epley {
    static func estimatedOneRepMax(weight: Double, reps: Int) -> Double {
        guard weight > 0, reps > 0 else { return 0 }
        if reps == 1 { return weight }
        return weight * (1 + Double(reps) / 30)
    }

    static func estimatedOneRepMax(_ set: LoggedSet) -> Double {
        estimatedOneRepMax(weight: set.weight, reps: set.reps)
    }

    /// Mejor serie de un conjunto por 1RM estimado. Ignora las falladas.
    static func bestSet(_ sets: [LoggedSet]) -> LoggedSet? {
        sets
            .filter { !$0.failed && estimatedOneRepMax($0) > 0 }
            .max { estimatedOneRepMax($0) < estimatedOneRepMax($1) }
    }

    /// Peso maximo real levantado, sin estimar nada. Ignora las falladas.
    static func maxWeight(_ sets: [LoggedSet]) -> Double {
        sets.filter { !$0.failed }.map(\.weight).max() ?? 0
    }
}
