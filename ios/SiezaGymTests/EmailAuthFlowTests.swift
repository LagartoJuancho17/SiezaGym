import Testing
@testable import SiezaGym

@Suite("Acceso por email")
struct EmailAuthFlowTests {
    @Test("crear cuenta exige repetir exactamente la contraseña")
    func repeatedPassword() {
        var form = EmailAuthForm()
        form.mode = .signUp
        form.email = "persona@example.com"
        form.password = "clave-segura"

        #expect(!form.canSubmit)
        #expect(!form.passwordMismatch)

        form.repeatedPassword = "otra-clave"
        #expect(form.passwordMismatch)
        #expect(!form.canSubmit)

        form.repeatedPassword = "clave-segura"
        #expect(!form.passwordMismatch)
        #expect(form.canSubmit)
    }

    @Test("cambiar pestaña conserva email y borra contraseñas")
    func switchMode() {
        var form = EmailAuthForm()
        form.email = "persona@example.com"
        form.password = "123456"
        form.repeatedPassword = "123456"
        form.changeMode(to: .signUp)

        #expect(form.mode == .signUp)
        #expect(form.email == "persona@example.com")
        #expect(form.password.isEmpty)
        #expect(form.repeatedPassword.isEmpty)
    }

    @Test("iniciar sesión no exige repetir la contraseña")
    func signIn() {
        var form = EmailAuthForm()
        form.email = "persona@example.com"
        form.password = "123456"
        #expect(form.canSubmit)
        form.email = "sin-arroba"
        #expect(!form.canSubmit)
    }
}
