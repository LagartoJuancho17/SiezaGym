import Foundation

nonisolated enum WidgetSnapshotBuilder {
    /// Arma el snapshot con las mismas cuentas que la portada de la app, para
    /// que el widget y la Home nunca digan números distintos.
    static func build(
        themeID: String,
        sessions: [WorkoutSession],
        routine: Routine?,
        catalog: [String: Exercise],
        now: Date = Date()
    ) -> WidgetSnapshot {
        let entrenados = HomeMetrics.trainedDayKeys(sessions)
        let semana = HomeMetrics.sessionsInLastDays(sessions, days: 7, now: now)

        return WidgetSnapshot(
            themeID: themeID,
            streak: TrainingCalendar.streak(trainedDayKeys: entrenados, now: now),
            week: weekFlags(trainedDayKeys: entrenados, now: now),
            weeklyVolumeKg: (semana.reduce(0) { $0 + $1.totalVolumeKg } * 100).rounded() / 100,
            weeklySessions: semana.count,
            routineName: routine?.name,
            routineExercises: routine?.exercises.count ?? 0,
            routineSets: routine?.exercises.reduce(0) { $0 + max(1, $1.targetSets) } ?? 0,
            routineMinutes: routine.map { RoutineSummary.estimatedMinutes($0, catalog: catalog) } ?? 0,
            lastSessionAt: sessions.compactMap(\.finishedAt).max(),
            updatedAt: now
        )
    }

    /// Lunes a domingo de la semana en curso, en hora Argentina. Los días que
    /// todavía no llegaron van en `false`, igual que la tira de la portada.
    static func weekFlags(trainedDayKeys: Set<String>, now: Date = Date()) -> [Bool] {
        let calendario = TrainingCalendar.calendar
        let indiceHoy = TrainingCalendar.weekdayIndex(now)

        return (0..<7).map { indice in
            guard let dia = calendario.date(byAdding: .day, value: indice - indiceHoy, to: now) else {
                return false
            }
            return trainedDayKeys.contains(TrainingCalendar.dayKey(dia))
        }
    }
}
