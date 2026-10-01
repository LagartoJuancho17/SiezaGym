import Foundation

/// "Conocerte": tres pasos después del primer login para armar el perfil de
/// entrenamiento (objetivo, frecuencia y experiencia, peso) y estimar la meta
/// semanal de calorías. La lógica vive acá, pura, para probarla.
nonisolated enum Conocerte {
    static let pasos = 3
    static let diasPosibles = Array(2...6)

    /// Duración y MET típicos de una sesión según el objetivo. Usa el mismo
    /// cálculo que `HomeMetrics.calories` (MET × peso × horas), así la meta es
    /// lo que se quemaría cumpliendo el plan, medido con la misma vara con la
    /// que Inicio mide la semana.
    static func sesionTipica(_ objetivo: TrainingGoal) -> (horas: Double, met: Double) {
        switch objetivo {
        case .hipertrofia: (1.0, HomeMetrics.resistanceMET)
        case .fuerza: (1.25, HomeMetrics.resistanceMET)
        case .hipertrofiaFuerza: (1.1, HomeMetrics.resistanceMET)
        case .perderGrasa: (0.9, 6.0)
        case .salud: (0.75, 4.0)
        }
    }

    /// Meta semanal en kcal, redondeada a 50. Sin peso usa el de por defecto
    /// de `HomeMetrics`, como el resto de la app.
    static func metaSemanal(objetivo: TrainingGoal, dias: Int, pesoKg: Double?) -> Int {
        let peso = (pesoKg ?? 0) > 0 ? pesoKg! : HomeMetrics.defaultBodyWeightKg
        let sesion = sesionTipica(objetivo)
        let kcal = sesion.met * peso * sesion.horas * Double(max(0, dias))
        return Int((kcal / 50).rounded()) * 50
    }

    /// Se muestra una vez por cuenta y por teléfono, solo si al perfil le falta
    /// lo que este recorrido pide (quien ya cargó objetivo o peso en la web no
    /// lo ve).
    static func debeMostrar(perfil: UserProfile?, yaVisto: Bool) -> Bool {
        guard !yaVisto, let perfil else { return false }
        return perfil.trainingGoal == nil && perfil.bodyWeightKg == nil
    }

    /// La clave de UserDefaults que recuerda que esta cuenta ya lo vio.
    static func claveVisto(uid: String) -> String { "sieza.conocerte.v1.\(uid)" }

    /// Lo que se guarda en `users/{uid}` (merge, igual que la web).
    static func campos(objetivo: TrainingGoal?, dias: Int?, nivel: ExperienceLevel?, pesoKg: Double?) -> [String: Any] {
        var campos: [String: Any] = [:]
        if let objetivo { campos["trainingGoal"] = objetivo.rawValue }
        if let dias { campos["trainingDaysPerWeek"] = dias }
        if let nivel { campos["experienceLevel"] = nivel.rawValue }
        if let pesoKg { campos["bodyWeightKg"] = pesoKg }
        if let objetivo, let dias {
            campos["weeklyCalorieGoalKcal"] = Double(metaSemanal(objetivo: objetivo, dias: dias, pesoKg: pesoKg))
        }
        return campos
    }

    /// Estado de los tres pasos.
    struct Recorrido {
        private(set) var paso = 1
        var objetivo: TrainingGoal?
        var dias: Int?
        var nivel: ExperienceLevel?
        var peso = ""

        var pesoKg: Double? {
            BodyMetrics.decimal(peso).flatMap { (20...400).contains($0) ? $0 : nil }
        }
        var esUltimo: Bool { paso == Conocerte.pasos }

        /// Cada paso pide lo suyo para seguir; el peso es opcional.
        var puedeSeguir: Bool {
            switch paso {
            case 1: objetivo != nil
            case 2: dias != nil
            default: peso.isEmpty || pesoKg != nil
            }
        }

        var meta: Int? {
            guard let objetivo, let dias else { return nil }
            return Conocerte.metaSemanal(objetivo: objetivo, dias: dias, pesoKg: pesoKg)
        }

        /// Devuelve true cuando se sigue desde el último paso: hay que guardar.
        mutating func seguir() -> Bool {
            guard puedeSeguir else { return false }
            if esUltimo { return true }
            paso += 1
            return false
        }

        mutating func volver() { paso = max(1, paso - 1) }
    }
}
