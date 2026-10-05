import Foundation
import Testing
@testable import SiezaGym

/// Un servidor falso: responde lo que el test diga y guarda el último pedido.
nonisolated final class ServidorFalso: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var respuesta: (Int, String) = (200, "{}")
    nonisolated(unsafe) static var ultimo: URLRequest?
    nonisolated(unsafe) static var cuerpo: Data?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.ultimo = request
        Self.cuerpo = request.httpBodyStream.map { stream in
            stream.open(); defer { stream.close() }
            var data = Data(); var buffer = [UInt8](repeating: 0, count: 4096)
            while stream.hasBytesAvailable { let n = stream.read(&buffer, maxLength: 4096); if n <= 0 { break }; data.append(buffer, count: n) }
            return data
        } ?? request.httpBody
        let (estado, texto) = Self.respuesta
        let http = HTTPURLResponse(url: request.url!, statusCode: estado, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: http, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(texto.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

@Suite("API de la web", .serialized)
struct WebAPITests {
    private func api(token: String? = "tok") -> WebAPI {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [ServidorFalso.self]
        return WebAPI(base: URL(string: "https://example.test")!, sesion: URLSession(configuration: config), token: { token })
    }

    @Test("lee los links de rutina en sus dos formas y rechaza lo demás")
    func links() {
        #expect(EnlaceCompartido.id(de: URL(string: "siezagym://r/abcdefghij")!) == "abcdefghij")
        #expect(EnlaceCompartido.id(de: URL(string: "https://sieza-gym.vercel.app/r/k2m3n4p5q6")!) == "k2m3n4p5q6")
        #expect(EnlaceCompartido.id(de: URL(string: "siezagym://r/corto")!) == nil)
        #expect(EnlaceCompartido.id(de: URL(string: "siezagym://x/abcdefghij")!) == nil)
        // Letras confusas (l, o, 0, 1) no forman parte de un id.
        #expect(EnlaceCompartido.id(de: URL(string: "siezagym://r/abcdefghi0")!) == nil)
        // El retorno de Google Sign-In no se confunde con un link de rutina.
        #expect(EnlaceCompartido.id(de: URL(string: "com.googleusercontent.apps.123:/oauth2redirect")!) == nil)
    }

    @Test("manda el token y decodifica el panel con campos vacíos")
    func panel() async throws {
        ServidorFalso.respuesta = (200, """
        {"code":null,"students":[{"studentId":"s1","displayName":"Ana","email":null,"photoURL":null,"linkedAt":"2026-10-01T10:00:00.000Z","plans":2}],
         "summary":{"linkedStudents":1,"assignedPlans":2,"studentsWithActivity":1,"planCoveragePct":100},
         "recentActivity":[{"id":"a1","studentId":"s1","studentName":"Ana","routineName":"Upper","completedAt":"2026-10-03T18:00:00Z","durationSeconds":3300}]}
        """)
        let panel = try await api().panelCoach()
        #expect(ServidorFalso.ultimo?.value(forHTTPHeaderField: "Authorization") == "Bearer tok")
        #expect(ServidorFalso.ultimo?.url?.path() == "/api/coach")
        #expect(panel.code == nil)
        #expect(panel.students.first?.plans == 2)
        #expect(panel.recentActivity.first?.durationSeconds == 3300)
    }

    @Test("sin sesión no sale ningún pedido")
    func sinSesion() async {
        ServidorFalso.ultimo = nil
        await #expect(throws: WebAPI.Falla.sinSesion) { try await api(token: nil).panelCoach() }
        #expect(ServidorFalso.ultimo == nil)
    }

    @Test("muestra el mensaje del servidor; 401 es sesión vencida")
    func errores() async {
        ServidorFalso.respuesta = (403, #"{"error":"no-es-coach","mensaje":"Tu cuenta no tiene el panel de entrenador."}"#)
        await #expect(throws: WebAPI.Falla.servidor("Tu cuenta no tiene el panel de entrenador.")) { try await api().panelCoach() }
        ServidorFalso.respuesta = (401, "{}")
        await #expect(throws: WebAPI.Falla.sinSesion) { try await api().panelCoach() }
    }

    @Test("compartir manda la rutina con forma de Firestore y nombres; devuelve el link")
    func compartir() async throws {
        ServidorFalso.respuesta = (200, #"{"id":"abcdefghij","url":"https://sieza-gym.vercel.app/r/abcdefghij"}"#)
        let rutina = Routine(id: "r1", data: [
            "name": "Upper", "note": "Torso",
            "exercises": [["exerciseId": "press-de-banca-con-barra", "targetSets": 4, "targetReps": 6, "group": "Fuerza", "groupColor": "amber"]],
        ])
        let catalogo = ["press-de-banca-con-barra": Exercise(id: "press-de-banca-con-barra", data: ["nameEs": "Press de banca con barra"])]
        let url = try await api().compartir(rutina, catalogo: catalogo)
        #expect(url.absoluteString == "https://sieza-gym.vercel.app/r/abcdefghij")
        let cuerpo = try #require(ServidorFalso.cuerpo.flatMap { try JSONSerialization.jsonObject(with: $0) as? [String: Any] })
        #expect(cuerpo["sourceId"] as? String == "r1")
        let ejercicios = try #require(cuerpo["exercises"] as? [[String: Any]])
        #expect(ejercicios.first?["targetSets"] as? Int == 4)
        #expect(ejercicios.first?["group"] as? String == "Fuerza")
        #expect((cuerpo["exerciseNames"] as? [String: String])?["press-de-banca-con-barra"] == "Press de banca con barra")
    }

    @Test("la rutina de un link se lee para copiarla")
    func rutinaCompartida() throws {
        let json = #"{"name":"Upper","note":"","ownerName":"Tobias","exercises":[{"exerciseId":"dominadas","order":0,"targetSets":4,"targetReps":6}]}"#
        let rutina = try RutinaCompartidaDTO.leer(Data(json.utf8), id: "abcdefghij")
        #expect(rutina.nombre == "Upper")
        #expect(rutina.detalle == "Te la compartió Tobias")
        #expect(rutina.ejercicios.first?.targetSets == 4)
    }

    @Test("un link abierto queda pendiente hasta que haya sesión")
    @MainActor func pendiente() {
        let enlaces = EnlacesEntrantes()
        #expect(enlaces.abrir(URL(string: "siezagym://r/abcdefghij")!))
        #expect(enlaces.rutina?.id == "abcdefghij")
        #expect(!enlaces.abrir(URL(string: "https://google.com")!))
    }
}
