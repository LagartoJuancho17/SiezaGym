import FirebaseFirestore
import Foundation
import os

private nonisolated let log = Logger(subsystem: "com.siezagym.app", category: "firestore")

/// Acceso a Firestore. Es el mismo proyecto y las mismas colecciones que usa la
/// web, asi que lo que se registra en el gimnasio aparece ahi y al reves.
///
/// `nonisolated` a proposito: son llamadas de red, no tocan estado de UI, y asi
/// el SDK las resuelve fuera del main actor.
nonisolated struct GymRepository: Sendable {
    private var db: Firestore { Firestore.firestore() }

    // MARK: - Catalogo

    /// Los 94 ejercicios cambian muy poco: se cachean por proceso para no pagar
    /// lecturas de Firestore en cada pantalla.
    private static let cache = CatalogCache()

    func exercises() async throws -> [String: Exercise] {
        if let cached = await Self.cache.value { return cached }

        let snapshot = try await db.collection("exercises").getDocuments()
        let catalog = Dictionary(
            snapshot.documents.map { ($0.documentID, Exercise(id: $0.documentID, data: $0.data())) },
            uniquingKeysWith: { first, _ in first }
        )
        await Self.cache.store(catalog)
        return catalog
    }

    // MARK: - Perfil

    func profile(uid: String) async throws -> UserProfile? {
        let document = try await db.collection("users").document(uid).getDocument()
        guard let data = document.data() else { return nil }
        return UserProfile(id: uid, data: data)
    }

    /// Mismo comportamiento que `ensureUserProfile` en la web: la primera vez
    /// escribe el perfil entero; despues solo refresca los datos del proveedor y
    /// las fechas de acceso. `createdAt` y `provider` no se pisan nunca -- si se
    /// pisaran, cada login diria que la cuenta se creo hoy.
    func ensureProfile(
        uid: String,
        email: String?,
        displayName: String?,
        photoURL: String? = nil,
        provider: String = "password"
    ) async throws {
        let document = db.collection("users").document(uid)
        let existing = try await document.getDocument().data()

        guard let existing else {
            try await document.setData([
                "email": email as Any,
                "displayName": displayName as Any,
                "photoURL": photoURL as Any,
                "provider": provider,
                "createdAt": FieldValue.serverTimestamp(),
                "updatedAt": FieldValue.serverTimestamp(),
                "lastLoginAt": FieldValue.serverTimestamp(),
            ])
            return
        }

        try await document.setData([
            "email": email ?? existing["email"] as Any,
            "displayName": displayName ?? existing["displayName"] as Any,
            "photoURL": photoURL ?? existing["photoURL"] as Any,
            "updatedAt": FieldValue.serverTimestamp(),
            "lastLoginAt": FieldValue.serverTimestamp(),
        ], merge: true)
    }

    func updateProfile(uid: String, fields: [String: Any]) async throws {
        var payload = fields
        payload["updatedAt"] = FieldValue.serverTimestamp()
        try await db.collection("users").document(uid).setData(payload, merge: true)
    }

    // MARK: - Rutinas

    /// Rutinas propias mas las que le asigno un coach, ordenadas por uso.
    func routines(uid: String) async throws -> [Routine] {
        async let own = db.collection("routines").whereField("ownerId", isEqualTo: uid).getDocuments()
        async let assigned = db.collection("assignments").whereField("studentId", isEqualTo: uid).getDocuments()

        let routines = try await own.documents.map { Routine(id: $0.documentID, data: $0.data()) }
        let assignments = try await assigned.documents.map {
            Routine(id: $0.documentID, data: $0.data(), isAssigned: true)
        }

        return (routines + assignments).sorted {
            ($0.lastUsedAt ?? $0.createdAt ?? .distantPast) > ($1.lastUsedAt ?? $1.createdAt ?? .distantPast)
        }
    }

    func routine(id: String, isAssigned: Bool) async throws -> Routine? {
        let collection = isAssigned ? "assignments" : "routines"
        let document = try await db.collection(collection).document(id).getDocument()
        guard let data = document.data() else { return nil }
        return Routine(id: id, data: data, isAssigned: isAssigned)
    }

    // MARK: - Sesiones

    func sessions(uid: String, limit: Int = 50) async throws -> [WorkoutSession] {
        let snapshot = try await db.collection("sessions")
            .whereField("userId", isEqualTo: uid)
            .order(by: "finishedAt", descending: true)
            .limit(to: limit)
            .getDocuments()
        return snapshot.documents.map { WorkoutSession(id: $0.documentID, data: $0.data()) }
    }

    /// Guarda una sesion terminada. Devuelve el id del documento nuevo.
    /// El volumen y el conteo de series se calculan aca y no en el cliente para
    /// que coincidan exactamente con lo que hace la web.
    @discardableResult
    func saveSession(
        uid: String,
        routine: Routine?,
        startedAt: Date,
        exercises: [LoggedExercise]
    ) async throws -> String {
        let logged = exercises.filter { !$0.sets.isEmpty }
        guard !logged.isEmpty else { throw RepositoryError.emptySession }

        let totalVolume = logged.reduce(0) { $0 + $1.volumeKg }
        let totalSets = logged.reduce(0) { $0 + $1.sets.count }
        guard totalSets > 0 else { throw RepositoryError.emptySession }

        var payload: [String: Any] = [
            "userId": uid,
            "routineName": routine?.name as Any,
            "startedAt": Timestamp(date: startedAt),
            "finishedAt": FieldValue.serverTimestamp(),
            "durationSeconds": Int(Date().timeIntervalSince(startedAt)),
            "totalVolumeKg": (totalVolume * 100).rounded() / 100,
            "totalSetsCompleted": totalSets,
            "exerciseIds": Array(Set(logged.map(\.exerciseID))),
            "exercises": logged.map { exercise in
                ["exerciseId": exercise.exerciseID, "sets": exercise.sets.map(\.firestoreValue)]
            },
            "createdAt": FieldValue.serverTimestamp(),
        ]
        if let routine {
            payload["source"] = ["type": routine.isAssigned ? "assignment" : "routine", "routineId": routine.id]
        }

        let reference = try await db.collection("sessions").addDocument(data: payload)

        // Marca la rutina como usada para que suba en la lista y en la Home.
        if let routine {
            let collection = routine.isAssigned ? "assignments" : "routines"
            try? await db.collection(collection).document(routine.id).updateData([
                "lastUsedAt": FieldValue.serverTimestamp(),
            ])
        }

        log.info("sesion guardada \(reference.documentID, privacy: .public), \(totalSets) series")
        return reference.documentID
    }

    enum RepositoryError: LocalizedError {
        case emptySession

        var errorDescription: String? {
            switch self {
            case .emptySession: "No cargaste ninguna serie."
            }
        }
    }
}

/// El catalogo se comparte entre pantallas, asi que vive detras de un actor.
private actor CatalogCache {
    private(set) var value: [String: Exercise]?

    func store(_ catalog: [String: Exercise]) {
        value = catalog
    }
}
