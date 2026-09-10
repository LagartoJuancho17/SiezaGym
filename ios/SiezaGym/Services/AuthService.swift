import FirebaseAuth
import FirebaseCore
import Foundation
import GoogleSignIn
import UIKit
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
                displayName: name.isEmpty ? nil : name,
                provider: "password"
            )
        }
    }

    /// Login con Google. Termina en la misma cuenta de Firebase que usa la web:
    /// si entraste con Google en `sieza-gym.vercel.app`, es el mismo uid.
    func signInWithGoogle() async {
        await run {
            guard let clientID = FirebaseApp.app()?.options.clientID else {
                throw SignInError.missingClientID
            }
            guard let presenter = Self.topViewController() else {
                throw SignInError.noPresenter
            }

            GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)

            guard let idToken = result.user.idToken?.tokenString else {
                throw SignInError.missingIDToken
            }
            let credential = GoogleAuthProvider.credential(
                withIDToken: idToken,
                accessToken: result.user.accessToken.tokenString
            )
            let authResult = try await Auth.auth().signIn(with: credential)

            // La web crea el perfil del lado del servidor al iniciar sesion; en
            // iOS no hay servidor, asi que lo hace la app con los mismos campos.
            let user = authResult.user
            try await GymRepository().ensureProfile(
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL?.absoluteString,
                provider: "google.com"
            )
        }
    }

    /// El SDK de Google necesita un UIViewController desde el que presentarse, y
    /// SwiftUI no expone ninguno.
    private static func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        var top = scene?.keyWindow?.rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }

    enum SignInError: LocalizedError {
        case missingClientID
        case noPresenter
        case missingIDToken

        var errorDescription: String? {
            switch self {
            case .missingClientID:
                "Falta el CLIENT_ID en GoogleService-Info.plist."
            case .noPresenter:
                "No se pudo abrir la ventana de Google."
            case .missingIDToken:
                "Google no devolvió el token de la cuenta."
            }
        }
    }

    func signOut() {
        do {
            // Sin esto Google recuerda la cuenta y el proximo login entra solo,
            // sin dejar elegir otra.
            GIDSignIn.sharedInstance.signOut()
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
        } catch let error as NSError
            where error.domain == kGIDSignInErrorDomain
            && error.code == GIDSignInError.canceled.rawValue {
            // El usuario cerro la ventana de Google a proposito.
            return
        } catch {
            log.error("auth fallo: \(error.localizedDescription, privacy: .public)")
            errorMessage = Self.readableMessage(for: error)
        }
    }

    /// Los mensajes de FirebaseAuth vienen en ingles y son tecnicos.
    static func readableMessage(for error: Error) -> String {
        if let signInError = error as? SignInError {
            return signInError.localizedDescription
        }
        guard (error as NSError).domain == AuthErrorDomain,
              let code = AuthErrorCode(rawValue: (error as NSError).code) else {
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
        case .accountExistsWithDifferentCredential:
            "Ya tenés una cuenta con ese email creada de otra forma."
        default: "Algo salió mal. Probá de nuevo."
        }
    }
}
