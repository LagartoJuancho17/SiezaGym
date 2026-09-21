import Foundation
import Testing
@testable import SiezaGym

// MARK: - Fixtures

private func exercise(
    _ id: String,
    nameEs: String? = nil,
    nameEn: String = "",
    muscles: [MuscleGroup: Double] = [:],
    registro: RegistrationType = .pesoReps,
    source: ExerciseSource = .catalog
) -> Exercise {
    Exercise(
        id: id,
        nameEs: nameEs ?? id,
        nameEn: nameEn,
        equipment: nil,
        pattern: nil,
        muscleWeights: muscles,
        registrationType: registro,
        unilateral: false,
        descriptionEs: "",
        mediaURL: nil,
        source: source,
        videoURL: nil
    )
}

private func draft(_ registro: RegistrationType = .pesoReps) -> RoutineDraftExercise {
    RoutineDraftExercise(exercise: exercise("press-banca", registro: registro))
}

// MARK: - Valores iniciales

@Suite("Borrador de ejercicio")
struct RoutineDraftExerciseTests {
    @Test("arranca en 3 × 10, forma pareja y del catálogo")
    func porDefecto() {
        let item = draft()
        #expect(item.targetSets == 3)
        #expect(item.targetReps == 10)
        #expect(item.source == .catalog)
        #expect(item.esDetallada == false)
        #expect(item.sets == nil)
    }

    @Test("en los de tiempo el objetivo son 30 segundos, no 10 repeticiones",
          arguments: [RegistrationType.tiempo, .distanciaTiempo])
    func porTiempo(registro: RegistrationType) {
        #expect(draft(registro).targetReps == 30)
    }

    @Test("la cantidad de series nunca baja de 1 ni pasa de 12",
          arguments: [(-4, 1), (0, 1), (1, 1), (7, 7), (12, 12), (40, 12)])
    func topes(pedido: Int, esperado: Int) {
        var item = draft()
        item.cambiarCantidad(pedido)
        #expect(item.cantidadSeries == esperado)
    }

    // MARK: Pareja <-> detallada

    @Test("detallar copia el objetivo a cada serie")
    func detallar() {
        var item = draft()
        item.targetSets = 4
        item.targetReps = 8
        item.targetWeight = 60
        item.targetRIR = 2
        item.detallar()

        #expect(item.esDetallada)
        #expect(item.sets?.count == 4)
        #expect(item.sets?.map(\.setNumber) == [1, 2, 3, 4])
        #expect(item.sets?.allSatisfy { $0.reps == 8 && $0.weight == 60 && $0.rir == 2 } == true)
    }

    @Test("emparejar toma la primera serie como objetivo y descarta el resto")
    func emparejar() {
        var item = draft()
        item.sets = [
            PlannedSet(setNumber: 1, weight: 50, reps: 12, rir: 3),
            PlannedSet(setNumber: 2, weight: 60, reps: 10, rir: 2),
            PlannedSet(setNumber: 3, weight: 70, reps: 8, rir: 1),
        ]
        item.emparejar()

        #expect(item.esDetallada == false)
        #expect(item.targetSets == 3)
        #expect(item.targetReps == 12)
        #expect(item.targetWeight == 50)
        #expect(item.targetRIR == 3)
    }

    @Test("emparejar sin series cargadas no inventa objetivos")
    func emparejarVacio() {
        var item = draft()
        item.targetReps = 15
        item.sets = []
        item.emparejar()

        #expect(item.sets == nil)
        #expect(item.targetReps == 15)
    }

    // MARK: Cambiar la cantidad

    @Test("agregar series copia la última cargada, no arranca vacía")
    func agregarSeries() {
        var item = draft()
        item.sets = [PlannedSet(setNumber: 1, weight: 80, reps: 6, rir: 1)]
        item.cambiarCantidad(3)

        #expect(item.sets?.count == 3)
        #expect(item.sets?.allSatisfy { $0.weight == 80 && $0.reps == 6 && $0.rir == 1 } == true)
        #expect(item.sets?.map(\.setNumber) == [1, 2, 3])
    }

    @Test("quitar series recorta desde el final y renumera")
    func quitarSeries() {
        var item = draft()
        item.sets = (1...4).map { PlannedSet(setNumber: $0, weight: Double($0) * 10, reps: 10, rir: nil) }
        item.cambiarCantidad(2)

        #expect(item.sets?.map(\.weight) == [10, 20])
        #expect(item.sets?.map(\.setNumber) == [1, 2])
    }

