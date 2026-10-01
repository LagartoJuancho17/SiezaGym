import Foundation
import Observation

/// Lo que el usuario va cargando durante el entrenamiento, antes de guardarlo.
/// Solo las series marcadas como hechas terminan en Firestore: una serie con
/// numeros escritos pero sin tildar es una intencion, no un dato.
@Observable
final class WorkoutDraft {
    struct SetDraft: Identifiable {
        let id = UUID()
        var weight: Double
        var reps: Int
        var rir: Int?
        var failed = false
        var done = false
    }

    struct ExerciseDraft: Identifiable {
        let id: String
        let exerciseID: String
        let name: String
        let isTimeBased: Bool
        let mediaURL: URL?
        let videoURL: URL?
        let description: String?
        /// Bloque de la rutina ("Fuerza", "Potencia"...). Vacío es sin grupo.
        let group: String
        let groupColor: String
        let previousBestWeight: Double
        let historicalRIR1Weight: Double?
        let targetReps: Int
        var sets: [SetDraft]

        var completedCount: Int { sets.filter(\.done).count }

        /// Todas las series marcadas. Un ejercicio al que le sacaste todas las
        /// series tiene 0 de 0, que **no** es estar terminado: sin esa guarda
        /// se pintaría de verde sin haber hecho nada.
        var estaCompleto: Bool { !sets.isEmpty && completedCount == sets.count }

        /// Sólo una carga efectivamente completada puede superar el récord.
        var newPBWeight: Double? {
            guard previousBestWeight > 0 else { return nil }
            return sets.filter { $0.done && !$0.failed && $0.weight > previousBestWeight }
                .map(\.weight).max()
        }

        var suggestedRIR1Weight: Double? {
            if let current = sets.last(where: { $0.done && !$0.failed }),
               let rir = current.rir,
               let estimate = WorkoutWeightInsights.rir1Weight(
                   weight: current.weight, reps: current.reps, rir: rir, targetReps: targetReps
               ) {
                return estimate
            }
            return historicalRIR1Weight
        }
    }

    let routine: Routine?
    let startedAt = Date()
    var exercises: [ExerciseDraft]

    init(routine: Routine?, catalog: [String: Exercise], sessions: [WorkoutSession] = []) {
        self.routine = routine
        let previousSessions = sessions
            .filter { $0.routineID == routine?.id }
            .sorted { ($0.finishedAt ?? $0.startedAt ?? .distantPast) > ($1.finishedAt ?? $1.startedAt ?? .distantPast) }
        exercises = (routine?.exercises ?? []).map { item in
            let exercise = catalog[item.exerciseID]
            let isTimeBased = exercise?.registrationType.isTimeBased ?? false
            // Si el coach prescribio series una por una se respetan; si no, se
            // arman targetSets series iguales con el objetivo del plan.
            var sets: [SetDraft] = if let planned = item.sets, !planned.isEmpty {
                planned.map { SetDraft(weight: $0.weight ?? 0, reps: $0.reps, rir: $0.rir) }
            } else {
                (0..<max(1, item.targetSets)).map { _ in
                    SetDraft(weight: item.targetWeight ?? 0, reps: item.targetReps, rir: item.targetRIR)
                }
            }
            if !isTimeBased {
                for index in sets.indices {
                    if let previousWeight = WorkoutWeightInsights.lastWeight(
                        exerciseID: item.exerciseID, setIndex: index, sessions: previousSessions
                    ) {
                        sets[index].weight = previousWeight
                    }
                }
            }
            return ExerciseDraft(
                id: item.id,
                exerciseID: item.exerciseID,
                name: exercise?.nameEs ?? item.exerciseID,
                isTimeBased: isTimeBased,
                mediaURL: exercise?.mediaURL,
                videoURL: exercise?.videoURL,
                description: exercise?.descriptionEs,
                group: item.group,
                groupColor: item.groupColor,
                previousBestWeight: isTimeBased ? 0 : WorkoutWeightInsights.bestWeight(item.exerciseID, sessions: sessions),
                historicalRIR1Weight: isTimeBased ? nil : WorkoutWeightInsights.rir1Weight(
                    exerciseID: item.exerciseID, targetReps: item.targetReps, sessions: sessions
                ),
                targetReps: item.targetReps,
                sets: sets
            )
        }
    }

    var completedSets: Int { exercises.reduce(0) { $0 + $1.completedCount } }

    var totalSets: Int { exercises.reduce(0) { $0 + $1.sets.count } }

    var volumeKg: Double {
        exercises.reduce(0) { total, exercise in
            total + exercise.sets.filter { $0.done && !$0.failed }
                .reduce(0) { $0 + $1.weight * Double($1.reps) }
        }
    }

    var canSave: Bool { completedSets > 0 }

