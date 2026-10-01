import Foundation
import Testing
@testable import SiezaGym

@Suite("Peso, RIR y récord personal")
@MainActor
struct WorkoutWeightTests {
    private func routine(weight: Double? = nil) -> Routine {
        Routine(
            id: "rutina-1", ownerID: "user", name: "Fuerza", note: "",
            exercises: [RoutineExercise(
                exerciseID: "press", source: .catalog, order: 0,
                targetSets: 2, targetReps: 8, targetRIR: nil, targetWeight: weight,
                techniqueNote: "", sets: nil, group: "", groupColor: ""
            )],
            showOnHome: true, lastUsedAt: nil, createdAt: nil, updatedAt: nil,
            isAssigned: false, weekKey: nil
        )
    }

    private var catalog: [String: Exercise] {
        ["press": Exercise(
            id: "press", nameEs: "Press", nameEn: "Press", equipment: nil, pattern: nil,
            muscleWeights: [:], registrationType: .pesoReps, unilateral: false,
            descriptionEs: "", mediaURL: nil, source: .catalog, videoURL: nil
        )]
    }

    private func session(
        routineID: String = "rutina-1",
        sets: [LoggedSet],
        date: Date = .now
    ) -> WorkoutSession {
        WorkoutSession(
            id: UUID().uuidString, userID: "user", routineName: "Fuerza", routineID: routineID,
            startedAt: date, finishedAt: date, durationSeconds: 1200,
            exercises: [LoggedExercise(exerciseID: "press", sets: sets)],
            totalVolumeKg: 0, totalSetsCompleted: sets.count
        )
    }

    private func set(_ number: Int, _ weight: Double, rir: Int? = nil, failed: Bool = false) -> LoggedSet {
        LoggedSet(setNumber: number, weight: weight, reps: 8, rir: rir, failed: failed)
    }

    @Test("al repetir usa los kilos hechos, aunque el plan no tenga peso")
    func restoresWeights() {
        let previous = session(sets: [set(1, 60), set(2, 65)])
        let draft = WorkoutDraft(routine: routine(), catalog: catalog, sessions: [previous])
        #expect(draft.exercises[0].sets.map(\.weight) == [60, 65])
        #expect(draft.exercises[0].sets.allSatisfy { !$0.done })
    }

    @Test("lo ejecutado prevalece sobre el peso planeado sin editar la rutina")
    func actualOverPlan() {
        let plan = routine(weight: 50)
        let draft = WorkoutDraft(routine: plan, catalog: catalog, sessions: [session(sets: [set(1, 55)])])
        #expect(draft.exercises[0].sets.map(\.weight) == [55, 50])
        #expect(plan.exercises[0].targetWeight == 50)
    }

    @Test("otra rutina y series falladas no precargan kilos")
    func ignoresOtherAndFailed() {
        let draft = WorkoutDraft(
            routine: routine(), catalog: catalog,
            sessions: [session(routineID: "otra", sets: [set(1, 100)]), session(sets: [set(1, 80, failed: true)])]
        )
        #expect(draft.exercises[0].sets.map(\.weight) == [0, 0])
    }

    @Test("PB sólo después de completar una carga mayor que el historial")
    func pbAfterCompletedSet() {
        let draft = WorkoutDraft(routine: routine(), catalog: catalog, sessions: [session(sets: [set(1, 60)])])
        draft.exercises[0].sets[0].weight = 62.5
        #expect(draft.exercises[0].newPBWeight == nil)
        draft.exercises[0].sets[0].done = true
        #expect(draft.exercises[0].newPBWeight == 62.5)
        draft.exercises[0].sets[0].failed = true
        #expect(draft.exercises[0].newPBWeight == nil)
    }

