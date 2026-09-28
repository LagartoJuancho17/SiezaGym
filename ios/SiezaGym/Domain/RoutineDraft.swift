import Foundation

/// Un ejercicio mientras se arma la rutina, antes de guardarla.
///
/// Guarda las dos formas de prescribir que acepta el modelo, igual que la web:
/// pareja (todas las series iguales, en `targetSets`/`targetReps`) y detallada
/// (una fila por serie, en `sets`). `sets` en nil es la forma pareja.
nonisolated struct RoutineDraftExercise: Identifiable, Sendable, Hashable {
    let exerciseID: String
    let source: ExerciseSource
    var targetSets: Int
    var targetReps: Int
    var targetWeight: Double?
    var targetRIR: Int?
    var techniqueNote: String
    var sets: [PlannedSet]?
    /// Bloque al que pertenece ("Entrada en calor", "Fuerza"...). Vacío es sin
    /// grupo, igual que en la web.
    var group = ""
    var groupColor = ""

    var id: String { exerciseID }

    init(exercise: Exercise) {
        exerciseID = exercise.id
        // Un ejercicio propio se guarda con `exerciseSource: "custom"`: la web
        // los busca en otra colección y con el origen mal no los encuentra.
        source = exercise.source
        targetSets = 3
        // En los ejercicios de tiempo, targetReps son segundos y no repeticiones.
        targetReps = exercise.registrationType.isTimeBased ? 30 : 10
        targetWeight = nil
        targetRIR = nil
        techniqueNote = ""
        sets = nil
    }

    /// Una rutina que ya existe, para editarla.
    ///
    /// Tiene que ser sin pérdida: si la rampa que cargó el coach se aplastara a
    /// "4 × 10" al abrir el editor, guardar sin tocar nada rompería la rutina.
    init(_ item: RoutineExercise) {
        exerciseID = item.exerciseID
        source = ExerciseSource(rawValue: item.source.rawValue) ?? .catalog
        targetSets = item.targetSets
        targetReps = item.targetReps
        targetWeight = item.targetWeight
        targetRIR = item.targetRIR
        techniqueNote = item.techniqueNote
        sets = (item.sets?.isEmpty == true) ? nil : item.sets
        group = item.group
        groupColor = item.groupColor
    }

    var esDetallada: Bool { !(sets ?? []).isEmpty }

    /// Cuántas series prescribe, sea cual sea la forma. Sin tope: 0 es un
    /// estado transitorio válido (el campo recién borrado, todavía
    /// escribiendo el número nuevo), no se fuerza a 1 acá — eso pasa recién
    /// al guardar, en `firestoreValue`.
    var cantidadSeries: Int {
        esDetallada ? sets!.count : max(0, targetSets)
    }

    /// Las repeticiones que vale una serie nueva. Vacío cuenta como 10, igual
    /// que `Number(item?.targetReps) || 10` en lib/routines/prescription.js.
    private var repsOEsperado: Int { targetReps > 0 ? targetReps : 10 }

    /// Pasa de pareja a detallada: arranca con todas las series iguales. Es
    /// una acción a propósito y no tipeo en curso, así que acá sí se garantiza
    /// al menos una fila aunque el campo haya quedado en blanco.
    mutating func detallar() {
        sets = (0..<max(1, cantidadSeries)).map {
            PlannedSet(setNumber: $0 + 1, weight: targetWeight, reps: repsOEsperado, rir: targetRIR)
        }
    }

    /// Vuelve a pareja tomando la primera serie como referencia.
    mutating func emparejar() {
        if let primera = sets?.first {
            targetSets = sets!.count
            targetReps = primera.reps
            targetWeight = primera.weight
            targetRIR = primera.rir
        }
        sets = nil
    }

    /// Ajusta la cantidad de series. Las nuevas copian a la última cargada: en
    /// el gimnasio una serie nueva repite o sube desde la anterior, nunca
    /// arranca vacía.
    ///
    /// Sin tope de arriba (no hay motivo para no poder cargar 20 series) y sin
    /// piso de 1 acá: borrar el campo para escribir un número nuevo tiene que
    /// poder dejarlo en blanco un instante sin que salte a "1" solo. El piso
    /// real está en `firestoreValue`, al guardar.
    mutating func cambiarCantidad(_ nueva: Int) {
        let total = max(0, nueva)
        targetSets = total
        guard esDetallada else { return }

        var filas = Array(sets!.prefix(total))
        while filas.count < total {
            let ultima = filas.last
            filas.append(PlannedSet(
                setNumber: filas.count + 1,
                weight: ultima?.weight ?? targetWeight,
                reps: ultima?.reps ?? targetReps,
                rir: ultima?.rir ?? targetRIR
            ))
        }
        sets = filas.enumerated().map { PlannedSet(setNumber: $0 + 1, weight: $1.weight, reps: $1.reps, rir: $1.rir) }
    }

    /// Resumen corto para la fila cerrada. Con una rampa muestra los valores
    /// uno por uno, que es justo lo que se pierde al resumir como "4 × 10".
    func resumen(esDeTiempo: Bool) -> String {
        let unidad = esDeTiempo ? "s" : ""
        guard esDetallada else { return "\(cantidadSeries) × \(targetReps)\(unidad)" }
        let reps = sets!.map(\.reps)
        if Set(reps).count == 1 { return "\(reps.count) × \(reps[0])\(unidad)" }
        return reps.map(String.init).joined(separator: " · ") + unidad
    }

    /// El documento que espera Firestore, igual al que escribe la web.
    ///
    /// Acá sí se pisa en 1: guardar con el campo de Series en blanco no puede
    /// mandar una rutina con 0 series.
    func firestoreValue(order: Int) -> [String: Any] {
        var valor: [String: Any] = [
            "exerciseId": exerciseID,
            "exerciseSource": source.rawValue,
            "order": order,
            "targetSets": max(1, cantidadSeries),
            "targetReps": repsOEsperado,
            "targetRIR": targetRIR as Any? ?? NSNull(),
            "targetWeight": targetWeight as Any? ?? NSNull(),
            "techniqueNote": techniqueNote.trimmingCharacters(in: .whitespacesAndNewlines),
            "group": group.trimmingCharacters(in: .whitespaces),
            "groupColor": groupColor,
        ]
        valor["sets"] = esDetallada
            ? sets!.enumerated().map { indice, serie in
                [
                    "setNumber": indice + 1,
                    "weight": serie.weight as Any? ?? NSNull(),
                    "reps": serie.reps > 0 ? serie.reps : 10,
                    "rir": serie.rir as Any? ?? NSNull(),
                ] as [String: Any]
            }
            : NSNull()
        return valor
    }
}

