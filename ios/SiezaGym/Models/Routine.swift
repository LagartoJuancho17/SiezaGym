import Foundation

/// Una serie prescrita dentro de una rutina (lo que el plan dice que hay que hacer).
nonisolated struct PlannedSet: Sendable, Hashable, Identifiable {
    var id: Int { setNumber }
    let setNumber: Int
    let weight: Double?
    let reps: Int
    let rir: Int?
}

/// Un ejercicio dentro de una rutina, con sus objetivos.
nonisolated struct RoutineExercise: Sendable, Hashable, Identifiable {
    let exerciseID: String
    let source: Source
    let order: Int
    let targetSets: Int
    let targetReps: Int
    let targetRIR: Int?
    let targetWeight: Double?
    let techniqueNote: String
    /// Series individuales cuando el coach las prescribio una por una.
    let sets: [PlannedSet]?

    var id: String { "\(order)-\(exerciseID)" }

    enum Source: String, Sendable {
        case catalog, custom
    }
}

nonisolated struct Routine: Identifiable, Sendable, Hashable {
    let id: String
    let ownerID: String
    let name: String
    let note: String
    let exercises: [RoutineExercise]
    let showOnHome: Bool
    let lastUsedAt: Date?
    let createdAt: Date?
    let updatedAt: Date?
    /// Las rutinas asignadas por un coach no se editan desde la app del alumno.
    let isAssigned: Bool

    var totalSets: Int {
        exercises.reduce(0) { $0 + $1.targetSets }
    }

    /// Fecha con la que la rutina se ubica en el calendario: primero cuando la
    /// asignaron, si no cuando se creo, si no el ultimo uso.
    var referenceDate: Date? {
        createdAt ?? lastUsedAt
    }
}

nonisolated extension RoutineExercise {
    init(order: Int, data: [String: Any]) {
        exerciseID = data["exerciseId"] as? String ?? ""
        source = (data["exerciseSource"] as? String) == "custom" ? .custom : .catalog
        self.order = FirestoreValue.int(data["order"]) ?? order
        targetSets = FirestoreValue.int(data["targetSets"]) ?? 3
        targetReps = FirestoreValue.int(data["targetReps"]) ?? 10
        targetRIR = FirestoreValue.int(data["targetRIR"])
        targetWeight = FirestoreValue.double(data["targetWeight"])
        techniqueNote = data["techniqueNote"] as? String ?? ""

        if let raw = data["sets"] as? [[String: Any]] {
            sets = raw.enumerated().map { index, set in
                PlannedSet(
                    setNumber: FirestoreValue.int(set["setNumber"]) ?? index + 1,
                    weight: FirestoreValue.double(set["weight"]),
                    reps: FirestoreValue.int(set["reps"]) ?? 10,
                    rir: FirestoreValue.int(set["rir"])
                )
            }
        } else {
            sets = nil
        }
    }
}

nonisolated extension Routine {
    init(id: String, data: [String: Any], isAssigned: Bool = false) {
        self.id = id
        self.isAssigned = isAssigned
        ownerID = data["ownerId"] as? String ?? data["studentId"] as? String ?? ""
        name = data["name"] as? String ?? data["routineName"] as? String ?? ""
        note = data["note"] as? String ?? ""
        showOnHome = FirestoreValue.bool(data["showOnHome"]) ?? true
        lastUsedAt = FirestoreValue.date(data["lastUsedAt"])
        // Una asignacion se ubica por cuando la asignaron; una rutina propia,
        // por cuando se creo. Mismo criterio que lib/routines/schedule.js.
        createdAt = FirestoreValue.date(data["assignedAt"]) ?? FirestoreValue.date(data["createdAt"])
        updatedAt = FirestoreValue.date(data["updatedAt"])
        exercises = (data["exercises"] as? [[String: Any]] ?? [])
            .enumerated()
            .map { RoutineExercise(order: $0.offset, data: $0.element) }
            .sorted { $0.order < $1.order }
    }
}
