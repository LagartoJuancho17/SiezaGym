import Foundation

nonisolated enum Sex: String, CaseIterable, Sendable {
    case masculino
    case femenino
    case prefieroNoDecir = "prefiero_no_decir"

    var label: String {
        switch self {
        case .masculino: "Masculino"
        case .femenino: "Femenino"
        case .prefieroNoDecir: "Prefiero no decir"
        }
    }
}

nonisolated enum ExperienceLevel: String, CaseIterable, Sendable {
    case principiante, intermedio, avanzado

    var label: String { rawValue.capitalized }
}

/// Para qué entrena. Lo elige en "Conocerte" y se puede cambiar en Tus datos.
nonisolated enum TrainingGoal: String, CaseIterable, Sendable {
    case hipertrofia
    case fuerza
    case hipertrofiaFuerza = "hipertrofia_fuerza"
    case perderGrasa = "perder_grasa"
    case salud

    var label: String {
        switch self {
        case .hipertrofia: "Hipertrofia"
        case .fuerza: "Fuerza"
        case .hipertrofiaFuerza: "Hipertrofia y fuerza"
        case .perderGrasa: "Perder grasa"
        case .salud: "Salud general"
        }
    }

    var detalle: String {
        switch self {
        case .hipertrofia: "Ganar músculo"
        case .fuerza: "Levantar más peso"
        case .hipertrofiaFuerza: "Las dos cosas"
        case .perderGrasa: "Bajar de peso entrenando"
        case .salud: "Moverme y sentirme bien"
        }
    }

    var icono: String {
        switch self {
        case .hipertrofia: "figure.strengthtraining.traditional"
        case .fuerza: "scalemass.fill"
        case .hipertrofiaFuerza: "dumbbell.fill"
        case .perderGrasa: "flame.fill"
        case .salud: "heart.fill"
        }
    }
}

nonisolated struct UserProfile: Identifiable, Sendable, Hashable {
    let id: String
    let email: String?
    let displayName: String?
    let photoURL: URL?
    let isCoach: Bool
    /// Admin del proyecto: ve el panel de entrenador sin haber generado un código.
    var isAdmin = false
    let sex: Sex?
    let bodyWeightKg: Double?
    let heightCm: Double?
    let weeklyCalorieGoalKcal: Double?
    let experienceLevel: ExperienceLevel?
    var trainingGoal: TrainingGoal? = nil
    var trainingDaysPerWeek: Int? = nil

    var initial: String {
        let base = displayName?.first ?? email?.first ?? "T"
        return String(base).uppercased()
    }
}

nonisolated extension UserProfile {
    init(id: String, data: [String: Any]) {
        self.id = id
        email = data["email"] as? String
        displayName = data["displayName"] as? String
        photoURL = (data["photoURL"] as? String).flatMap(URL.init(string:))
        isCoach = FirestoreValue.bool(data["isCoach"]) ?? false
        isAdmin = FirestoreValue.bool(data["isAdmin"]) ?? false
        sex = (data["sex"] as? String).flatMap(Sex.init(rawValue:))
        bodyWeightKg = FirestoreValue.double(data["bodyWeightKg"])
        heightCm = FirestoreValue.double(data["heightCm"])
        weeklyCalorieGoalKcal = FirestoreValue.double(data["weeklyCalorieGoalKcal"])
        experienceLevel = (data["experienceLevel"] as? String).flatMap(ExperienceLevel.init(rawValue:))
        trainingGoal = (data["trainingGoal"] as? String).flatMap(TrainingGoal.init(rawValue:))
        trainingDaysPerWeek = FirestoreValue.int(data["trainingDaysPerWeek"])
    }
}