    @Test("en forma pareja cambiar la cantidad no crea filas de serie")
    func cambiarCantidadPareja() {
        var item = draft()
        item.cambiarCantidad(5)

        #expect(item.targetSets == 5)
        #expect(item.sets == nil)
    }

    // MARK: Resumen

    @Test("la forma pareja se resume como cantidad × reps")
    func resumenPareja() {
        var item = draft()
        item.targetSets = 4
        item.targetReps = 10
        #expect(item.resumen(esDeTiempo: false) == "4 × 10")
        #expect(item.resumen(esDeTiempo: true) == "4 × 10s")
    }

    @Test("una rampa lista las repeticiones una por una")
    func resumenRampa() {
        var item = draft()
        item.sets = [
            PlannedSet(setNumber: 1, weight: nil, reps: 12, rir: nil),
            PlannedSet(setNumber: 2, weight: nil, reps: 10, rir: nil),
            PlannedSet(setNumber: 3, weight: nil, reps: 8, rir: nil),
        ]
        #expect(item.resumen(esDeTiempo: false) == "12 · 10 · 8")
    }

    @Test("si todas las series son iguales se resume igual que la forma pareja")
    func resumenDetalladaUniforme() {
        var item = draft()
        item.sets = (1...3).map { PlannedSet(setNumber: $0, weight: nil, reps: 10, rir: nil) }
        #expect(item.resumen(esDeTiempo: false) == "3 × 10")
    }

    // MARK: Documento de Firestore

    /// La forma de documento tiene que ser la misma que escribe
    /// `sanitizeExercises` en lib/routines/routines.js: si los dos clientes no
    /// escriben igual, una rutina creada en el teléfono se lee distinto en la web.
    @Test("la forma pareja escribe las mismas claves que la web, con sets en null")
    func documentoPareja() {
        var item = draft()
        item.targetSets = 4
        item.targetReps = 8
        let valor = item.firestoreValue(order: 2)

        #expect(Set(valor.keys) == [
            "exerciseId", "exerciseSource", "order", "targetSets",
            "targetReps", "targetRIR", "targetWeight", "techniqueNote", "sets",
        ])
        #expect(valor["exerciseId"] as? String == "press-banca")
        #expect(valor["exerciseSource"] as? String == "catalog")
        #expect(valor["order"] as? Int == 2)
        #expect(valor["targetSets"] as? Int == 4)
        #expect(valor["targetReps"] as? Int == 8)
        #expect(valor["techniqueNote"] as? String == "")
        #expect(valor["targetRIR"] is NSNull)
        #expect(valor["targetWeight"] is NSNull)
        #expect(valor["sets"] is NSNull)
    }

    @Test("la forma detallada escribe una fila por serie, renumerada desde 1")
    func documentoDetallado() {
        var item = draft()
        item.sets = [
            PlannedSet(setNumber: 7, weight: 60, reps: 10, rir: 2),
            PlannedSet(setNumber: 9, weight: nil, reps: 8, rir: nil),
        ]
        let valor = item.firestoreValue(order: 0)
        let series = valor["sets"] as? [[String: Any]]

        #expect(series?.count == 2)
        #expect(series?.map { $0["setNumber"] as? Int } == [1, 2])
        #expect(series?[0]["weight"] as? Double == 60)
        #expect(series?[0]["reps"] as? Int == 10)
        #expect(series?[0]["rir"] as? Int == 2)
        #expect(series?[1]["weight"] is NSNull)
        #expect(series?[1]["rir"] is NSNull)
    }

    /// En la web un campo vacio llega como null y `Number(null) || 10` lo
    /// convierte en 10. Si el telefono guardara 0, la misma rutina abierta en la
    /// web diria "3 x 0".
    @Test("dejar las repeticiones vacías se guarda como 10, no como 0")
    func repsVaciasValen10() {
        var item = draft()
        item.targetReps = 0

        #expect(item.firestoreValue(order: 0)["targetReps"] as? Int == 10)
    }

    @Test("detallar con las repeticiones vacías arranca las series en 10")
    func detallarConRepsVacias() {
        var item = draft()
        item.targetReps = 0
        item.detallar()

        #expect(item.sets?.allSatisfy { $0.reps == 10 } == true)
    }

    @Test("una serie detallada sin repeticiones también se guarda como 10")
    func serieVaciaValeTambien10() {
        var item = draft()
        item.sets = [PlannedSet(setNumber: 1, weight: nil, reps: 0, rir: nil)]

        let series = item.firestoreValue(order: 0)["sets"] as? [[String: Any]]
        #expect(series?[0]["reps"] as? Int == 10)
    }

    @Test("un ejercicio propio se guarda con exerciseSource custom")
    func origenCustom() {
        let propio = RoutineDraftExercise(exercise: exercise("plancha", source: .custom))

        #expect(propio.source == .custom)
        #expect(propio.firestoreValue(order: 0)["exerciseSource"] as? String == "custom")
    }

    @Test("la nota técnica se guarda sin espacios de más")
    func notaTecnica() {
        var item = draft()
        item.techniqueNote = "  Espalda neutra  "

        #expect(item.firestoreValue(order: 0)["techniqueNote"] as? String == "Espalda neutra")
    }

    @Test("targetSets guardado es la cantidad real de series detalladas")
    func documentoDetalladoCuentaSeries() {
        var item = draft()
        item.targetSets = 3
        item.sets = (1...5).map { PlannedSet(setNumber: $0, weight: nil, reps: 10, rir: nil) }

        #expect(item.firestoreValue(order: 0)["targetSets"] as? Int == 5)
    }
}

