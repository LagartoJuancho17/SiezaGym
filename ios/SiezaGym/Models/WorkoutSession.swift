import Foundation

/// Una serie efectivamente ejecutada y registrada.
nonisolated struct LoggedSet: Sendable, Hashable, Identifiable {
    var id: Int { setNumber }
    let setNumber: Int
    let weight: Double
    let reps: Int
    let rir: Int?
    /// Serie fallada: no suma volumen ni cuenta para intensidad.
    let failed: Bool

    var volumeKg: Double { failed ? 0 : weight * Double(reps) }
}

nonisolated struct LoggedExercise: Sendable, Hashable, Identifiable {
    let exerciseID: String
    let sets: [LoggedSet]

    var id: String { exerciseID }
    var volumeKg: Double { sets.reduce(0) { $0 + $1.volumeKg } }
}

nonisolated struct WorkoutSession: Identifiable, Sendable, Hashable {
    let id: String
    let userID: String
    let routineName: String?
    let routineID: String?
    let startedAt: Date?
    let finishedAt: Date?
    let durationSeconds: Int
    let exercises: [LoggedExercise]
    let totalVolumeKg: Double
    let totalSetsCompleted: Int
}

nonisolated extension LoggedSet {
    init(index: Int, data: [String: Any]) {
        setNumber = FirestoreValue.int(data["setNumber"]) ?? index + 1
        weight = FirestoreValue.double(data["weight"]) ?? 0
        reps = FirestoreValue.int(data["reps"]) ?? 0
        rir = FirestoreValue.int(data["rir"])
        failed = FirestoreValue.bool(data["failed"]) ?? false
    }

    var firestoreValue: [String: Any] {
        var payload: [String: Any] = [
            "setNumber": setNumber,
            "weight": weight,
            "reps": reps,
            "failed": failed,
        ]
        if let rir { payload["rir"] = rir }
        return payload
    }
}

nonisolated extension WorkoutSession {
    init(id: String, data: [String: Any]) {
        self.id = id
        userID = data["userId"] as? String ?? ""
        routineName = data["routineName"] as? String
        routineID = (data["source"] as? [String: Any])?["routineId"] as? String
        startedAt = FirestoreValue.date(data["startedAt"])
        finishedAt = FirestoreValue.date(data["finishedAt"])
        durationSeconds = FirestoreValue.int(data["durationSeconds"]) ?? 0
        totalVolumeKg = FirestoreValue.double(data["totalVolumeKg"]) ?? 0
        totalSetsCompleted = FirestoreValue.int(data["totalSetsCompleted"]) ?? 0
        exercises = (data["exercises"] as? [[String: Any]] ?? []).map { item in
            LoggedExercise(
                exerciseID: item["exerciseId"] as? String ?? "",
                sets: (item["sets"] as? [[String: Any]] ?? [])
                    .enumerated()
                    .map { LoggedSet(index: $0.offset, data: $0.element) }
            )
        }
    }
}
