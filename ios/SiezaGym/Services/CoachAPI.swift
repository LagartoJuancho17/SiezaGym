import Foundation

/// El panel del entrenador contra `/api/coach`. Mismos datos que
/// `/dashboard/coach` en la web.
nonisolated struct PanelCoach: Decodable, Sendable, Equatable {
    struct Codigo: Decodable, Sendable, Equatable {
        let code: String
        let expiresAt: Date
    }

    struct Alumno: Decodable, Sendable, Equatable, Identifiable, Hashable {
        let studentId: String
        let displayName: String
        let email: String?
        let photoURL: URL?
        let linkedAt: Date?
        let plans: Int
        var id: String { studentId }
    }

    struct Resumen: Decodable, Sendable, Equatable {
        let linkedStudents: Int
        let assignedPlans: Int
        let studentsWithActivity: Int
        let planCoveragePct: Int
    }

    struct Actividad: Decodable, Sendable, Equatable, Identifiable {
        let id: String
        let studentId: String
        let studentName: String?
        let routineName: String
        let completedAt: Date
        let durationSeconds: Int
    }

    let code: Codigo?
    let students: [Alumno]
    let summary: Resumen
    let recentActivity: [Actividad]
}

nonisolated struct DetalleAlumno: Decodable, Sendable, Equatable {
    struct Perfil: Decodable, Sendable, Equatable {
        let studentId: String
        let displayName: String
        let email: String?
        let photoURL: URL?
        let experienceLevel: String?
        let bodyWeightKg: Double?
        let trainingGoal: String?
        let trainingDaysPerWeek: Int?
    }

    struct Sesion: Decodable, Sendable, Equatable, Identifiable {
        struct Ejercicio: Decodable, Sendable, Equatable {
            struct Serie: Decodable, Sendable, Equatable {
                let reps: Int?
                let weight: Double?
            }
            let exerciseId: String
            let sets: [Serie]
            let note: String?
        }
        let id: String
        let routineName: String?
        let finishedAt: Date?
        let durationSeconds: Int
        let totalVolumeKg: Double
        let totalSetsCompleted: Int
        let exercises: [Ejercicio]
    }

    struct Asignacion: Decodable, Sendable, Equatable, Identifiable {
        let id: String
        let routineId: String
        let routineName: String
        let weekLabel: String?
        let note: String?
        let assignedAt: Date?
        let lastCompletedAt: Date?
        let exercises: Int
    }

    let student: Perfil
    let sessions: [Sesion]
    let assignments: [Asignacion]
}

nonisolated struct EntrenadorVinculado: Decodable, Sendable, Equatable {
    let coachId: String
    let displayName: String
    let email: String?
    let photoURL: URL?
    let linkedAt: Date?
}

nonisolated extension WebAPI {
    private struct Ok: Decodable {}
    private struct ConCoach: Decodable { let coach: EntrenadorVinculado? }
    private struct ConId: Decodable { let id: String }

    func panelCoach() async throws -> PanelCoach {
        try await pedir("GET", "/api/coach")
    }

    /// Genera (o devuelve el vigente) código de invitación. Es lo que vuelve
    /// entrenador a una cuenta.
    func generarCodigo() async throws -> PanelCoach.Codigo {
        try await pedir("POST", "/api/coach/codigo")
    }

    func revocarCodigo() async throws {
        let _: [String: Int] = try await pedir("DELETE", "/api/coach/codigo")
    }

    func alumno(_ id: String) async throws -> DetalleAlumno {
        try await pedir("GET", "/api/coach/alumnos/\(id)")
    }

    func quitarAlumno(_ id: String) async throws {
        let _: Ok = try await pedir("DELETE", "/api/coach/alumnos/\(id)")
    }

    func asignar(rutina: String, a alumno: String, semana: Int?, nota: String) async throws {
        var cuerpo: [String: Any] = ["studentId": alumno, "routineId": rutina, "note": nota]
        if let semana { cuerpo["weekNumber"] = semana }
        let _: ConId = try await pedir("POST", "/api/coach/asignaciones", cuerpo: cuerpo)
    }

    func desasignar(_ asignacion: String) async throws {
        let _: Ok = try await pedir("DELETE", "/api/coach/asignaciones/\(asignacion)")
    }

    // MARK: Del lado del alumno

    func miEntrenador() async throws -> EntrenadorVinculado? {
        let respuesta: ConCoach = try await pedir("GET", "/api/coach/vinculo")
        return respuesta.coach
    }

    func vincularme(codigo: String) async throws -> EntrenadorVinculado? {
        let respuesta: ConCoach = try await pedir("POST", "/api/coach/vinculo", cuerpo: ["code": codigo])
        return respuesta.coach
    }

    func desvincularme() async throws {
        let _: Ok = try await pedir("DELETE", "/api/coach/vinculo")
    }
}
