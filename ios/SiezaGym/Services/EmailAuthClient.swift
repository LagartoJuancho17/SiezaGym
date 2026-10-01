import Foundation

/// El servidor comprueba la contraseña y envía el código sin entregar una
/// sesión. Sólo la verificación devuelve un custom token de Firebase.
struct EmailAuthClient {
    enum Failure: LocalizedError {
        case server(String)
        case invalidResponse

        var errorDescription: String? {
            switch self {
            case let .server(message): message
            case .invalidResponse: "No pudimos completar el acceso. Probá de nuevo."
            }
        }
    }

    private let baseURL: URL
    private let session: URLSession

    init(
        baseURL: URL = URL(string: "https://sieza-gym.vercel.app")!,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    func start(form: EmailAuthForm) async throws -> PendingEmailChallenge {
        let response: StartResponse = try await post("start", body: StartRequest(
            email: form.email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: form.password,
            modo: form.mode.rawValue,
            displayName: form.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        ))
        guard !response.desafio.isEmpty, response.venceEnSegundos > 0 else {
            throw Failure.invalidResponse
        }
        return PendingEmailChallenge(
            id: response.desafio,
            email: form.email.trimmingCharacters(in: .whitespacesAndNewlines),
            expiresAt: Date().addingTimeInterval(TimeInterval(response.venceEnSegundos)),
            deliveredToConsole: response.transporte == "consola"
        )
    }

    func verify(challengeID: String, code: String) async throws -> String {
        let response: VerifyResponse = try await post("verify", body: VerifyRequest(
            desafio: challengeID,
            codigo: code
        ))
        guard !response.token.isEmpty else { throw Failure.invalidResponse }
        return response.token
    }

    private func post<T: Encodable, R: Decodable>(_ path: String, body: T) async throws -> R {
        var request = URLRequest(url: baseURL.appending(path: "api/mfa/\(path)"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, rawResponse) = try await session.data(for: request)
        guard let response = rawResponse as? HTTPURLResponse else {
            throw Failure.invalidResponse
        }
        if !(200..<300).contains(response.statusCode) {
            let message = try? JSONDecoder().decode(ServerError.self, from: data).mensaje
            throw Failure.server(message ?? "No pudimos completar el acceso. Probá de nuevo.")
        }
        guard let decoded = try? JSONDecoder().decode(R.self, from: data) else {
            throw Failure.invalidResponse
        }
        return decoded
    }
}

private struct StartRequest: Encodable {
    let email: String
    let password: String
    let modo: String
    let displayName: String
}

private struct VerifyRequest: Encodable {
    let desafio: String
    let codigo: String
}

private struct StartResponse: Decodable {
    let desafio: String
    let venceEnSegundos: Int
    let transporte: String?
}

private struct VerifyResponse: Decodable {
    let token: String
}

private struct ServerError: Decodable {
    let mensaje: String
}