// MARK: - Regiones

@Suite("Regiones musculares")
struct MuscleRegionTests {
    @Test("las seis regiones cubren los dieciséis músculos, sin repetir ninguno")
    func cobertura() {
        let todos = MuscleRegion.allCases.flatMap(\.muscles)
        #expect(Set(todos) == Set(MuscleGroup.allCases))
        #expect(todos.count == MuscleGroup.allCases.count)
    }

    @Test("una región incluye al ejercicio si alguno de sus músculos participa")
    func incluye() {
        let remo = exercise("remo", muscles: [.dorsal: 0.7, .biceps: 0.3])
        #expect(MuscleRegion.espalda.incluye(remo))
        #expect(MuscleRegion.brazos.incluye(remo))
        #expect(MuscleRegion.piernas.incluye(remo) == false)
    }

    @Test("un músculo con peso cero no cuenta como trabajado")
    func pesoCero() {
        let plancha = exercise("plancha", muscles: [.abdomen: 1, .pecho: 0])
        #expect(MuscleRegion.core.incluye(plancha))
        #expect(MuscleRegion.pecho.incluye(plancha) == false)
    }
}

// MARK: - Búsqueda

@Suite("Búsqueda de ejercicios")
struct ExerciseSearchTests {
    private let catalogo = [
        exercise("a", nameEs: "Press de banca", nameEn: "Bench press", muscles: [.pecho: 1]),
        exercise("b", nameEs: "Sentadilla búlgara", nameEn: "Bulgarian split squat", muscles: [.cuadriceps: 1]),
        exercise("c", nameEs: "Remo con barra", nameEn: "Barbell row", muscles: [.dorsal: 1]),
    ]

    @Test("sin texto ni región devuelve todo el catálogo")
    func sinFiltros() {
        #expect(ExerciseSearch.filtrar(catalogo, texto: "", region: nil).count == 3)
    }

    @Test("los espacios sueltos no filtran nada")
    func soloEspacios() {
        #expect(ExerciseSearch.filtrar(catalogo, texto: "   ", region: nil).count == 3)
    }

    @Test("busca sin tildes y sin mayúsculas", arguments: ["bulgara", "BÚLGARA", "Sentadilla"])
    func acentosYMayusculas(texto: String) {
        let encontrados = ExerciseSearch.filtrar(catalogo, texto: texto, region: nil)
        #expect(encontrados.map(\.id) == ["b"])
    }

    @Test("también busca por el nombre en inglés")
    func nombreEnIngles() {
        #expect(ExerciseSearch.filtrar(catalogo, texto: "bench", region: nil).map(\.id) == ["a"])
    }

    @Test("el texto y la región se aplican juntos")
    func textoYRegion() {
        #expect(ExerciseSearch.filtrar(catalogo, texto: "press", region: .pecho).map(\.id) == ["a"])
        #expect(ExerciseSearch.filtrar(catalogo, texto: "press", region: .piernas).isEmpty)
    }

