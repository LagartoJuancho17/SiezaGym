import Foundation
import os

private nonisolated let log = Logger(subsystem: "com.siezagym.app", category: "mfa")

/// El segundo factor por mail, contra los endpoints de la web.
///
/// El orden importa y es lo que hace que esto sea un segundo factor de verdad y
/// no un cartel:
///
/// 1. `iniciar` manda email y contraseña. El servidor las comprueba y manda el
///    código. **No devuelve ningún token**: con la contraseña sola, la app se
///    queda sin nada con qué entrar.
/// 2. `verificar` manda el código. Recién ahí el servidor emite un custom token,
///    que es lo que `AuthService` cambia por una sesión de Firebase.
///
/// Por eso no hay forma de "saltear la pantalla del código" tocando el cliente:
/// el permiso lo da el servidor, y sólo con el código en la mano.
nonisolated struct MFAService: Sendable {
    /// La web, que es donde viven los endpoints. El Admin SDK de Firebase sólo
    /// corre ahí: una app de iPhone no puede tener la clave privada del
    /// proyecto, así que la parte que decide vive en el servidor.
    static let produccion = URL(string: "https://sieza-gym.vercel.app")!

    /// Para apuntar a `npm run dev` desde el simulador sin recompilar:
    ///
    ///     xcrun simctl spawn booted defaults write com.siezagym.app mfa-base -string http://localhost:3000
    static let claveBase = "mfa-base"

    var base: URL = {
        if let propia = UserDefaults.standard.string(forKey: MFAService.claveBase),
           let url = URL(string: propia) {
            return url
        }
        return MFAService.produccion
    }()

    var sesion: URLSession = .shared

    // MARK: - Paso 1: pedir el código

    struct Desafio: Equatable, Sendable {
        let id: String
        let venceEnSegundos: Int
        /// `true` cuando el servidor no tiene correo configurado y dejó el
        /// código en su propio log. Sólo pasa en desarrollo.
        let porConsola: Bool
    }

    func iniciar(_ form: AuthForm) async throws -> Desafio {
        let respuesta: RespuestaInicio = try await pedir(
            "/api/mfa/start",
            cuerpo: [
                "email": form.emailNormalizado,
                "password": form.password,
                "modo": form.modo.parametro,
                "displayName": form.nombreLimpio,
            ]
        )

        return Desafio(
            id: respuesta.desafio,
            venceEnSegundos: respuesta.venceEnSegundos,
            porConsola: respuesta.transporte == "consola"
        )
    }

    // MARK: - Paso 2: canjear el código por el permiso de entrar

    func verificar(desafio: String, codigo: CodigoMFA) async throws -> String {
        let respuesta: RespuestaVerificacion = try await pedir(
            "/api/mfa/verify",
            cuerpo: ["desafio": desafio, "codigo": codigo.digitos]
        )
        return respuesta.token
    }

    // MARK: - HTTP

    private func pedir<T: Decodable>(_ ruta: String, cuerpo: [String: String]) async throws -> T {
        var pedido = URLRequest(url: base.appending(path: ruta))
        pedido.httpMethod = "POST"
        pedido.setValue("application/json", forHTTPHeaderField: "Content-Type")
        pedido.httpBody = try JSONEncoder().encode(cuerpo)
        // Sin esto el pedido cuelga treinta segundos cuando no hay señal, y el
        // usuario se queda mirando la ruedita sin saber qué pasó.
        pedido.timeoutInterval = 20

        let datos: Data
        let respuesta: URLResponse
        do {
            (datos, respuesta) = try await sesion.data(for: pedido)
        } catch {
            log.error("mfa sin red: \(error.localizedDescription, privacy: .public)")
            throw MFAError(motivo: "red", mensaje: "Sin conexión. Revisá internet.")
        }

        let codigoHTTP = (respuesta as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(codigoHTTP) else {
            // El servidor ya manda el motivo y el mensaje en castellano; si por
            // algo no se puede leer, queda uno genérico en vez de un JSON crudo.
            let fallo = try? JSONDecoder().decode(MFAError.self, from: datos)
            log.error("mfa \(codigoHTTP, privacy: .public): \(fallo?.motivo ?? "sin motivo", privacy: .public)")
            throw fallo ?? MFAError(motivo: "servidor", mensaje: "El servidor no respondió bien. Probá de nuevo.")
        }

        do {
            return try JSONDecoder().decode(T.self, from: datos)
        } catch {
            log.error("mfa respuesta ilegible: \(error.localizedDescription, privacy: .public)")
            throw MFAError(motivo: "formato", mensaje: "El servidor contestó algo que no entendimos.")
        }
    }

    private struct RespuestaInicio: Decodable {
        let desafio: String
        let venceEnSegundos: Int
        let transporte: String?
    }

    private struct RespuestaVerificacion: Decodable {
        let token: String
    }
}

/// Un error del segundo factor, con el texto que ya viene listo del servidor.
///
/// Se decodifica del cuerpo de la respuesta: `{"motivo": "...", "mensaje": "..."}`.
nonisolated struct MFAError: LocalizedError, Decodable, Equatable, Sendable {
    let motivo: String
    let mensaje: String
    /// Cuántos intentos quedan, cuando el motivo es un código incorrecto.
    var restantes: Int?

    var errorDescription: String? { mensaje }

    /// El código venció o se quemó: no sirve reintentar, hay que pedir otro.
    var hayQuePedirOtro: Bool {
        ["vencido", "quemado", "inexistente"].contains(motivo)
    }
}
