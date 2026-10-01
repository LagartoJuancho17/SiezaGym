import Foundation
import Testing
@testable import SiezaGym

// MARK: - El formulario

@Suite("Formulario de login")
struct AuthFormTests {
    private func entrar(email: String = "tobias@example.com", password: String = "123456") -> AuthForm {
        AuthForm(modo: .entrar, email: email, password: password)
    }

    private func crear(
        email: String = "tobias@example.com",
        password: String = "123456",
        repetir: String = "123456"
    ) -> AuthForm {
        AuthForm(modo: .crear, email: email, password: password, repetir: repetir)
    }

    @Test("vacío no se puede enviar")
    func vacio() {
        #expect(AuthForm().puedeEnviar == false)
    }

    @Test("para entrar alcanza email y contraseña")
    func entrarCompleto() {
        #expect(entrar().puedeEnviar)
    }

    @Test("emails sin forma de email no pasan", arguments: [
        "", "tobias", "tobias@", "@example.com", "tobias example.com", "tobias @example.com",
    ])
    func emailsMalos(email: String) {
        #expect(entrar(email: email).puedeEnviar == false)
    }

    @Test("emails con forma de email pasan", arguments: [
        "a@b", "tobias@example.com", "TOBIAS@EXAMPLE.COM", "  tobias@example.com  ",
    ])
    func emailsBuenos(email: String) {
        #expect(entrar(email: email).puedeEnviar)
    }

    /// Seis es el mínimo de Firebase. Con cinco el servidor rechaza, así que el
    /// botón no tiene por qué dejar mandarlo.
    @Test("la contraseña necesita seis caracteres", arguments: [
        ("", false), ("12345", false), ("123456", true), ("1234567", true),
    ])
    func largoPassword(password: String, esperado: Bool) {
        #expect(entrar(password: password).puedeEnviar == esperado)
        #expect(AuthForm.largoMinimoPassword == 6)
    }

    // MARK: Crear cuenta

    @Test("crear cuenta necesita las dos contraseñas iguales")
    func repetirIgual() {
        #expect(crear().puedeEnviar)
        #expect(crear(repetir: "123457").puedeEnviar == false)
        #expect(crear(repetir: "").puedeEnviar == false)
    }

    @Test("dos contraseñas distintas lo dicen")
    func avisaDistintas() {
        #expect(crear(repetir: "123457").problema == "Las dos contraseñas no coinciden.")
    }

    /// El aviso aparece cuando ya escribió algo en el segundo campo. Si saltara
    /// con la primera letra, diría "no coinciden" mientras todavía escribe.
    @Test("con el segundo campo vacío todavía no avisa")
    func noAvisaVacio() {
        #expect(crear(repetir: "").problema == nil)
    }

    @Test("entrando no pide repetir nada")
    func entrarNoPideRepetir() {
        var form = entrar()
        form.repetir = "cualquier cosa"

        #expect(form.puedeEnviar)
        #expect(form.problema == nil)
    }

    // MARK: Cambiar de pestaña

    /// Cambiar de pestaña borra las contraseñas pero deja el email: es el mismo
    /// de todos modos, y volver a escribirlo es la parte molesta.
    @Test("cambiar de pestaña limpia las contraseñas y deja el email")
    func cambiarLimpia() {
        var form = crear(email: "tobias@example.com", password: "123456", repetir: "123456")
        form.cambiarA(.entrar)

        #expect(form.modo == .entrar)
        #expect(form.email == "tobias@example.com")
        #expect(form.password.isEmpty)
        #expect(form.repetir.isEmpty)
    }

    @Test("cambiar a la pestaña en la que ya estás no borra lo escrito")
    func cambiarALaMisma() {
        var form = entrar(password: "123456")
        form.cambiarA(.entrar)

        #expect(form.password == "123456")
    }

    // MARK: Lo que sale al servidor

    @Test("el email se manda sin espacios y en minúsculas")
    func emailNormalizado() {
        #expect(entrar(email: "  Tobias@Example.COM ").emailNormalizado == "tobias@example.com")
    }

    @Test("el nombre se manda sin espacios de sobra")
    func nombreLimpio() {
        var form = crear()
        form.nombre = "  Tobías  "

        #expect(form.nombreLimpio == "Tobías")
    }

    /// Los nombres de modo son un contrato con `/api/mfa/start`, que sólo
    /// entiende estos dos. Si cambian acá y no allá, el alta se convierte en
    /// login y el login falla.
    @Test("el modo viaja con el nombre que espera el servidor")
    func parametroDelModo() {
        #expect(AuthMode.entrar.parametro == "signin")
        #expect(AuthMode.crear.parametro == "signup")
    }

    @Test("las pestañas se llaman igual que en la web")
    func etiquetas() {
        #expect(AuthMode.entrar.pestana == "Iniciar sesión")
        #expect(AuthMode.crear.pestana == "Crear cuenta")
        #expect(AuthMode.entrar.titulo == "Bienvenido de nuevo")
        #expect(AuthMode.crear.titulo == "Creá tu cuenta")
        #expect(AuthMode.entrar.conGoogle == "Continuar con Google")
        #expect(AuthMode.crear.conGoogle == "Registrarme con Google")
    }
}

// MARK: - El código del mail

@Suite("Código del segundo factor")
struct CodigoMFATests {
    @Test("arranca vacío e incompleto")
    func vacio() {
        let codigo = CodigoMFA()

        #expect(codigo.digitos.isEmpty)
        #expect(codigo.completo == false)
        #expect(codigo.faltan == 6)
    }

