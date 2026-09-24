import Foundation
import Testing
@testable import SiezaGym

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
                    techniqueNote: "", sets: nil
                )
            },
            showOnHome: true, lastUsedAt: nil, createdAt: nil, updatedAt: nil, isAssigned: false
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