nonisolated enum RoutineDraftValidationError: LocalizedError, Equatable {
    case missingName
    case missingExercises

    var errorDescription: String? {
        switch self {
        // Los mismos textos que tira `createRoutine` en la web.
        case .missingName: "Ponele un nombre a la rutina."
        case .missingExercises: "Agregá al menos un ejercicio."
        }
    }
}

/// Se valida acá y no en la pantalla para que el repositorio no pueda escribir
/// una rutina sin nombre ni ejercicios aunque la llamen de otro lado.
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

/// Las seis regiones musculares del filtro, iguales a las de la web: dieciséis
/// botones no entran en una fila de teléfono.
nonisolated enum MuscleRegion: String, CaseIterable, Identifiable, Sendable {
    case pecho, espalda, hombros, brazos, piernas, core

    var id: String { rawValue }

    var label: String {
        switch self {
        case .pecho: "Pecho"
        case .espalda: "Espalda"
        case .hombros: "Hombros"
        case .brazos: "Brazos"
        case .piernas: "Piernas"
        case .core: "Core"
        }
    }

    var muscles: [MuscleGroup] {
        switch self {
        case .pecho: [.pecho]
        case .espalda: [.dorsal, .espaldaAltaTrapecio]
        case .hombros: [.deltoideAnterior, .deltoideLateral, .deltoidePosterior]
        case .brazos: [.biceps, .triceps, .antebrazo]
        case .piernas: [.cuadriceps, .isquiotibiales, .gluteo, .aductores, .gemelo]
        case .core: [.abdomen, .lumbar]
        }
    }

    func incluye(_ ejercicio: Exercise) -> Bool {
        muscles.contains { (ejercicio.muscleWeights[$0] ?? 0) > 0 }
    }
}

nonisolated enum ExerciseSearch {
    /// Busca por nombre en castellano y en inglés, sin tildes ni mayúsculas.
    static func filtrar(_ ejercicios: [Exercise], texto: String, region: MuscleRegion?) -> [Exercise] {
        let termino = texto.trimmingCharacters(in: .whitespaces)
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)

        return ejercicios.filter { ejercicio in
            if let region, !region.incluye(ejercicio) { return false }
            guard !termino.isEmpty else { return true }
            let heno = "\(ejercicio.nameEs) \(ejercicio.nameEn)"
                .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
            return heno.contains(termino)
        }
    }
}

/// Las cuentas del armador de rutinas. Viven acá y no en la vista para poder
/// probarlas: son las mismas de lib/routines/compose.js y
/// lib/routines/summary.js en la web.
nonisolated enum RoutineCompose {
    /// Mueve un ejercicio sin tocar su prescripción ni perder las series
    /// cargadas. Un índice fuera de rango devuelve la lista igual.
    static func mover(_ items: [RoutineDraftExercise], de origen: Int, a destino: Int) -> [RoutineDraftExercise] {
        guard items.indices.contains(origen), items.indices.contains(destino) else { return items }
        var copia = items
        copia.insert(copia.remove(at: origen), at: destino)
        return copia
    }

    /// Reparto del esfuerzo entre músculos: series × peso de cada músculo,
    /// normalizado. Sale de `muscleWeights` del catálogo, no de una estimación.
    ///
    /// El desempate sigue el orden de `MuscleGroup.allCases` porque el sort de
    /// Swift no es estable: sin esto dos pantallas con los mismos datos podrían
    /// ordenar distinto dos músculos empatados.
    static func reparto(_ items: [RoutineDraftExercise], catalogo: [String: Exercise]) -> [RepartoMuscular] {
        var crudo: [MuscleGroup: Double] = [:]
        var total: Double = 0

        for item in items {
            guard let ejercicio = catalogo[item.exerciseID] else { continue }
            let series = Double(item.cantidadSeries)
            for (musculo, peso) in ejercicio.muscleWeights where peso > 0 {
                crudo[musculo, default: 0] += series * peso
                total += series * peso
            }
        }

        guard total > 0 else { return [] }
        return MuscleGroup.allCases
            .compactMap { musculo in
                guard let parte = crudo[musculo], parte > 0 else { return nil }
                return RepartoMuscular(muscle: musculo, pct: parte / total)
            }
            .sorted { izquierda, derecha in
                if izquierda.pct != derecha.pct { return izquierda.pct > derecha.pct }
                return izquierda.orden < derecha.orden
            }
    }
}

/// Una fila del reparto muscular.
nonisolated struct RepartoMuscular: Identifiable, Sendable, Hashable {
    let muscle: MuscleGroup
    let pct: Double

    var id: MuscleGroup { muscle }
    var orden: Int { MuscleGroup.allCases.firstIndex(of: muscle) ?? 0 }
}
