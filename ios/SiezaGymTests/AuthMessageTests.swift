import FirebaseAuth
import Foundation
import Testing
@testable import SiezaGym

@Suite("Mensajes de error de login")
struct AuthMessageTests {
    private func firebaseError(_ code: AuthErrorCode) -> NSError {
        NSError(domain: AuthErrorDomain, code: code.rawValue)
    }

    @Test("traduce los códigos de Firebase al castellano", arguments: [
        (AuthErrorCode.invalidEmail, "Ese email no es válido."),
        (AuthErrorCode.emailAlreadyInUse, "Ya hay una cuenta con ese email."),
        (AuthErrorCode.weakPassword, "La contraseña necesita al menos 6 caracteres."),
        (AuthErrorCode.wrongPassword, "Email o contraseña incorrectos."),
        (AuthErrorCode.invalidCredential, "Email o contraseña incorrectos."),
        (AuthErrorCode.userNotFound, "No encontramos una cuenta con ese email."),
        (AuthErrorCode.networkError, "Sin conexión. Revisá internet."),
        (AuthErrorCode.tooManyRequests, "Demasiados intentos. Esperá un momento."),
    ])
    func firebaseCodes(code: AuthErrorCode, expected: String) {
        #expect(AuthService.readableMessage(for: firebaseError(code)) == expected)
    }

    @Test("avisa cuando la cuenta ya existe creada de otra forma")
    func accountExistsWithDifferentCredential() {
        let message = AuthService.readableMessage(for: firebaseError(.accountExistsWithDifferentCredential))
        #expect(message == "Ya tenés una cuenta con ese email creada de otra forma.")
    }

    @Test("un error de otro dominio con el mismo número no se traduce como si fuera de Firebase")
    func foreignDomainIsNotMistranslated() {
        // Sin comprobar el dominio, cualquier NSError con el código 17009 -- por
        // ejemplo uno de red del sistema -- salía como "contraseña incorrecta".
        let foreign = NSError(domain: NSURLErrorDomain, code: AuthErrorCode.wrongPassword.rawValue)
        #expect(AuthService.readableMessage(for: foreign) == "Algo salió mal. Probá de nuevo.")
    }

    @Test("los errores propios del login con Google ya vienen en castellano", arguments: [
        (AuthService.SignInError.missingClientID, "Falta el CLIENT_ID en GoogleService-Info.plist."),
        (AuthService.SignInError.noPresenter, "No se pudo abrir la ventana de Google."),
        (AuthService.SignInError.missingIDToken, "Google no devolvió el token de la cuenta."),
    ])
    func signInErrors(error: AuthService.SignInError, expected: String) {
        #expect(AuthService.readableMessage(for: error) == expected)
    }

    @Test("un código de Firebase desconocido cae en el mensaje genérico")
    func unknownCode() {
        let unknown = NSError(domain: AuthErrorDomain, code: 999_999)
        #expect(AuthService.readableMessage(for: unknown) == "Algo salió mal. Probá de nuevo.")
    }
}