    /// El ejercicio que conviene tener abierto: el primero que todavía tiene
    /// series sin marcar. Los demás van plegados, que es lo que hace que la
    /// pantalla entre en un teléfono cuando la rutina tiene ocho ejercicios.
    var ejercicioEnCurso: String? {
        proximaSerieSinMarcar().map { exercises[$0.ejercicio].id }
    }

    /// Dónde está la próxima serie sin marcar, recorriendo los ejercicios en
    /// orden. Es la misma regla con la que la actividad en vivo decide en qué
    /// ejercicio estás, así que el botón del widget y lo que dice la isla no
    /// pueden apuntar a series distintas.
    func proximaSerieSinMarcar() -> (ejercicio: Int, serie: Int)? {
        for indice in exercises.indices {
            if let serie = exercises[indice].sets.firstIndex(where: { !$0.done }) {
                return (indice, serie)
            }
        }
        return nil
    }

    /// Marca esa serie. Devuelve `false` si ya estaban todas: ahí no hay que
    /// arrancar un descanso.
    @discardableResult
    func marcarProximaSerie() -> Bool {
        guard let proxima = proximaSerieSinMarcar() else { return false }
        exercises[proxima.ejercicio].sets[proxima.serie].done = true
        return true
    }

    func addSet(to exerciseID: String) {
        guard let index = exercises.firstIndex(where: { $0.id == exerciseID }) else { return }
        // La serie nueva copia la ultima cargada: en el gimnasio casi siempre se
        // repite peso y reps, y asi es un toque en vez de dos campos.
        let previous = exercises[index].sets.last
        exercises[index].sets.append(
            SetDraft(weight: previous?.weight ?? 0, reps: previous?.reps ?? 10, rir: previous?.rir)
        )
    }

    func removeSet(from exerciseID: String, at offsets: IndexSet) {
        guard let index = exercises.firstIndex(where: { $0.id == exerciseID }) else { return }
        exercises[index].sets.remove(atOffsets: offsets)
    }

    /// Lo que efectivamente se guarda.
    func loggedExercises() -> [LoggedExercise] {
        exercises.compactMap { exercise in
            let done = exercise.sets.filter(\.done)
            guard !done.isEmpty else { return nil }
            return LoggedExercise(
                exerciseID: exercise.exerciseID,
                sets: done.enumerated().map { index, set in
                    LoggedSet(
                        setNumber: index + 1,
                        weight: set.weight,
                        reps: set.reps,
                        rir: set.rir,
                        failed: set.failed
                    )
                }
            )
        }
    }
}

/// Lecturas del historial. Nunca escribe en la rutina: una prescripción del
/// entrenador y el peso ejecutado por el alumno son datos distintos.
nonisolated enum WorkoutWeightInsights {
    static func lastWeight(exerciseID: String, setIndex: Int, sessions: [WorkoutSession]) -> Double? {
        sessions.lazy.compactMap { session -> LoggedSet? in
            guard let sets = session.exercises.first(where: { $0.exerciseID == exerciseID })?.sets,
                  sets.indices.contains(setIndex) else { return nil }
            return sets[setIndex]
        }.first { !$0.failed && $0.weight > 0 }?.weight
    }

    static func bestWeight(_ exerciseID: String, sessions: [WorkoutSession]) -> Double {
        sessions.flatMap(\.exercises)
            .filter { $0.exerciseID == exerciseID }
            .flatMap(\.sets)
            .filter { !$0.failed && $0.weight > 0 }
            .map(\.weight).max() ?? 0
    }

    /// Epley invertida: 1RM ~= kg × (1 + (reps + RIR)/30).
    /// Es una referencia, no una indicación automática de subir la carga.
    static func rir1Weight(exerciseID: String, targetReps: Int, sessions: [WorkoutSession]) -> Double? {
        let reference = sessions.lazy.flatMap(\.exercises)
            .filter { $0.exerciseID == exerciseID }
            .flatMap(\.sets)
            .first { set in
                !set.failed && set.weight > 0 && (1...12).contains(set.reps)
                    && set.rir.map { (0...5).contains($0) } == true
            }
        guard let reference, let rir = reference.rir else { return nil }
        return rir1Weight(weight: reference.weight, reps: reference.reps, rir: rir, targetReps: targetReps)
    }

    static func rir1Weight(weight: Double, reps: Int, rir: Int, targetReps: Int) -> Double? {
        guard weight > 0, (1...12).contains(reps + rir), (0...5).contains(rir),
              (1...12).contains(targetReps) else { return nil }
        let estimated1RM = Epley.estimatedOneRepMax(weight: weight, reps: reps + rir)
        let estimatedWeight = estimated1RM / (1 + Double(targetReps + 1) / 30)
        return floor(estimatedWeight / 2.5) * 2.5
    }
}