    @Test("lo que no coincide no aparece")
    func sinResultados() {
        #expect(ExerciseSearch.filtrar(catalogo, texto: "dominadas", region: nil).isEmpty)
    }
}

// MARK: - Armado

@Suite("Armado de la rutina")
struct RoutineComposeTests {
    private func items(_ ids: [String]) -> [RoutineDraftExercise] {
        ids.map { RoutineDraftExercise(exercise: exercise($0)) }
    }

    @Test("mover cambia el orden sin perder la prescripción cargada")
    func moverConservaSeries() {
        var lista = items(["a", "b", "c"])
        lista[0].sets = [PlannedSet(setNumber: 1, weight: 90, reps: 5, rir: 1)]

        let movida = RoutineCompose.mover(lista, de: 0, a: 2)
        #expect(movida.map(\.exerciseID) == ["b", "c", "a"])
        #expect(movida[2].sets?.first?.weight == 90)
    }

    @Test("mover hacia arriba intercambia con el anterior")
    func moverArriba() {
        #expect(RoutineCompose.mover(items(["a", "b", "c"]), de: 2, a: 1).map(\.exerciseID) == ["a", "c", "b"])
    }

    @Test("un índice fuera de rango deja la lista igual",
          arguments: [(-1, 0), (0, -1), (3, 0), (0, 3)])
    func moverFueraDeRango(origen: Int, destino: Int) {
        let lista = items(["a", "b", "c"])
        #expect(RoutineCompose.mover(lista, de: origen, a: destino).map(\.exerciseID) == ["a", "b", "c"])
    }

    @Test("mover a la misma posición no cambia nada")
    func moverAlMismoLugar() {
        #expect(RoutineCompose.mover(items(["a", "b"]), de: 1, a: 1).map(\.exerciseID) == ["a", "b"])
    }

    // MARK: Reparto muscular

    @Test("sin ejercicios no hay reparto")
    func repartoVacio() {
        #expect(RoutineCompose.reparto([], catalogo: [:]).isEmpty)
    }

    @Test("un ejercicio sin músculos cargados no arma reparto")
    func repartoSinPesos() {
        let press = exercise("press")
        #expect(RoutineCompose.reparto(items(["press"]), catalogo: ["press": press]).isEmpty)
    }

    @Test("los porcentajes salen de series × peso y suman 1")
    func repartoPorcentajes() {
        let catalogo = [
            "press": exercise("press", muscles: [.pecho: 0.7, .triceps: 0.3]),
            "curl": exercise("curl", muscles: [.biceps: 1]),
        ]
        var lista = items(["press", "curl"])
        lista[0].cambiarCantidad(4) // 4 series: 2.8 pecho + 1.2 tríceps
        lista[1].cambiarCantidad(2) // 2 series: 2.0 bíceps

        let reparto = RoutineCompose.reparto(lista, catalogo: catalogo)
        #expect(reparto.map(\.muscle) == [.pecho, .biceps, .triceps])
        #expect(abs(reparto[0].pct - 2.8 / 6) < 0.0001)
        #expect(abs(reparto.reduce(0) { $0 + $1.pct } - 1) < 0.0001)
    }

    @Test("un ejercicio que no está en el catálogo no cuenta")
    func repartoIgnoraDesconocidos() {
        let catalogo = ["press": exercise("press", muscles: [.pecho: 1])]
        let reparto = RoutineCompose.reparto(items(["press", "fantasma"]), catalogo: catalogo)

        #expect(reparto.count == 1)
        #expect(reparto[0].pct == 1)
    }

    /// El sort de Swift no es estable: sin desempate explícito dos músculos con
    /// el mismo porcentaje podrían salir en orden distinto en cada pantalla.
    @Test("los empates se ordenan por el orden de los grupos musculares")
    func repartoEmpates() {
        let catalogo = [
            "e": exercise("e", muscles: [.gemelo: 0.25, .pecho: 0.25, .biceps: 0.25, .abdomen: 0.25]),
        ]
        let reparto = RoutineCompose.reparto(items(["e"]), catalogo: catalogo)

        #expect(reparto.map(\.muscle) == [.pecho, .biceps, .gemelo, .abdomen])
    }
}

// MARK: - Validación

