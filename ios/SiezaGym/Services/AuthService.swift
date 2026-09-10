import FirebaseAuth
import FirebaseCore
import Foundation
import Observation
import os

private nonisolated let log = Logger(subsystem: "com.siezagym.app", category: "auth")

/// Sesion del usuario. Envuelve FirebaseAuth y expone solo lo que la UI necesita.
@Observable
final class AuthService {
    enum State: Equatable {
        /// Todavia no sabemos si hay sesion guardada: no hay que mostrar el login.
        case loading
        case signedOut
        case signedIn(uid: String, email: String?)
    }

    private(set) var state: State = .loading
    private(set) var errorMessage: String?
    private(set) var isWorking = false

    // Se escribe una sola vez en `init` y se lee una sola vez en `deinit`,
    // cuando ya no queda ninguna otra referencia viva. No hay carrera posible,
    // pero `deinit` es nonisolated y no puede tocar estado del main actor.
    private nonisolated(unsafe) var listener: AuthStateDidChangeListenerHandle?

    var uid: String? {
        if case let .signedIn(uid, _) = state { return uid }
        return nil
    }

    init() {
        listener = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            // El listener ya llega en el main thread, pero el SDK no lo declara,
            // asi que se afirma en vez de saltar de hilo y perder el frame.
            MainActor.assumeIsolated {
                guard let self else { return }
                self.state = user.map { .signedIn(uid: $0.uid, email: $0.email) } ?? .signedOut
            }
        }
    }

    deinit {
        if let listener { Auth.auth().removeStateDidChangeListener(listener) }
    }

    func signIn(email: String, password: String) async {
        await run { try await Auth.auth().signIn(withEmail: email, password: password) }
    }

    func signUp(email: String, password: String, displayName: String) async {
        await run {
            let result = try await Auth.auth().createUser(withEmail: email, password: password)
            let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
            if !name.isEmpty {
                let request = result.user.createProfileChangeRequest()
                request.displayName = name
                try await request.commitChanges()
            }
            try await GymRepository().ensureProfile(
                uid: result.user.uid,
                email: result.user.email,
                displayName: name.isEmpty ? nil : name
            )
        }
    }

    func signOut() {
        do {
            try Auth.auth().signOut()
            errorMessage = nil
        } catch {
            log.error("signOut fallo: \(error.localizedDescription, privacy: .public)")
            errorMessage = "No se pudo cerrar la sesión."
        }
    }

    func clearError() { errorMessage = nil }

    private func run(_ operation: () async throws -> Void) async {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await operation()
        } catch {
            log.error("auth fallo: \(error.localizedDescription, privacy: .public)")
            errorMessage = Self.readableMessage(for: error)
        }
    }

    /// Los mensajes de FirebaseAuth vienen en ingles y son tecnicos.
    static func readableMessage(for error: Error) -> String {
        guard let code = AuthErrorCode(rawValue: (error as NSError).code) else {
            return "Algo salió mal. Probá de nuevo."
        }
        return switch code {
        case .invalidEmail: "Ese email no es válido."
        case .emailAlreadyInUse: "Ya hay una cuenta con ese email."
        case .weakPassword: "La contraseña necesita al menos 6 caracteres."
        case .wrongPassword, .invalidCredential: "Email o contraseña incorrectos."
        case .userNotFound: "No encontramos una cuenta con ese email."
        case .networkError: "Sin conexión. Revisá internet."
        case .tooManyRequests: "Demasiados intentos. Esperá un momento."
        default: "Algo salió mal. Probá de nuevo."
        }
    }
}
