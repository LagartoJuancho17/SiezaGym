import Foundation

/// Un link de YouTube, en cualquiera de las formas en que YouTube lo comparte.
///
/// Se guarda el id y no la URL pegada porque las de compartir vienen con
/// basura de seguimiento (`?si=`, `&t=`, listas de reproducción) y porque con
/// el id se arma sola la miniatura.
nonisolated enum YouTubeLink {
    /// Los ids de YouTube son once caracteres de este alfabeto.
    private static let permitidos = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-")

    static func esID(_ texto: String) -> Bool {
        texto.count == 11 && texto.allSatisfy(permitidos.contains)
    }

    /// El id del video, o nil si el texto no es un link de YouTube.
    static func id(de texto: String) -> String? {
        let limpio = texto.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !limpio.isEmpty else { return nil }

        // Pegar solo el id también vale: es lo que queda si copiás de la app.
        if esID(limpio) { return limpio }

        // Sin esquema `URLComponents` no encuentra el host.
        let conEsquema = limpio.contains("://") ? limpio : "https://\(limpio)"
        guard let partes = URLComponents(string: conEsquema),
              let host = partes.host?.lowercased() else { return nil }

        let dominio = host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
        let segmentos = partes.path.split(separator: "/").map(String.init)

        switch dominio {
        case "youtu.be":
            return segmentos.first.flatMap { esID($0) ? $0 : nil }

        case "youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com":
            // /watch?v=ID
            if let v = partes.queryItems?.first(where: { $0.name == "v" })?.value, esID(v) {
                return v
            }
            // /shorts/ID, /embed/ID, /live/ID, /v/ID
            if segmentos.count >= 2,
               ["shorts", "embed", "live", "v"].contains(segmentos[0]),
               esID(segmentos[1]) {
                return segmentos[1]
            }
            return nil

        default:
            return nil
        }
    }

    /// La URL limpia que se guarda.
    static func url(paraID id: String) -> URL? {
        URL(string: "https://www.youtube.com/watch?v=\(id)")
    }

    /// La miniatura del video. No hace falta guardarla: sale del id.
    ///
    /// `mqdefault` y no `maxresdefault` porque la máxima no existe para todos
    /// los videos y queda un cuadrado roto.
    static func miniatura(paraID id: String) -> URL? {
        URL(string: "https://img.youtube.com/vi/\(id)/mqdefault.jpg")
    }
}

/// Un ejercicio propio mientras se carga, antes de guardarlo.
///
/// Es para lo que no está en el catálogo: una máquina rara del gimnasio, una
/// variante del entrenador. Vive en `users/{uid}/customExercises`, o sea que
/// solo lo ve su dueño.
nonisolated struct CustomExerciseDraft: Sendable, Equatable {
    var nameEs = ""
    var equipment: Equipment = .barra
    var pattern: MovementPattern = .empujeHorizontal
    var registrationType: RegistrationType = .pesoReps
    var unilateral = false
    var videoURL = ""
    /// Cuánto participa cada músculo, en partes enteras. Dos músculos en 1 y 1
    /// es mitad y mitad; 3 y 1 es 75/25. Se normaliza al guardar.
    var shares: [MuscleGroup: Int] = [:]

    var musculos: [MuscleGroup] {
        MuscleGroup.allCases.filter { (shares[$0] ?? 0) > 0 }
    }

    var videoID: String? { YouTubeLink.id(de: videoURL) }

    /// El link se acepta vacío, pero si tiene algo tiene que ser de YouTube:
    /// guardar un link roto es peor que no guardar ninguno.
    var linkInvalido: Bool {
        !videoURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && videoID == nil
    }

    /// Los pesos que espera el modelo: suman 1.0 exacto.
    ///
    /// Se reparte por partes y no pidiendo porcentajes porque en el gimnasio
    /// nadie quiere pelear para que tres campos sumen 100.
    var muscleWeights: [MuscleGroup: Double] {
        let total = musculos.reduce(0) { $0 + (shares[$1] ?? 0) }
        guard total > 0 else { return [:] }

        var pesos: [MuscleGroup: Double] = [:]
        for musculo in musculos {
            pesos[musculo] = (Double(shares[musculo] ?? 0) / Double(total) * 100).rounded() / 100
        }

        // Redondear a dos decimales deja sobras (tres músculos iguales dan
        // 0.99). El resto se lo come el que más participa, para que la suma dé
        // 1.0 exacto y la web no rechace el documento.
        let suma = pesos.values.reduce(0, +)
        if let mayor = pesos.max(by: { $0.value < $1.value })?.key, suma != 1 {
            pesos[mayor] = ((pesos[mayor]! + (1 - suma)) * 100).rounded() / 100
        }
        return pesos
    }

    func validar() throws {
        guard !nameEs.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CustomExerciseError.sinNombre
        }
        guard !musculos.isEmpty else { throw CustomExerciseError.sinMusculos }
        guard !linkInvalido else { throw CustomExerciseError.linkInvalido }
    }

    /// El documento que espera Firestore.
    ///
    /// Las reglas exigen `ownerId`, `nameEs`, `equipment`, `pattern`,
    /// `muscleWeights` (no vacío) y `registrationType`; sin alguno de esos el
    /// write se rechaza. `searchTextEs` es para que el buscador de la web
    /// también lo encuentre.
    func firestoreValue(ownerID: String) -> [String: Any] {
        let limpio = nameEs.trimmingCharacters(in: .whitespacesAndNewlines)
        var valor: [String: Any] = [
            "ownerId": ownerID,
            "nameEs": limpio,
            "nameEn": limpio,
            "equipment": equipment.rawValue,
            "pattern": pattern.rawValue,
            "muscleWeights": Dictionary(
                uniqueKeysWithValues: muscleWeights.map { ($0.key.rawValue, $0.value) }
            ),
            "registrationType": registrationType.rawValue,
            "unilateral": unilateral,
            "descriptionEs": "",
            "descriptionEn": "",
            "searchTextEs": Self.textoDeBusqueda(limpio),
        ]
        // Campo propio de la app: la web todavía no muestra video, y lo ignora.
        if let videoID, let url = YouTubeLink.url(paraID: videoID) {
            valor["videoUrl"] = url.absoluteString
        }
        return valor
    }

    /// Igual que `normalizeSearchText` en lib/text/normalize.js: sin tildes y
    /// en minúsculas.
    static func textoDeBusqueda(_ texto: String) -> String {
        texto.folding(options: .diacriticInsensitive, locale: .current).lowercased()
    }
}

nonisolated enum CustomExerciseError: LocalizedError, Equatable {
    case sinNombre
    case sinMusculos
    case linkInvalido

    var errorDescription: String? {
        switch self {
        case .sinNombre: "Ponele un nombre al ejercicio."
        case .sinMusculos: "Elegí al menos un músculo."
        case .linkInvalido: "Ese link no es de YouTube."
        }
    }
}