@Suite("Validación de la rutina")
struct RoutineDraftValidationTests {
    private var item: RoutineDraftExercise {
        RoutineDraftExercise(exercise: exercise("press"))
    }

    @Test("sin nombre no se guarda", arguments: ["", "   ", "\n"])
    func sinNombre(nombre: String) {
        #expect(throws: RoutineDraftValidationError.missingName) {
            try RoutineDraftValidation.validate(name: nombre, exercises: [item])
        }
    }

    @Test("sin ejercicios no se guarda")
    func sinEjercicios() {
        #expect(throws: RoutineDraftValidationError.missingExercises) {
            try RoutineDraftValidation.validate(name: "Fuerza", exercises: [])
        }
    }

    @Test("con nombre y un ejercicio se guarda")
    func valida() throws {
        try RoutineDraftValidation.validate(name: "Empuje A", exercises: [item])
    }
}

// MARK: - Editar una rutina

@Suite("Editar una rutina")
struct RoutineEditTests {
    private func guardado(
        _ id: String = "press",
        sets: Int = 4,
        reps: Int = 8,
        peso: Double? = 60,
        rir: Int? = 2,
        nota: String = "Espalda neutra",
        series: [PlannedSet]? = nil,
        origen: RoutineExercise.Source = .catalog
    ) -> RoutineExercise {
        RoutineExercise(
            exerciseID: id,
            source: origen,
            order: 0,
            targetSets: sets,
            targetReps: reps,
            targetRIR: rir,
            targetWeight: peso,
            techniqueNote: nota,
            sets: series
        )
    }

    @Test("abrir el editor no pierde nada de lo prescrito")
    func abrirNoPierde() {
        let borrador = RoutineDraftExercise(guardado())

        #expect(borrador.exerciseID == "press")
        #expect(borrador.targetSets == 4)
        #expect(borrador.targetReps == 8)
        #expect(borrador.targetWeight == 60)
        #expect(borrador.targetRIR == 2)
        #expect(borrador.techniqueNote == "Espalda neutra")
        #expect(borrador.esDetallada == false)
    }

    /// Si la rampa se aplastara a "4 × 10" al abrir el editor, guardar sin
    /// tocar nada rompería la rutina que cargó el coach.
    @Test("una rampa sobrevive a abrir y guardar sin tocar nada")
    func rampaSobrevive() {
        let rampa = [
            PlannedSet(setNumber: 1, weight: 40, reps: 12, rir: 3),
            PlannedSet(setNumber: 2, weight: 50, reps: 10, rir: 2),
            PlannedSet(setNumber: 3, weight: 60, reps: 8, rir: 1),
        ]
        let borrador = RoutineDraftExercise(guardado(series: rampa))

        #expect(borrador.esDetallada)
        #expect(borrador.resumen(esDeTiempo: false) == "12 · 10 · 8")

        let series = borrador.firestoreValue(order: 0)["sets"] as? [[String: Any]]
        #expect(series?.map { $0["reps"] as? Int } == [12, 10, 8])
        #expect(series?.map { $0["weight"] as? Double } == [40, 50, 60])
        #expect(series?.map { $0["rir"] as? Int } == [3, 2, 1])
    }

    @Test("un ejercicio propio sigue siendo propio después de editar")
    func origenSeConserva() {
        let borrador = RoutineDraftExercise(guardado(origen: .custom))

        #expect(borrador.source == .custom)
        #expect(borrador.firestoreValue(order: 0)["exerciseSource"] as? String == "custom")
    }

    /// `sets: []` es lo que deja un documento viejo; tiene que leerse como
    /// forma pareja y no como una rampa de cero series.
    @Test("un sets vacío se lee como prescripción pareja")
    func setsVacio() {
        let borrador = RoutineDraftExercise(guardado(series: []))

        #expect(borrador.esDetallada == false)
        #expect(borrador.cantidadSeries == 4)
        #expect(borrador.firestoreValue(order: 0)["sets"] is NSNull)
    }

    @Test("el orden se renumera desde cero al guardar")
    func ordenRenumerado() {
        let items = ["a", "b", "c"].map { RoutineDraftExercise(guardado($0)) }
        let ordenes = items.enumerated().map { $1.firestoreValue(order: $0)["order"] as? Int }

        #expect(ordenes == [0, 1, 2])
    }
}
