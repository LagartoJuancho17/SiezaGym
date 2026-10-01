import Foundation

nonisolated enum WidgetSnapshotBuilder {
    /// Arma el snapshot con las mismas cuentas que la portada de la app, para
    /// que el widget y la Home nunca digan números distintos.
    static func build(
        themeID: String,
        sessions: [WorkoutSession],
        routine: Routine?,
        catalog: [String: Exercise],
        profile: UserProfile? = nil,
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
            updatedAt: now,
            // Mismas cuentas y las mismas fuentes que usa GymStore para la
            // Home/Progreso: calorías y volumen muscular son de siempre (no
            // solo la semana), igual que `store.completion`/`store.muscleVolume`.
            // `HomeMetrics` vive en el target de la app; acá se traduce a los
            // tipos livianos de `SiezaGymCompartido` que la extensión sí ve.
            calorias: resumenCalorias(HomeMetrics.weeklyCalories(semana, bodyWeightKg: profile?.bodyWeightKg, goal: profile?.weeklyCalorieGoalKcal)),
            series: resumenSeries(HomeMetrics.setCompletionRate(sessions)),
            musculos: resumenMusculos(HomeMetrics.volumeByMuscleGroup(sessions, catalog: catalog))
        )
    }

    private static func resumenCalorias(_ meta: HomeMetrics.CalorieGoal) -> ResumenCalorias {
        ResumenCalorias(
            kcal: meta.kcal, meta: meta.goal, pct: meta.pct, etiqueta: meta.label,
            pesoPorDefecto: meta.usesDefaultWeight, hasData: meta.hasData
        )
    }

    private static func resumenSeries(_ cumplimiento: HomeMetrics.Completion) -> ResumenSeries {
        ResumenSeries(
            pct: cumplimiento.pct, completadas: cumplimiento.completed, totales: cumplimiento.total,
            etiqueta: cumplimiento.label, hasData: cumplimiento.hasData
        )
    }

    private static func resumenMusculos(_ volumen: HomeMetrics.MuscleVolume) -> ResumenMusculos {
        ResumenMusculos(
            filas: volumen.rows.map { FilaMusculo(musculo: $0.label, kg: $0.kg, pct: $0.pct) },
            totalKg: volumen.totalKg,
            hasData: volumen.hasData
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
