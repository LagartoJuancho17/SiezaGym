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
                let weight: Double
                let reps: Int
                let failed: Bool
                /// Batió el mejor 1RM estimado que tenía ese ejercicio antes.
                let pr: Bool

                init(weight: Double, reps: Int, failed: Bool = false, pr: Bool = false) {
                    self.weight = weight; self.reps = reps; self.failed = failed; self.pr = pr
                }

                init(from decoder: Decoder) throws {
                    let c = try decoder.container(keyedBy: CodingKeys.self)
                    weight = try c.decodeIfPresent(Double.self, forKey: .weight) ?? 0
                    reps = try c.decodeIfPresent(Int.self, forKey: .reps) ?? 0
                    failed = try c.decodeIfPresent(Bool.self, forKey: .failed) ?? false
                    pr = try c.decodeIfPresent(Bool.self, forKey: .pr) ?? false
                }

                private enum CodingKeys: String, CodingKey { case weight, reps, failed, pr }

                /// "80 kg × 8", o "12 reps" si no lleva peso.
                var texto: String {
                    weight > 0 ? "\(BodyMetrics.numero(weight)) kg × \(reps)" : "\(reps) reps"
                }
            }
            var hayPR: Bool { sets.contains(where: \.pr) }
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

    /// El mejor de cada ejercicio (ver lib/progress/records.js).
    struct Record: Decodable, Sendable, Equatable, Identifiable {
        struct Serie: Decodable, Sendable, Equatable { let weight: Double; let reps: Int }
        let exerciseId: String
        let bestOneRepMax: Double
        let bestSet: Serie?
        let bestAt: Date?
        let maxWeightKg: Double
        let maxReps: Int
        let sessions: Int
        var id: String { exerciseId }

        /// Lo grande de la fila: el 1RM estimado, o las reps si es sin peso.
        var valor: (numero: String, unidad: String) {
            bestOneRepMax > 0
                ? ("\(BodyMetrics.numero(bestOneRepMax)) kg", "1RM est.")
                : ("\(maxReps)", "reps máx.")
        }

        /// "Mejor serie: 80 kg × 8 · máx. 85 kg"
        var detalle: String {
            guard let bestSet, bestOneRepMax > 0 else {
                return "\(sessions) \(sessions == 1 ? "entrenamiento" : "entrenamientos")"
            }
            var texto = "Mejor serie: \(BodyMetrics.numero(bestSet.weight)) kg × \(bestSet.reps)"
            if maxWeightKg > bestSet.weight { texto += " · máx. \(BodyMetrics.numero(maxWeightKg)) kg" }
            return texto
        }
    }

    let student: Perfil
    let sessions: [Sesion]
    let assignments: [Asignacion]
    let records: [Record]
    let exerciseNames: [String: String]

    func nombre(_ exerciseID: String) -> String { exerciseNames[exerciseID] ?? exerciseID }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        student = try c.decode(Perfil.self, forKey: .student)
        sessions = try c.decode([Sesion].self, forKey: .sessions)
        assignments = try c.decode([Asignacion].self, forKey: .assignments)
        // Una web sin esta versión no los manda: la pantalla sigue andando.
        records = try c.decodeIfPresent([Record].self, forKey: .records) ?? []
        exerciseNames = try c.decodeIfPresent([String: String].self, forKey: .exerciseNames) ?? [:]
    }

    private enum CodingKeys: String, CodingKey { case student, sessions, assignments, records, exerciseNames }
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
