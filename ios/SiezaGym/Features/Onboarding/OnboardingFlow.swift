/// El recorrido es local al teléfono: no crea cuenta ni escribe en Firestore.
enum OnboardingPage: Int, CaseIterable, Identifiable {
    case routines
    case workout
    case progress

    var id: Int { rawValue }

    var imageName: String {
        switch self {
        case .routines: "OnboardingRoutines"
        case .workout: "OnboardingWorkout"
        case .progress: "OnboardingProgress"
        }
    }

    var eyebrow: String {
        switch self {
        case .routines: "BIENVENIDO A SIEZAGYM"
        case .workout: "REGISTRÁ CADA ENTRENO"
        case .progress: "MIRÁ TU AVANCE"
        }
    }

    var headline: String {
        switch self {
        case .routines: "Entrená"
        case .workout: "Cada serie"
        case .progress: "Tu progreso"
        }
    }

    var headlineEmphasis: String {
        switch self {
        case .routines: "a tu manera."
        case .workout: "cuenta."
        case .progress: "a la vista."
        }
    }

    var detail: String {
        switch self {
        case .routines: "Armá tus rutinas con ejercicios y series a tu medida."
        case .workout: "Registrá peso y repeticiones mientras entrenás. Todo queda en tu historial."
        case .progress: "Seguí tu volumen y tus marcas. Si conectás Apple Salud, sumá pasos, distancia y calorías."
        }
    }
}

struct OnboardingFlow {
    private(set) var page: OnboardingPage = .routines

    var canGoBack: Bool { page.rawValue > 0 }
    var isLastPage: Bool { page == OnboardingPage.allCases.last }

    mutating func goBack() {
        guard let previous = OnboardingPage(rawValue: page.rawValue - 1) else { return }
        page = previous
    }

    /// Devuelve `true` solo cuando se pulsa continuar en la última pantalla.
    mutating func advance() -> Bool {
        guard let next = OnboardingPage(rawValue: page.rawValue + 1) else { return true }
        page = next
        return false
    }
}
