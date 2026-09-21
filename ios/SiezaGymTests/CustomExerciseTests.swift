import Foundation
import Testing
@testable import SiezaGym

// MARK: - Links de YouTube

@Suite("Links de YouTube")
struct YouTubeLinkTests {
    // `nonisolated`: el macro de @Test lee los argumentos fuera del main actor.
    private nonisolated static let formas = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtube.com/watch?v=dQw4w9WgXcQ",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/live/dQw4w9WgXcQ",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        // Sin esquema, que es como queda al copiar de algunos lados.
        "youtu.be/dQw4w9WgXcQ",
        "www.youtube.com/watch?v=dQw4w9WgXcQ",
        // Pegar solo el id también vale.
        "dQw4w9WgXcQ",
    ]

    @Test("saca el id de todas las formas en que YouTube comparte un video",
          arguments: formas)
    func todasLasFormas(link: String) {
        #expect(YouTubeLink.id(de: link) == "dQw4w9WgXcQ")
    }

    /// Los links de compartir vienen con seguimiento y con el minuto; nada de
    /// eso tiene que confundir al parser.
    @Test("ignora los parámetros de más", arguments: [
        "https://youtu.be/dQw4w9WgXcQ?si=aBcDeFgH",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
        "https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ&index=3",
        "  https://youtu.be/dQw4w9WgXcQ  ",
    ])
    func conBasura(link: String) {
        #expect(YouTubeLink.id(de: link) == "dQw4w9WgXcQ")
    }

    @Test("lo que no es de YouTube no devuelve id", arguments: [
        "",
        "   ",
        "https://vimeo.com/123456",
        "https://www.instagram.com/reel/abc123/",
        "https://youtube.com/watch?v=corto",
        "https://youtube.com/",
        "https://youtube.com/feed/subscriptions",
        "no es un link",
        // Un dominio que solo termina parecido no cuenta.
        "https://notyoutube.com/watch?v=dQw4w9WgXcQ",
    ])
    func noEsYouTube(texto: String) {
        #expect(YouTubeLink.id(de: texto) == nil)
    }

    @Test("guarda la URL limpia, sin el seguimiento del link original")
    func urlCanonica() {
        let id = YouTubeLink.id(de: "https://youtu.be/dQw4w9WgXcQ?si=xyz")!
        #expect(YouTubeLink.url(paraID: id)?.absoluteString == "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    }

    @Test("la miniatura sale del id, no hace falta guardarla")
    func miniatura() {
        #expect(YouTubeLink.miniatura(paraID: "dQw4w9WgXcQ")?.absoluteString
                == "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg")
    }
}

// MARK: - Ejercicio propio

@Suite("Ejercicio propio")
struct CustomExerciseDraftTests {
    private func draft(_ shares: [MuscleGroup: Int], nombre: String = "Press raro") -> CustomExerciseDraft {
        var item = CustomExerciseDraft()
        item.nameEs = nombre
        item.shares = shares
        return item
    }

    @Test("un solo músculo se lleva todo")
    func unoSolo() {
        #expect(draft([.pecho: 1]).muscleWeights == [.pecho: 1.0])
    }

    @Test("partes iguales reparten en partes iguales")
    func mitades() {
        #expect(draft([.pecho: 1, .triceps: 1]).muscleWeights == [.pecho: 0.5, .triceps: 0.5])
    }

    @Test("las partes son relativas: 3 y 1 es 75 y 25")
    func proporcional() {
        let pesos = draft([.pecho: 3, .triceps: 1]).muscleWeights
        #expect(pesos[.pecho] == 0.75)
        #expect(pesos[.triceps] == 0.25)
    }

    /// Tres músculos iguales dan 0.33 cada uno, que suma 0.99. La web rechaza
    /// el documento si no suma 1.0, así que la sobra se la come el mayor.
    @Test("siempre suma 1.0 exacto, aunque el reparto no sea redondo",
          arguments: [
            [MuscleGroup.pecho: 1, .triceps: 1, .deltoideAnterior: 1],
            [MuscleGroup.dorsal: 1, .biceps: 1, .antebrazo: 1, .espaldaAltaTrapecio: 1, .lumbar: 1, .abdomen: 1, .gemelo: 1],
            [MuscleGroup.cuadriceps: 2, .gluteo: 1, .isquiotibiales: 1, .gemelo: 1, .aductores: 1, .lumbar: 1],
          ])
    func sumaExacta(shares: [MuscleGroup: Int]) {
        let suma = draft(shares).muscleWeights.values.reduce(0, +)
        #expect(suma == 1.0)
    }

    @Test("los músculos en cero no entran en el reparto")
    func ceroNoCuenta() {
        let item = draft([.pecho: 2, .triceps: 0])
        #expect(item.musculos == [.pecho])
        #expect(item.muscleWeights == [.pecho: 1.0])
    }

    @Test("sin músculos no hay pesos y no se puede guardar")
    func sinMusculos() {
        let item = draft([:])
        #expect(item.muscleWeights.isEmpty)
        #expect(throws: CustomExerciseError.sinMusculos) { try item.validar() }
    }