    @Test("seis dígitos lo completan")
    func completo() {
        let codigo = CodigoMFA("123456")

        #expect(codigo.digitos == "123456")
        #expect(codigo.completo)
        #expect(codigo.faltan == 0)
    }

    /// El usuario copia del mail y se lleva el texto de alrededor. Eso tiene que
    /// funcionar: son las mismas reglas que `limpiarCodigo` del servidor.
    @Test("se queda con los dígitos y tira el resto", arguments: [
        ("123456", "123456"),
        (" 123 456 ", "123456"),
        ("123-456", "123456"),
        ("Tu código es 123456.", "123456"),
        ("123456 es tu código de SiezaGym", "123456"),
        ("abcdef", ""),
        ("", ""),
    ])
    func limpia(entrada: String, esperado: String) {
        #expect(CodigoMFA(entrada).digitos == esperado)
    }

    /// Pegar de más no rompe: se queda con los primeros seis. Sin el corte, el
    /// campo aceptaría veinte números y el séptimo no se vería en ningún lado.
    @Test("corta en seis")
    func corta() {
        #expect(CodigoMFA("1234567890").digitos == "123456")
    }

    @Test("un dígito que no sea 0-9 no cuenta")
    func soloAscii() {
        // El servidor saca con \D todo lo que no sea 0-9, así que un dígito
        // índico pasaría acá y se perdería allá.
        #expect(CodigoMFA("١٢٣٤٥٦").digitos.isEmpty)
    }

    @Test("escribir reemplaza lo que había")
    func escribir() {
        var codigo = CodigoMFA("123")
        codigo.escribir("98")

        #expect(codigo.digitos == "98")
        #expect(codigo.faltan == 4)
    }

    @Test("borrar hasta vaciarlo lo deja incompleto")
    func borrar() {
        var codigo = CodigoMFA("123456")
        codigo.escribir("12345")

        #expect(codigo.completo == false)
    }

    @Test("el largo es el mismo que espera el servidor")
    func largo() {
        #expect(CodigoMFA.largo == 6)
    }
}

// MARK: - Errores del servidor

@Suite("Errores del segundo factor")
struct MFAErrorTests {
    private func decodificar(_ json: String) throws -> MFAError {
        try JSONDecoder().decode(MFAError.self, from: Data(json.utf8))
    }

    @Test("el mensaje del servidor es el que se muestra")
    func mensaje() throws {
        let error = try decodificar(#"{"motivo":"incorrecto","mensaje":"Código incorrecto. Te quedan 4 intentos.","restantes":4}"#)

        #expect(error.errorDescription == "Código incorrecto. Te quedan 4 intentos.")
        #expect(error.restantes == 4)
        #expect(AuthService.readableMessage(for: error) == "Código incorrecto. Te quedan 4 intentos.")
    }

    @Test("una respuesta sin intentos restantes se lee igual")
    func sinRestantes() throws {
        let error = try decodificar(#"{"motivo":"vencido","mensaje":"El código venció. Pedí uno nuevo."}"#)

        #expect(error.restantes == nil)
        #expect(error.mensaje == "El código venció. Pedí uno nuevo.")
    }

    /// Estos tres motivos no se reintentan: el código ya no existe y hay que
    /// pedir otro. El de "incorrecto" sí, que para eso quedan intentos.
    @Test("distingue el código que hay que volver a pedir", arguments: [
        ("vencido", true), ("quemado", true), ("inexistente", true),
        ("incorrecto", false), ("incompleto", false), ("red", false),
    ])
    func hayQuePedirOtro(motivo: String, esperado: Bool) {
        #expect(MFAError(motivo: motivo, mensaje: "").hayQuePedirOtro == esperado)
    }
}

// MARK: - El reloj del código

@Suite("Cuenta regresiva del código")
struct CuentaRegresivaTests {
    private let ahora = Date(timeIntervalSince1970: 1_700_000_000)

    @Test("un vencimiento futuro da el rango de acá hasta él")
    func futuro() {
        let vence = ahora.addingTimeInterval(600)
        let rango = CuentaRegresiva.rango(hasta: vence, desde: ahora)

        #expect(rango.lowerBound == ahora)
        #expect(rango.upperBound == vence)
    }

    /// El crash real: `Text(timerInterval:)` con el límite de abajo más grande
    /// que el de arriba mata la app. Pasaba al abrir la pantalla, porque el
    /// estado se inicializa antes de que `onAppear` calcule el vencimiento.
    @Test("un vencimiento en el pasado no invierte el rango", arguments: [-1.0, -0.001, -600.0])
    func pasado(segundos: TimeInterval) {
        let rango = CuentaRegresiva.rango(hasta: ahora.addingTimeInterval(segundos), desde: ahora)

        #expect(rango.lowerBound <= rango.upperBound)
        #expect(rango.upperBound == ahora)
    }

    @Test("vencimiento justo ahora: el rango existe y dura cero")
    func justoAhora() {
        let rango = CuentaRegresiva.rango(hasta: ahora, desde: ahora)

        #expect(rango.lowerBound == rango.upperBound)
    }

    /// Sin pasarle la hora, los dos extremos salen de la misma lectura: tomarla
    /// dos veces deja microsegundos de diferencia y el rango se invierte igual.
    @Test("con la hora del sistema tampoco se invierte")
    func horaDelSistema() {
        for _ in 0..<200 {
            let rango = CuentaRegresiva.rango(hasta: .now)
            #expect(rango.lowerBound <= rango.upperBound)
        }
    }
}
