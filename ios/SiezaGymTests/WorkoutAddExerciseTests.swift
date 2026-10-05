import Testing
@testable import SiezaGym

@Suite("Agregar ejercicio entrenando")
struct WorkoutAddExerciseTests {
    private let prensa = Exercise(id: "prensa", data: ["nameEs": "Prensa 45°", "registrationType": "peso_reps"])
    private let plancha = Exercise(id: "plancha", data: ["nameEs": "Plancha", "registrationType": "tiempo"])

    @Test("se suman al final, con 3 series vacías, sin grupo")
    func alFinal() {
        let draft = WorkoutDraft(routine: nil, catalog: [:])
        let ids = draft.agregarEjercicios([prensa, plancha])
        #expect(draft.exercises.map(\.exerciseID) == ["prensa", "plancha"])
        #expect(ids == draft.exercises.map(\.id))
        #expect(draft.exercises.allSatisfy { $0.sets.count == 3 && $0.group.isEmpty && $0.completedCount == 0 })
        // Uno de tiempo arranca en 30 s, no en 10 "reps".
        #expect(draft.exercises[1].isTimeBased)
        #expect(draft.exercises[1].sets.first?.reps == 30)
    }

    @Test("el mismo ejercicio dos veces no choca de id")
    func idsUnicos() {
        let draft = WorkoutDraft(routine: nil, catalog: [:])
        draft.agregarEjercicios([prensa])
        draft.agregarEjercicios([prensa])
        #expect(Set(draft.exercises.map(\.id)).count == 2)
    }

    @Test("lo agregado y marcado se guarda en la sesión; lo no marcado no")
    func seGuarda() {
        let draft = WorkoutDraft(routine: nil, catalog: [:])
        draft.agregarEjercicios([prensa, plancha])
        draft.exercises[0].sets[0].done = true
        draft.exercises[0].sets[0].weight = 120
        let logged = draft.loggedExercises()
        #expect(logged.map(\.exerciseID) == ["prensa"])
        #expect(logged.first?.sets.first?.weight == 120)
        #expect(draft.canSave)
    }
}
