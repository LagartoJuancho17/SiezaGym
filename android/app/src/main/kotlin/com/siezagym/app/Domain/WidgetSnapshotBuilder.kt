package com.siezagym.app.Domain

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import kotlin.math.roundToInt

/**
 * Arma el snapshot del widget con las mismas cuentas que la portada, para que el widget y la Home
 * nunca digan números distintos. Puerto de `WidgetSnapshotBuilder.swift`.
 */
object WidgetSnapshotBuilder {
    fun build(
        themeID: String,
        sessions: List<WorkoutSession>,
        routine: Routine?,
        catalog: Map<String, Exercise>,
        profile: UserProfile? = null,
        now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone),
    ): WidgetSnapshot {
        val entrenados = HomeMetrics.trainedDayKeys(sessions)
        val semana = HomeMetrics.sessionsInLastDays(sessions, days = 7, now = now)

        return WidgetSnapshot(
            themeID = themeID,
            streak = TrainingCalendar.streak(entrenados, now),
            week = weekFlags(entrenados, now),
            weeklyVolumeKg = redondear2(semana.sumOf { it.totalVolumeKg }),
            weeklySessions = semana.size,
            routineName = routine?.name,
            routineExercises = routine?.exercises?.size ?: 0,
            routineSets = routine?.exercises?.sumOf { maxOf(1, it.targetSets) } ?: 0,
            routineMinutes = routine?.let { RoutineSummary.estimatedMinutes(it, catalog) } ?: 0,
            lastSessionAt = sessions.mapNotNull { it.finishedAt }.maxOrNull(),
            updatedAt = now,
            calorias =
                resumenCalorias(
                    HomeMetrics.weeklyCalories(
                        semana,
                        profile?.bodyWeightKg,
                        profile?.weeklyCalorieGoalKcal,
                    )
                ),
            series = resumenSeries(HomeMetrics.setCompletionRate(sessions)),
            musculos = resumenMusculos(HomeMetrics.volumeByMuscleGroup(sessions, catalog)),
        )
    }

    /**
     * Lunes a domingo de la semana en curso, en hora Argentina. Los días que todavía no llegaron
     * van en `false`, igual que la tira de la portada.
     */
    fun weekFlags(
        trainedDayKeys: Set<String>,
        now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone),
    ): List<Boolean> {
        val indiceHoy = TrainingCalendar.weekdayIndex(now)
        return (0..6).map { indice ->
            val dia = now.plusDays((indice - indiceHoy).toLong())
            trainedDayKeys.contains(TrainingCalendar.dayKey(dia))
        }
    }

    private fun resumenCalorias(meta: HomeMetrics.CalorieGoal) =
        ResumenCalorias(
            kcal = meta.kcal,
            meta = meta.goal,
            pct = meta.pct,
            etiqueta = meta.label,
            pesoPorDefecto = meta.usesDefaultWeight,
            hasData = meta.hasData,
        )

    private fun resumenSeries(cumplimiento: HomeMetrics.Completion) =
        ResumenSeries(
            pct = cumplimiento.pct,
            completadas = cumplimiento.completed,
            totales = cumplimiento.total,
            etiqueta = cumplimiento.label,
            hasData = cumplimiento.hasData,
        )

    private fun resumenMusculos(volumen: HomeMetrics.MuscleVolume) =
        ResumenMusculos(
            filas = volumen.rows.map { FilaMusculo(it.label, it.kg, it.pct) },
            totalKg = volumen.totalKg,
            hasData = volumen.hasData,
        )

    /** El volumen del widget va con dos decimales, igual que en iOS. */
    private fun redondear2(valor: Double): Double = (valor * 100).roundToInt() / 100.0
}