    @Test("sin nombre no se puede guardar", arguments: ["", "   "])
    func sinNombre(nombre: String) {
        #expect(throws: CustomExerciseError.sinNombre) {
            try draft([.pecho: 1], nombre: nombre).validar()
        }
    }

    @Test("un link que no es de YouTube frena el guardado")
    func linkRoto() {
        var item = draft([.pecho: 1])
        item.videoURL = "https://vimeo.com/123"

        #expect(item.linkInvalido)
        #expect(throws: CustomExerciseError.linkInvalido) { try item.validar() }
    }

    @Test("sin link se guarda igual: el video es opcional")
    func sinLink() throws {
        var item = draft([.pecho: 1])
        item.videoURL = "  "

        #expect(item.linkInvalido == false)
        try item.validar()
        #expect(item.firestoreValue(ownerID: "u1")["videoUrl"] == nil)
    }

    // MARK: Documento

    /// Las reglas de Firestore exigen estas claves; sin alguna, el write se
    /// rechaza con "Missing or insufficient permissions" y no se entiende por qué.
    @Test("escribe las claves que exigen las reglas")
    func clavesObligatorias() {
        let valor = draft([.pecho: 1]).firestoreValue(ownerID: "u1")

        #expect(valor["ownerId"] as? String == "u1")
        #expect(valor["nameEs"] as? String == "Press raro")
        #expect(valor["equipment"] as? String != nil)
        #expect(valor["pattern"] as? String != nil)
        #expect(valor["registrationType"] as? String != nil)
        #expect((valor["muscleWeights"] as? [String: Double])?.isEmpty == false)
    }

    @Test("los músculos se guardan con las claves que usa Firestore")
    func clavesDeMusculos() {
        let valor = draft([.espaldaAltaTrapecio: 1]).firestoreValue(ownerID: "u1")
        let pesos = valor["muscleWeights"] as? [String: Double]

        #expect(pesos?["espaldaAltaTrapecio"] == 1.0)
    }

    @Test("el nombre se guarda sin espacios de más")
    func nombreLimpio() {
        let valor = draft([.pecho: 1], nombre: "  Press raro  ").firestoreValue(ownerID: "u1")

        #expect(valor["nameEs"] as? String == "Press raro")
        #expect(valor["nameEn"] as? String == "Press raro")
    }

    /// Igual que `normalizeSearchText` en la web, para que su buscador también
    /// lo encuentre.
    @Test("guarda el texto de búsqueda sin tildes ni mayúsculas")
    func textoDeBusqueda() {
        let valor = draft([.pecho: 1], nombre: "Elevación Lateral").firestoreValue(ownerID: "u1")

        #expect(valor["searchTextEs"] as? String == "elevacion lateral")
    }

    @Test("el link se guarda limpio, no como lo pegaste")
    func videoLimpio() {
        var item = draft([.pecho: 1])
        item.videoURL = "https://youtu.be/dQw4w9WgXcQ?si=xyz"

        #expect(item.firestoreValue(ownerID: "u1")["videoUrl"] as? String
                == "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    }

    /// El repositorio arma el `Exercise` con el mismo diccionario que le manda
    /// a Firestore, para no releer. Si una clave se escribiera distinta de como
    /// se lee, el ejercicio recién creado saldría vacío en el selector.
    @Test("el documento se vuelve a leer como el ejercicio que se cargó")
    func idaYVuelta() {
        var item = draft([.dorsal: 2, .biceps: 1], nombre: "Jalón raro")
        item.videoURL = "https://youtu.be/dQw4w9WgXcQ"
        item.registrationType = .reps
        item.equipment = .polea
        item.unilateral = true

        let ejercicio = Exercise(
            id: "x1",
            data: item.firestoreValue(ownerID: "u1"),
            source: .custom
        )

        #expect(ejercicio.nameEs == "Jalón raro")
        #expect(ejercicio.equipment == .polea)
        #expect(ejercicio.registrationType == .reps)
        #expect(ejercicio.unilateral)
        #expect(ejercicio.source == .custom)
        #expect(ejercicio.primaryMuscle == .dorsal)
        #expect(ejercicio.muscleWeights[.biceps] == 0.33)
        #expect(ejercicio.thumbnailURL?.absoluteString.contains("dQw4w9WgXcQ") == true)
    }
}

// MARK: - Miniatura del ejercicio

@Suite("Miniatura del ejercicio")
struct ExerciseThumbnailTests {
    private func exercise(media: String?, video: String?) -> Exercise {
        Exercise(
            id: "e1",
            data: [
                "nameEs": "Press",
                "mediaUrl": media as Any,
                "videoUrl": video as Any,
            ].compactMapValues { $0 is NSNull ? nil : $0 },
            source: video == nil ? .catalog : .custom
        )
    }

    @Test("el del catálogo usa su gif")
    func delCatalogo() {
        let gif = "https://raw.githubusercontent.com/x/y/0025.gif"
        #expect(exercise(media: gif, video: nil).thumbnailURL?.absoluteString == gif)
    }

    @Test("el propio usa la portada del video de YouTube")
    func conVideo() {
        let item = exercise(media: nil, video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ")

        #expect(item.videoURL != nil)
        #expect(item.thumbnailURL?.absoluteString == "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg")
    }

    @Test("el gif gana: un ejercicio con los dos muestra su animación")
    func gifGana() {
        let gif = "https://raw.githubusercontent.com/x/y/0025.gif"
        let item = exercise(media: gif, video: "https://youtu.be/dQw4w9WgXcQ")

        #expect(item.thumbnailURL?.absoluteString == gif)
    }

    @Test("sin nada no hay miniatura y la vista dibuja la pesa")
    func sinNada() {
        #expect(exercise(media: nil, video: nil).thumbnailURL == nil)
    }
}
