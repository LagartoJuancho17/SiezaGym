import Foundation

enum EmailAuthMode: String {
    case signIn = "signin"
    case signUp = "signup"
}

/// Validación local del formulario. El servidor vuelve a validar todo antes
/// de crear la cuenta o enviar el código.
struct EmailAuthForm {
    var mode: EmailAuthMode = .signIn
    var email = ""
    var password = ""
    var repeatedPassword = ""
    var displayName = ""

    var passwordMismatch: Bool {
        mode == .signUp && !repeatedPassword.isEmpty && password != repeatedPassword
    }

    var canSubmit: Bool {
        email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@")
            && password.count >= 6
            && (mode == .signIn || (!repeatedPassword.isEmpty && password == repeatedPassword))
    }

    mutating func changeMode(to next: EmailAuthMode) {
        guard mode != next else { return }
        mode = next
        password = ""
        repeatedPassword = ""
    }
}

struct PendingEmailChallenge: Equatable {
    let id: String
    let email: String
    let expiresAt: Date
    let deliveredToConsole: Bool
}
