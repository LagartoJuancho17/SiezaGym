import ActivityKit
import Foundation

/// El entrenamiento en curso, en la pantalla bloqueada y en la Dynamic Island.
///
/// A diferencia del widget de la pantalla de inicio, acá no hace falta
/// compartir nada: ActivityKit lleva el `ContentState` de la app a la extensión
/// por su cuenta. Las actualizaciones son locales (`Activity.update`), no por
/// push, así que no hace falta cuenta paga ni APNs.
nonisolated struct WorkoutActivityAttributes: ActivityAttributes {
    /// Lo que cambia mientras entrenás.
    nonisolated struct ContentState: Codable, Hashable, Sendable {
        /// El ejercicio en el que estás: el primero que todavía tiene series
        /// sin marcar. Cuando no queda ninguno, es nil y la actividad muestra
        /// que terminaste.
        var exerciseName: String?
        var setNumber: Int
        var setsInExercise: Int

        var completedSets: Int
        var totalSets: Int
        var volumeKg: Double

        var progress: Double {
            guard totalSets > 0 else { return 0 }
            return min(1, Double(completedSets) / Double(totalSets))
        }

        /// "Serie 2 de 4" — o el ejercicio terminado.
        var setLabel: String {
            guard exerciseName != nil, setsInExercise > 0 else { return "Terminaste" }
            return "Serie \(setNumber) de \(setsInExercise)"
        }
    }

    /// Lo que no cambia en toda la actividad.
    var routineName: String
    var startedAt: Date
    /// El tema elegido, para pintar igual que la app.
    var themeID: String
}

/// Un ejercicio del entrenamiento, reducido a lo que la actividad necesita.
nonisolated struct WorkoutProgress: Sendable, Hashable {
    let exerciseName: String
    let doneSets: Int
    let totalSets: Int
}

nonisolated enum WorkoutActivityState {
    /// El ejercicio en curso es el primero que todavía tiene series sin marcar,
    /// no el que está abierto en pantalla: la actividad se mira sin tocar el
    /// teléfono, y lo que importa es qué falta hacer.
    static func contenido(
        _ ejercicios: [WorkoutProgress],
        volumeKg: Double
    ) -> WorkoutActivityAttributes.ContentState {
        let actual = ejercicios.first { $0.doneSets < $0.totalSets }

        return WorkoutActivityAttributes.ContentState(
            exerciseName: actual?.exerciseName,
            setNumber: actual.map { min($0.doneSets + 1, $0.totalSets) } ?? 0,
            setsInExercise: actual?.totalSets ?? 0,
            completedSets: ejercicios.reduce(0) { $0 + $1.doneSets },
            totalSets: ejercicios.reduce(0) { $0 + $1.totalSets },
            volumeKg: (volumeKg * 100).rounded() / 100
        )
    }
}