    @Test("RIR 1 se estima sólo con un RIR histórico registrado")
    func rir1Estimate() {
        let withRIR = WorkoutDraft(
            routine: routine(), catalog: catalog, sessions: [session(sets: [set(1, 100, rir: 3)])]
        )
        let withoutRIR = WorkoutDraft(
            routine: routine(), catalog: catalog, sessions: [session(sets: [set(1, 100)])]
        )
        #expect(withRIR.exercises[0].suggestedRIR1Weight == 105)
        #expect(withoutRIR.exercises[0].suggestedRIR1Weight == nil)

        withoutRIR.exercises[0].sets[0].weight = 100
        withoutRIR.exercises[0].sets[0].rir = 3
        withoutRIR.exercises[0].sets[0].done = true
        #expect(withoutRIR.exercises[0].suggestedRIR1Weight == 105)
        #expect(WorkoutWeightInsights.rir1Weight(weight: 100, reps: 1, rir: 0, targetReps: 1) == 92.5)
        #expect(WorkoutWeightInsights.rir1Weight(weight: 100, reps: 12, rir: 5, targetReps: 8) == nil)
    }
}

// MARK: - Descanso

@Suite("Descanso entre series")
struct RestTimerTests {
    @Test("arranca apagado")
    func apagado() {
        let descanso = RestTimer()

        #expect(descanso.corriendo == false)
        #expect(descanso.restantes == nil)
    }

    @Test("marcar una serie arranca el descanso por defecto")
    func arranca() {
        var descanso = RestTimer()
        descanso.arrancar()

        #expect(descanso.corriendo)
        #expect(descanso.restantes == RestTimer.porDefecto)
        #expect(descanso.texto == "01:30")
    }

    @Test("cada segundo baja uno")
    func baja() {
        var descanso = RestTimer(restantes: 3)

        var termino = descanso.tick()
        #expect(termino == false)
        #expect(descanso.restantes == 2)

        termino = descanso.tick()
        #expect(termino == false)
        #expect(descanso.restantes == 1)
    }

    /// El aviso suena una sola vez, en el segundo en que se termina. Si `tick`
    /// siguiera devolviendo `true` con el descanso apagado, sonaría en loop.
    @Test("avisa una sola vez, justo cuando termina")
    func avisaUnaVez() {
        var descanso = RestTimer(restantes: 1)
        let primerAviso = descanso.tick()

        #expect(primerAviso)
        #expect(descanso.corriendo == false)

        let segundoAviso = descanso.tick()
        let tercerAviso = descanso.tick()
        #expect(segundoAviso == false)
        #expect(tercerAviso == false)
    }

    @Test("apagado, el tiempo no corre")
    func apagadoNoCorre() {
        var descanso = RestTimer()
        let termino = descanso.tick()

        #expect(termino == false)
        #expect(descanso.restantes == nil)
    }

    @Test("+30 suma medio minuto")
    func suma() {
        var descanso = RestTimer(restantes: 20)
        descanso.sumar()

        #expect(descanso.restantes == 50)
    }

    @Test("−15 saca quince")
    func resta() {
        var descanso = RestTimer(restantes: 60)
        descanso.restar()

        #expect(descanso.restantes == 45)
    }

    /// Con 10 segundos restando 15 quedaría en negativo. El descanso no se
    /// termina solo por restar: se termina cuando lo saltás.
    @Test("restar nunca apaga el descanso ni lo deja en negativo",
          arguments: [1, 5, 10, 15])
    func restarNoApaga(restantes: Int) {
        var descanso = RestTimer(restantes: restantes)
        descanso.restar()

        #expect(descanso.restantes == max(1, restantes - 15))
        #expect(descanso.corriendo)
    }

    @Test("los botones no hacen nada si no hay descanso en curso")
    func botonesApagados() {
        var descanso = RestTimer()
        descanso.sumar()
        descanso.restar()

        #expect(descanso.restantes == nil)
    }

    @Test("saltar lo apaga")
    func saltar() {
        var descanso = RestTimer(restantes: 45)
        descanso.saltar()

        #expect(descanso.corriendo == false)
    }

    @Test("el reloj se escribe en minutos y segundos",
          arguments: [(90, "01:30"), (75, "01:15"), (60, "01:00"), (9, "00:09"), (0, "00:00")])
    func reloj(segundos: Int, esperado: String) {
        #expect(RestTimer(restantes: segundos).texto == esperado)
    }

