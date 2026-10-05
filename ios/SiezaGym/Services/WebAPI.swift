import FirebaseAuth
import Foundation
import os

private nonisolated let log = Logger(subsystem: "com.siezagym.app", category: "api")

/// La API de la web que usa la app para lo que no puede hacer con Firestore
/// directo: el panel del entrenador (alumnos, códigos, asignaciones) y los
/// links para compartir rutinas. Esas colecciones las maneja el servidor con
/// el Admin SDK.
///
/// Cada pedido lleva el ID token de Firebase (`Authorization: Bearer`): el
/// servidor lo verifica y saca de ahí quién sos. Apunta a la misma base que el
/// segundo factor (`MFAService.base`), así `defaults write ... mfa-base` sirve
/// para probar todo contra `npm run dev`.
nonisolated struct WebAPI: Sendable {
    var base: URL = MFAService().base
    var sesion: URLSession = .shared
    /// El token del usuario. Se inyecta para poder probar sin Firebase.
    var token: @Sendable () async throws -> String? = {
        try await Auth.auth().currentUser?.getIDToken()
    }

    enum Falla: LocalizedError, Equatable {
        case sinSesion
        case servidor(String)
        case red

        var errorDescription: String? {
            switch self {
            case .sinSesion: "Tu sesión venció. Volvé a entrar."
            case let .servidor(mensaje): mensaje
            case .red: "No hay conexión con el servidor. Probá de nuevo."
            }
        }
    }

    func pedir<R: Decodable>(_ metodo: String, _ ruta: String, cuerpo: [String: Any]? = nil, conSesion: Bool = true) async throws -> R {
        var pedido = URLRequest(url: base.appending(path: ruta))
        pedido.httpMethod = metodo
        pedido.timeoutInterval = 20
        if let cuerpo {
            pedido.setValue("application/json", forHTTPHeaderField: "Content-Type")
            pedido.httpBody = try JSONSerialization.data(withJSONObject: cuerpo)
        }
        if conSesion {
            guard let token = try await token() else { throw Falla.sinSesion }
            pedido.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (datos, respuesta): (Data, URLResponse)
        do {
            (datos, respuesta) = try await sesion.data(for: pedido)
        } catch {
            log.error("\(metodo, privacy: .public) \(ruta, privacy: .public): \(error.localizedDescription, privacy: .public)")
            throw Falla.red
        }
        let estado = (respuesta as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(estado) else {
            if estado == 401 { throw Falla.sinSesion }
            let mensaje = (try? JSONDecoder().decode(ErrorServidor.self, from: datos))?.mensaje
            if let mensaje { throw Falla.servidor(mensaje) }
            // Un 404 sin mensaje nuestro es la web sin esta ruta todavía (la
            // app salió antes que el deploy), no un error de tus datos.
            if estado == 404 { throw Falla.servidor(Self.sinPublicar) }
            throw Falla.servidor("Algo salió mal (\(estado)).")
        }
        return try JSONDecoder.api.decode(R.self, from: datos)
    }

    private struct ErrorServidor: Decodable { let mensaje: String? }

    static let sinPublicar = "Esta función todavía no está publicada en el servidor. Va a andar cuando se actualice la web."
}

nonisolated extension JSONDecoder {
    /// Las fechas llegan en ISO 8601, con o sin milisegundos.
    static let api: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let texto = try decoder.singleValueContainer().decode(String.self)
            let conMs = ISO8601DateFormatter()
            conMs.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let fecha = conMs.date(from: texto) ?? ISO8601DateFormatter().date(from: texto) { return fecha }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Fecha inválida: \(texto)"))
        }
        return decoder
    }()
}

// MARK: - Rutinas compartidas

/// Los links de rutinas: `https://sieza-gym.vercel.app/r/<id>` y
/// `siezagym://r/<id>`. El id son 10 letras y números sin los confusos.
nonisolated enum EnlaceCompartido {
    static func id(de url: URL) -> String? {
        let partes: [String]
        if url.scheme == "siezagym" {
            // siezagym://r/<id>: "r" llega como host.
            partes = [url.host() ?? ""] + url.pathComponents.filter { $0 != "/" }
        } else if url.scheme == "https" || url.scheme == "http" {
            partes = url.pathComponents.filter { $0 != "/" }
        } else {
            return nil
        }
        guard partes.count == 2, partes[0] == "r" else { return nil }
        let id = partes[1]
        let valido = id.count == 10 && id.allSatisfy { "abcdefghijkmnpqrstuvwxyz23456789".contains($0) }
        return valido ? id : nil
    }
}

nonisolated struct RespuestaCompartir: Decodable, Sendable {
    let id: String
    let url: URL
}

nonisolated extension WebAPI {
    /// Pide (o renueva) el link de una rutina.
    func compartir(_ rutina: Routine, catalogo: [String: Exercise]) async throws -> URL {
        var nombres: [String: String] = [:]
        for ejercicio in rutina.exercises {
            if let nombre = catalogo[ejercicio.exerciseID]?.nameEs { nombres[ejercicio.exerciseID] = nombre }
        }
        let cuerpo: [String: Any] = [
            "sourceId": rutina.id,
            "name": rutina.name,
            "note": rutina.note,
            "exercises": rutina.exercises.map { RoutineDraftExercise($0).firestoreValue(order: $0.order) },
            "exerciseNames": nombres,
        ]
        let respuesta: RespuestaCompartir = try await pedir("POST", "/api/rutinas/compartir", cuerpo: cuerpo)
        return respuesta.url
    }

    /// Lo que hay detrás de un link, listo para la hoja de "Agregar a mis rutinas".
    func rutinaCompartida(id: String) async throws -> RutinaParaCopiar {
        var pedido = URLRequest(url: base.appending(path: "/api/rutinas/compartidas/\(id)"))
        pedido.timeoutInterval = 20
        let (datos, respuesta) = try await sesion.data(for: pedido)
        guard (respuesta as? HTTPURLResponse)?.statusCode == 200 else {
            throw Falla.servidor("El link no existe o se borró.")
        }
        return try RutinaCompartidaDTO.leer(datos, id: id)
    }
}

/// La respuesta de `/api/rutinas/compartidas/<id>`, como dato crudo: los
/// ejercicios vienen con la forma de Firestore y se leen con el mismo
/// `RoutineExercise(order:data:)`.
nonisolated enum RutinaCompartidaDTO {
    static func leer(_ datos: Data, id: String) throws -> RutinaParaCopiar {
        guard let raiz = try JSONSerialization.jsonObject(with: datos) as? [String: Any],
              let nombre = raiz["name"] as? String else {
            throw WebAPI.Falla.servidor("El link no tiene una rutina válida.")
        }
        let dueno = raiz["ownerName"] as? String ?? "Alguien"
        return RutinaParaCopiar(
            id: id,
            nombre: nombre,
            nota: raiz["note"] as? String ?? "",
            detalle: "Te la compartió \(dueno)",
            ejercicios: RutinaParaCopiar.ejercicios(de: raiz["exercises"] as? [[String: Any]] ?? []),
            nombres: raiz["exerciseNames"] as? [String: String] ?? [:]
        )
    }
}
