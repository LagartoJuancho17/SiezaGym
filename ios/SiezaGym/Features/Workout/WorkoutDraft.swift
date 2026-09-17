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
        var sets: [SetDraft]

        var completedCount: Int { sets.filter(\.done).count }
    }

    let routine: Routine?
    let startedAt = Date()
    var exercises: [ExerciseDraft]

    init(routine: Routine?, catalog: [String: Exercise]) {
        self.routine = routine
        exercises = (routine?.exercises ?? []).map { item in
            let exercise = catalog[item.exerciseID]
            // Si el coach prescribio series una por una se respetan; si no, se
            // arman targetSets series iguales con el objetivo del plan.
            let sets: [SetDraft] = if let planned = item.sets, !planned.isEmpty {
                planned.map { SetDraft(weight: $0.weight ?? 0, reps: $0.reps, rir: $0.rir) }
            } else {
                (0..<max(1, item.targetSets)).map { _ in
                    SetDraft(weight: item.targetWeight ?? 0, reps: item.targetReps, rir: item.targetRIR)
                }
            }
            return ExerciseDraft(
                id: item.id,
                exerciseID: item.exerciseID,
                name: exercise?.nameEs ?? item.exerciseID,
                isTimeBased: exercise?.registrationType.isTimeBased ?? false,
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
