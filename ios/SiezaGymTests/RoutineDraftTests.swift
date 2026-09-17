import Foundation
import Testing
@testable import SiezaGym

@Suite("Creación de rutinas")
struct RoutineDraftTests {
    private func exercise(_ id: String = "press", timeBased: Bool = false, source: ExerciseSource = .catalog) -> Exercise {
        Exercise(
            id: id, nameEs: id, nameEn: id, equipment: nil, pattern: nil,
            muscleWeights: [:], registrationType: timeBased ? .tiempo : .pesoReps,
            unilateral: false, descriptionEs: "", mediaURL: nil, source: source
        )
    }

    @Test("las rutinas empiezan con 3 series y 10 reps")
    func defaultPrescription() {
        let draft = RoutineDraftExercise(exercise: exercise())
        #expect(draft.targetSets == 3)
        #expect(draft.targetReps == 10)
        #expect(draft.targetRIR == nil)
        #expect(draft.source == .catalog)
    }

    @Test("los ejercicios de tiempo empiezan con 30 segundos")
    func defaultTimePrescription() {
        #expect(RoutineDraftExercise(exercise: exercise(timeBased: true)).targetReps == 30)
    }

    @Test("la serialización conserva el orden, el origen y los campos opcionales")
    func firestoreShape() {
        var draft = RoutineDraftExercise(exercise: exercise("plancha", source: .custom))
        draft.targetSets = 4
        draft.targetReps = 45
        draft.targetRIR = 2
        draft.techniqueNote = "  Espalda neutra  "

        let value = draft.firestoreValue(order: 3)
        #expect(value["exerciseId"] as? String == "plancha")
        #expect(value["exerciseSource"] as? String == "custom")
        #expect(value["order"] as? Int == 3)
        #expect(value["targetSets"] as? Int == 4)
        #expect(value["targetReps"] as? Int == 45)
        #expect(value["targetRIR"] as? Int == 2)
        #expect(value["techniqueNote"] as? String == "Espalda neutra")
        #expect(value["sets"] is NSNull)
    }

    @Test("no permite guardar sin nombre o sin ejercicios")
    func validation() {
        let item = RoutineDraftExercise(exercise: exercise())
        #expect(throws: RoutineDraftValidationError.missingName) {
            try RoutineDraftValidation.validate(name: "  ", exercises: [item])
        }
        #expect(throws: RoutineDraftValidationError.missingExercises) {
            try RoutineDraftValidation.validate(name: "Fuerza", exercises: [])
        }
    }
}