    /// El descanso real y la estimación de duración son dos números distintos a
    /// propósito: la estimación tiene que coincidir con la web.
    @Test("el descanso por defecto no se confunde con el de la estimación")
    func noEsElDeLaEstimacion() {
        #expect(RestTimer.porDefecto == 90)
        #expect(RoutineSummary.secondsPerRest == 75)
    }
}

// MARK: - Terminar serie desde el widget

@Suite("Próxima serie sin marcar")
@MainActor
struct NextSetTests {
    private func borrador(_ porEjercicio: [Int]) -> WorkoutDraft {
        let catalogo = Dictionary(uniqueKeysWithValues: porEjercicio.indices.map { indice in
            ("e\(indice)", Exercise(
                id: "e\(indice)", nameEs: "E\(indice)", nameEn: "", equipment: nil, pattern: nil,
                muscleWeights: [:], registrationType: .pesoReps, unilateral: false,
                descriptionEs: "", mediaURL: nil, source: .catalog, videoURL: nil
            ))
        })
        let rutina = Routine(
            id: "r1", ownerID: "u1", name: "Test", note: "",
            exercises: porEjercicio.enumerated().map { indice, series in
                RoutineExercise(
                    exerciseID: "e\(indice)", source: .catalog, order: indice,
                    targetSets: series, targetReps: 10, targetRIR: nil, targetWeight: nil,
                    techniqueNote: "", sets: nil, group: "", groupColor: ""
                )
            },
            showOnHome: true, lastUsedAt: nil, createdAt: nil, updatedAt: nil, isAssigned: false, weekKey: nil
        )
        return WorkoutDraft(routine: rutina, catalog: catalogo)
    }

    @Test("la primera sin marcar es la primera del primer ejercicio")
    func primera() {
        let draft = borrador([3, 3])
        let proxima = draft.proximaSerieSinMarcar()

        #expect(proxima?.ejercicio == 0)
        #expect(proxima?.serie == 0)
    }

    /// Recorre los ejercicios en orden: con el primero terminado, la próxima
    /// está en el segundo. Es la misma regla con la que la isla decide qué
    /// ejercicio mostrar.
    @Test("con un ejercicio terminado salta al siguiente")
    func saltaDeEjercicio() {
        let draft = borrador([2, 2])
        for indice in draft.exercises[0].sets.indices {
            draft.exercises[0].sets[indice].done = true
        }

        #expect(draft.proximaSerieSinMarcar()?.ejercicio == 1)
        #expect(draft.proximaSerieSinMarcar()?.serie == 0)
    }

    /// Una serie salteada en el medio se marca antes que las de después: el
    /// botón del widget completa lo que falta, no lo que sigue en pantalla.
    @Test("un hueco en el medio se llena primero")
    func hueco() {
        let draft = borrador([3])
        draft.exercises[0].sets[0].done = true
        draft.exercises[0].sets[2].done = true

        #expect(draft.proximaSerieSinMarcar()?.serie == 1)
    }

    @Test("marcar avanza de a una y avisa que marcó")
    func marcarAvanza() {
        let draft = borrador([2])

        #expect(draft.marcarProximaSerie())
        #expect(draft.completedSets == 1)

        let segunda = draft.marcarProximaSerie()
        #expect(segunda)
        #expect(draft.completedSets == 2)
    }

    /// Con todo marcado el botón del widget no puede arrancar otro descanso.
    @Test("con todas marcadas no hay próxima y no marca de más")
    func todasMarcadas() {
        let draft = borrador([1])
        _ = draft.marcarProximaSerie()
        let deMas = draft.marcarProximaSerie()

        #expect(draft.proximaSerieSinMarcar() == nil)
        #expect(deMas == false)
        #expect(draft.completedSets == 1)
    }

    @Test("una rutina sin ejercicios no rompe el botón del widget")
    func sinEjercicios() {
        let draft = borrador([])
        let marco = draft.marcarProximaSerie()

        #expect(draft.proximaSerieSinMarcar() == nil)
        #expect(marco == false)
    }
}

