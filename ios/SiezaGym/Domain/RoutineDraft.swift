import Foundation

/// Estado editable de una rutina nueva. Mantiene la misma forma que el
/// formulario web, pero sin depender de SwiftUI ni de Firebase.
nonisolated struct RoutineDraftExercise: Identifiable, Hashable, Sendable {
    let exerciseID: String
    let source: ExerciseSource
    var targetSets: Int
    var targetReps: Int
    var targetRIR: Int?
    var targetWeight: Double?
    var techniqueNote: String

    var id: String { exerciseID }

    init(exercise: Exercise) {
        exerciseID = exercise.id
        source = exercise.source
        targetSets = 3
        targetReps = exercise.registrationType.isTimeBased ? 30 : 10
        targetRIR = nil
        targetWeight = nil
        techniqueNote = ""
    }

    /// Serialización compatible con `sanitizeExercises` de la web.
    func firestoreValue(order: Int) -> [String: Any] {
        [
            "exerciseId": exerciseID,
            "exerciseSource": source.rawValue,
            "order": order,
            "targetSets": targetSets,
            "targetReps": targetReps,
            "targetRIR": targetRIR ?? NSNull(),
            "targetWeight": targetWeight ?? NSNull(),
            "techniqueNote": techniqueNote.trimmingCharacters(in: .whitespacesAndNewlines),
            "sets": NSNull(),
        ]
    }
}

nonisolated enum RoutineDraftValidationError: LocalizedError, Equatable {
    case missingName
    case missingExercises

    var errorDescription: String? {
        switch self {
        case .missingName: "Poné un nombre a la rutina."
        case .missingExercises: "Agregá al menos un ejercicio."
        }
    }
}

nonisolated enum RoutineDraftValidation {
    static func validate(name: String, exercises: [RoutineDraftExercise]) throws {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw RoutineDraftValidationError.missingName
        }
        guard !exercises.isEmpty else {
            throw RoutineDraftValidationError.missingExercises
        }
    }
}
