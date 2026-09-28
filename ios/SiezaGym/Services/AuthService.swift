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

    // MARK: - Email y contraseña, con el código del mail

    /// El proveedor del segundo factor. Se puede cambiar en los tests.
    var mfa = MFAService()

    /// Paso 1: comprueba la contraseña contra el servidor y hace que salga el
    /// mail con el código.
    ///
    /// No crea ninguna sesión, y eso es el punto: `Auth.auth()` no se toca acá.
    /// Con la contraseña correcta y sin el código, la app sigue afuera.
    ///
    /// Devuelve `nil` si algo falló; el motivo queda en `errorMessage`.
    func pedirCodigo(_ form: AuthForm) async -> MFAService.Desafio? {
        await run { try await mfa.iniciar(form) }
    }

    /// Paso 2: canjea el código por la sesión.
    ///
    /// El servidor devuelve un custom token y recién con eso Firebase abre la
    /// sesión. El listener de `init` se encarga del resto.
    @discardableResult
    func entrarConCodigo(desafio: String, codigo: CodigoMFA) async -> Bool {
        let entro = await run { () -> Bool in
            let token = try await mfa.verificar(desafio: desafio, codigo: codigo)
            try await Auth.auth().signIn(withCustomToken: token)
            return true
        }
        return entro ?? false
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
            // El widget vive fuera de la app: si no se limpia, sigue mostrando
            // la racha del usuario anterior en la pantalla bloqueada.
            WidgetBridge.limpiar()
            errorMessage = nil
        } catch {
            log.error("signOut fallo: \(error.localizedDescription, privacy: .public)")
            errorMessage = "No se pudo cerrar la sesión."
        }
    }

    func clearError() { errorMessage = nil }

    /// Envuelve una operación de login: prende la ruedita, limpia el error de
    /// antes y traduce lo que falle. Devuelve `nil` si hubo error.
    @discardableResult
    private func run<T>(_ operation: () async throws -> T) async -> T? {
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            return try await operation()
        } catch let error as NSError
            where error.domain == kGIDSignInErrorDomain
            && error.code == GIDSignInError.canceled.rawValue {
            // El usuario cerro la ventana de Google a proposito.
            return nil
        } catch {
            log.error("auth fallo: \(error.localizedDescription, privacy: .public)")
            errorMessage = Self.readableMessage(for: error)
            return nil
        }
    }

    /// Los mensajes de FirebaseAuth vienen en ingles y son tecnicos.
    static func readableMessage(for error: Error) -> String {
        if let signInError = error as? SignInError {
            return signInError.localizedDescription
        }
        // El servidor del segundo factor ya redacta el mensaje: sabe si el
        // codigo vencio, si esta mal o cuantos intentos quedan.
        if let mfaError = error as? MFAError {
            return mfaError.mensaje
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