// MARK: - Ejercicio terminado y plegado

@Suite("Ejercicio terminado")
@MainActor
struct ExerciseCompletionTests {
    private func borrador(_ porEjercicio: [Int]) -> WorkoutDraft {
        let catalogo = Dictionary(uniqueKeysWithValues: porEjercicio.indices.map { indice in
            ("e\(indice)", Exercise(
                id: "e\(indice)", nameEs: "E\(indice)", nameEn: "", equipment: nil, pattern: nil,
                muscleWeights: [:], registrationType: .pesoReps, unilateral: false,
                descriptionEs: "", mediaURL: nil, source: .catalog, videoURL: nil
            ))
        })
        let rutina = Routine(
            id: "r1", ownerID: "u1", name: "Test", note: "",
            exercises: porEjercicio.enumerated().map { indice, series in
                RoutineExercise(
                    exerciseID: "e\(indice)", source: .catalog, order: indice,
                    targetSets: series, targetReps: 10, targetRIR: nil, targetWeight: nil,
                    techniqueNote: "", sets: nil, group: "", groupColor: ""
                )
            },
            showOnHome: true, lastUsedAt: nil, createdAt: nil, updatedAt: nil, isAssigned: false, weekKey: nil
        )
        return WorkoutDraft(routine: rutina, catalog: catalogo)
    }

    @Test("recién empezado no está terminado")
    func sinMarcar() {
        #expect(borrador([3]).exercises[0].estaCompleto == false)
    }

    @Test("con algunas marcadas tampoco")
    func aMedias() {
        let draft = borrador([3])
        draft.exercises[0].sets[0].done = true

        #expect(draft.exercises[0].estaCompleto == false)
    }

    @Test("con todas marcadas sí")
    func todas() {
        let draft = borrador([2])
        for indice in draft.exercises[0].sets.indices {
            draft.exercises[0].sets[indice].done = true
        }

        #expect(draft.exercises[0].estaCompleto)
    }

    /// Si le sacás todas las series queda 0 de 0. Sin la guarda de vacío se
    /// pintaría de verde un ejercicio en el que no hiciste nada.
    @Test("un ejercicio sin series no cuenta como terminado")
    func sinSeries() {
        let draft = borrador([2])
        draft.removeSet(from: draft.exercises[0].id, at: IndexSet(integer: 1))
        draft.removeSet(from: draft.exercises[0].id, at: IndexSet(integer: 0))

        #expect(draft.exercises[0].sets.isEmpty)
        #expect(draft.exercises[0].estaCompleto == false)
    }

    /// Una serie fallada cuenta como hecha: cargaste el peso y no llegaste, no
    /// es que la debas.
    @Test("una serie fallada también termina el ejercicio")
    func falladaCuenta() {
        let draft = borrador([1])
        draft.exercises[0].sets[0].failed = true
        draft.exercises[0].sets[0].done = true

        #expect(draft.exercises[0].estaCompleto)
    }

    // MARK: Qué queda desplegado

    @Test("al abrir, el desplegado es el primero")
    func alAbrir() {
        let draft = borrador([2, 2])

        #expect(draft.ejercicioEnCurso == draft.exercises[0].id)
    }

    @Test("al terminar uno, pasa al siguiente")
    func avanza() {
        let draft = borrador([1, 1])
        _ = draft.marcarProximaSerie()

        #expect(draft.exercises[0].estaCompleto)
        #expect(draft.ejercicioEnCurso == draft.exercises[1].id)
    }

    /// Con todo terminado no hay ninguno en curso: la pantalla queda toda
    /// plegada, que es justo cuando querés ver el botón de terminar.
    @Test("con el entrenamiento terminado no queda ninguno abierto")
    func todoTerminado() {
        let draft = borrador([1])
        _ = draft.marcarProximaSerie()

        #expect(draft.ejercicioEnCurso == nil)
    }

    @Test("una rutina vacía no tiene ejercicio en curso")
    func rutinaVacia() {
        #expect(borrador([]).ejercicioEnCurso == nil)
    }
}
