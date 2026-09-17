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

nonisolated struct UserProfile: Identifiable, Sendable, Hashable {
    let id: String
    let email: String?
    let displayName: String?
    let photoURL: URL?
    let isCoach: Bool
    let sex: Sex?
    let bodyWeightKg: Double?
    let heightCm: Double?
    let weeklyCalorieGoalKcal: Double?
    let experienceLevel: ExperienceLevel?

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
        sex = (data["sex"] as? String).flatMap(Sex.init(rawValue:))
        bodyWeightKg = FirestoreValue.double(data["bodyWeightKg"])
        heightCm = FirestoreValue.double(data["heightCm"])
        weeklyCalorieGoalKcal = FirestoreValue.double(data["weeklyCalorieGoalKcal"])
        experienceLevel = (data["experienceLevel"] as? String).flatMap(ExperienceLevel.init(rawValue:))
    }
}
