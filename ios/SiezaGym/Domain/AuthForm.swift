import Foundation

/// Entrar o crear la cuenta. Las dos cosas viven en la misma pantalla, como en
/// la web: son el mismo formulario más dos campos.
nonisolated enum AuthMode: String, CaseIterable, Sendable {
    case entrar
    case crear

    /// La etiqueta de la pestaña. Las mismas palabras que la web.
    var pestana: String {
        switch self {
        case .entrar: "Iniciar sesión"
        case .crear: "Crear cuenta"
        }
    }

    var titulo: String {
        switch self {
        case .entrar: "Bienvenido de nuevo"
        case .crear: "Creá tu cuenta"
        }
    }

    /// El botón que envía.
    var accion: String {
        switch self {
        case .entrar: "Ingresar"
        case .crear: "Crear mi cuenta"
        }
    }

    var conGoogle: String {
        switch self {
        case .entrar: "Continuar con Google"
        case .crear: "Registrarme con Google"
        }
    }

    /// Lo que va al servidor. Tiene que coincidir con lo que espera
    /// `/api/mfa/start`, que sólo entiende "signin" y "signup".
    var parametro: String {
        switch self {
        case .entrar: "signin"
        case .crear: "signup"
        }
    }
}

/// Lo que hay escrito en el formulario y si alcanza para enviarlo.
///
/// Es un valor puro a propósito: las reglas de "esto está completo" se prueban
/// sin pantalla y sin red, y son las mismas que revisa el servidor.
nonisolated struct AuthForm: Equatable, Sendable {
    /// Seis caracteres, el mínimo de Firebase. Menos que eso lo rechaza el
    /// servidor, así que el botón no tiene por qué dejar intentarlo.
    static let largoMinimoPassword = 6

    var modo: AuthMode = .entrar
    var email = ""
    var password = ""
    var repetir = ""
    var nombre = ""

    /// Qué falta, en castellano y listo para mostrar. `nil` es "está completo".
    ///
    /// Devuelve el motivo y no un booleano porque una contraseña repetida mal
    /// hay que decirla: si sólo se apagara el botón, el usuario no sabe por qué.
    var problema: String? {
        // El aviso aparece cuando ya escribió algo en el segundo campo, no en la
        // primera letra: si no, dice "no coinciden" desde el primer carácter.
        guard modo == .crear, !repetir.isEmpty, password != repetir else { return nil }
        return "Las dos contraseñas no coinciden."
    }

    var puedeEnviar: Bool {
        guard emailValido, password.count >= Self.largoMinimoPassword else { return false }
        guard modo == .crear else { return true }
        return password == repetir
    }

    /// Un email con arroba y algo a cada lado. No valida más que eso: quién
    /// decide de verdad si existe es el mail que llega.
    var emailValido: Bool {
        let limpio = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let arroba = limpio.firstIndex(of: "@") else { return false }
        return arroba > limpio.startIndex
            && limpio.index(after: arroba) < limpio.endIndex
            && !limpio.contains(" ")
    }

    /// El email como se manda: sin espacios y en minúsculas, igual que lo
    /// normaliza el servidor.
    var emailNormalizado: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    var nombreLimpio: String {
        nombre.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Al cambiar de pestaña se limpian las contraseñas, no el email: es el
    /// mismo de todos modos y volver a escribirlo es la parte molesta.
    mutating func cambiarA(_ otro: AuthMode) {
        guard otro != modo else { return }
        modo = otro
        password = ""
        repetir = ""
    }
}

/// El código de seis dígitos que llega por mail.
///
/// Las mismas reglas que `limpiarCodigo` en `lib/mfa/challenge.js`: sólo
/// dígitos, y seis. Se repiten acá para que el teclado y el botón se comporten
/// bien sin ir y volver al servidor, no para reemplazar esa revisión.
nonisolated struct CodigoMFA: Equatable, Sendable {
    static let largo = 6

    private(set) var digitos = ""

    init(_ entrada: String = "") {
        digitos = Self.limpiar(entrada)
    }

    /// Se queda con los dígitos y corta en seis.
    ///
    /// Pegar "Tu código es 123456." tiene que funcionar: el usuario copia del
    /// mail y se lleva el texto de alrededor.
    static func limpiar(_ entrada: String) -> String {
        // ASCII y no `isWholeNumber`: el `\\D` del servidor saca todo lo que no
        // sea 0-9, y un dígito índico pasaría el filtro acá y no allá.
        String(entrada.filter { $0.isASCII && $0.isNumber }.prefix(largo))
    }

    var completo: Bool { digitos.count == Self.largo }

    var faltan: Int { max(0, Self.largo - digitos.count) }

    mutating func escribir(_ entrada: String) {
        digitos = Self.limpiar(entrada)
    }
}

/// El reloj de la cuenta regresiva del código.
nonisolated enum CuentaRegresiva {
    /// El rango que consume `Text(timerInterval:)`.
    ///
    /// Existe por un crash: un `ClosedRange` con el límite de abajo mayor que el
    /// de arriba mata la app con "Range requires lowerBound <= upperBound", y
    /// eso pasa solo en dos momentos. Al abrir la pantalla, porque el estado se
    /// inicializa antes de que `onAppear` calcule el vencimiento. Y a los diez
    /// minutos, cuando el vencimiento pasa a estar en el pasado.
    ///
    /// La hora de "ahora" se toma una sola vez y se usa para los dos extremos:
    /// leerla dos veces deja una diferencia de microsegundos que vuelve a
    /// invertir el rango.
    static func rango(hasta vence: Date, desde ahora: Date = .now) -> ClosedRange<Date> {
        ahora...max(vence, ahora)
    }
}
