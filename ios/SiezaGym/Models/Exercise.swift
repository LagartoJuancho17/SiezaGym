import Foundation

/// Grupos musculares del catalogo. Los rawValue son las claves exactas que
/// guarda Firestore en `muscleWeights`, no se pueden renombrar sin migrar data.
nonisolated enum MuscleGroup: String, CaseIterable, Sendable, Hashable {
    case pecho
    case dorsal
    case espaldaAltaTrapecio
    case deltoideAnterior
    case deltoideLateral
    case deltoidePosterior
    case biceps
    case triceps
    case antebrazo
    case cuadriceps
    case isquiotibiales
    case gluteo
    case aductores
    case gemelo
    case abdomen
    case lumbar

    var label: String {
        switch self {
        case .pecho: "Pecho"
        case .dorsal: "Dorsal"
        case .espaldaAltaTrapecio: "Espalda alta y trapecio"
        case .deltoideAnterior: "Deltoide anterior"
        case .deltoideLateral: "Deltoide lateral"
        case .deltoidePosterior: "Deltoide posterior"
        case .biceps: "Bíceps"
        case .triceps: "Tríceps"
        case .antebrazo: "Antebrazo"
        case .cuadriceps: "Cuádriceps"
        case .isquiotibiales: "Isquiotibiales"
        case .gluteo: "Glúteo"
        case .aductores: "Aductores"
        case .gemelo: "Gemelo"
        case .abdomen: "Abdomen"
        case .lumbar: "Lumbar"
        }
    }
}

nonisolated enum Equipment: String, Sendable {
    case barra, mancuerna, maquina, polea, pesoCorporal = "peso_corporal", banda, kettlebell

    var label: String {
        switch self {
        case .barra: "Barra"
        case .mancuerna: "Mancuerna"
        case .maquina: "Máquina"
        case .polea: "Polea"
        case .pesoCorporal: "Peso corporal"
        case .banda: "Banda"
        case .kettlebell: "Kettlebell"
        }
    }
}

nonisolated enum MovementPattern: String, Sendable {
    case empujeHorizontal = "empuje_horizontal"
    case empujeVertical = "empuje_vertical"
    case traccionHorizontal = "traccion_horizontal"
    case traccionVertical = "traccion_vertical"
    case dominanteRodilla = "dominante_rodilla"
    case dominanteCadera = "dominante_cadera"
    case aislamiento
    case core

    var isPush: Bool { self == .empujeHorizontal || self == .empujeVertical }
    var isPull: Bool { self == .traccionHorizontal || self == .traccionVertical }

    var label: String {
        switch self {
        case .empujeHorizontal: "Empuje horizontal"
        case .empujeVertical: "Empuje vertical"
        case .traccionHorizontal: "Tracción horizontal"
        case .traccionVertical: "Tracción vertical"
        case .dominanteRodilla: "Dominante de rodilla"
        case .dominanteCadera: "Dominante de cadera"
        case .aislamiento: "Aislamiento"
        case .core: "Core"
        }
    }
}

nonisolated enum RegistrationType: String, Sendable {
    case pesoReps = "peso_reps"
    case reps
    case tiempo
    case distanciaTiempo = "distancia_tiempo"

    /// En estos, `targetReps` es una duracion en segundos, no una cantidad.
    var isTimeBased: Bool { self == .tiempo || self == .distanciaTiempo }

    var label: String {
        switch self {
        case .pesoReps: "Peso × reps"
        case .reps: "Solo reps"
        case .tiempo: "Tiempo"
        case .distanciaTiempo: "Distancia + tiempo"
        }
    }
}

nonisolated struct Exercise: Identifiable, Sendable, Hashable {
    let id: String
    let nameEs: String
    let nameEn: String
    let equipment: Equipment?
    let pattern: MovementPattern?
    /// Reparto del esfuerzo entre musculos. Los valores suman 1.0.
    let muscleWeights: [MuscleGroup: Double]
    let registrationType: RegistrationType
    let unilateral: Bool
    let descriptionEs: String
    let mediaURL: URL?

    var primaryMuscle: MuscleGroup? {
        muscleWeights.max { $0.value < $1.value }?.key
    }
}

nonisolated extension Exercise {
    init(id: String, data: [String: Any]) {
        self.id = id
        nameEs = data["nameEs"] as? String ?? id
        nameEn = data["nameEn"] as? String ?? ""
        equipment = (data["equipment"] as? String).flatMap(Equipment.init(rawValue:))
        pattern = (data["pattern"] as? String).flatMap(MovementPattern.init(rawValue:))
        registrationType = (data["registrationType"] as? String)
            .flatMap(RegistrationType.init(rawValue:)) ?? .pesoReps
        unilateral = FirestoreValue.bool(data["unilateral"]) ?? false
        descriptionEs = data["descriptionEs"] as? String ?? ""
        mediaURL = (data["mediaUrl"] as? String).flatMap(URL.init(string:))

        var weights: [MuscleGroup: Double] = [:]
        for (key, value) in data["muscleWeights"] as? [String: Any] ?? [:] {
            guard let muscle = MuscleGroup(rawValue: key), let share = FirestoreValue.double(value) else { continue }
            weights[muscle] = share
        }
        muscleWeights = weights
    }
}
