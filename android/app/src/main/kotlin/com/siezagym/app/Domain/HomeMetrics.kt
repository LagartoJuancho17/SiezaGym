package com.siezagym.app.Domain

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.roundToInt
import kotlin.math.round

/** Métricas de la Home. Todo función pura: entran sesiones + catálogo, sale el
 *  número. Sin Firestore y sin Compose, para poder testearlo.
 *
 *  Convención: `sessions` viene de la más nueva a la más vieja, igual que la
 *  query de Firestore (`orderBy finishedAt desc`). */
object HomeMetrics {
    /** Misma asunción que `RoutineSummary` (40s de trabajo + 75s de descanso). */
    const val secondsPerSet = 115
    /** Compendium of Physical Activities, código 02050: entrenamiento de fuerza
     *  con esfuerzo vigoroso. Es un MET promedio, por eso son calorías estimadas. */
    const val resistanceMET = 5.0
    /** Cuando el usuario no cargó su peso en el perfil. Se marca como estimado. */
    const val defaultBodyWeightKg = 75.0
    const val defaultWeeklyCalorieGoal = 2000.0

    // MARK: - Volumen por grupo muscular

    data class MuscleVolumeRow(val muscle: MuscleGroup, val kg: Int, val pct: Double) {
        val label: String get() = muscle.label
    }

    data class MuscleVolume(val rows: List<MuscleVolumeRow>, val totalKg: Int) {
        val hasData: Boolean get() = totalKg > 0
    }

    fun volumeByMuscleGroup(sessions: List<WorkoutSession>, catalog: Map<String, Exercise>, limit: Int = 3): MuscleVolume {
        val raw = linkedMapOf<MuscleGroup, Double>()
        var total = 0.0

        for (session in sessions) {
            for (exercise in session.exercises) {
                val volume = exercise.volumeKg
                if (volume <= 0) continue
                val weights = catalog[exercise.exerciseID]?.muscleWeights ?: continue
                for ((muscle, share) in weights) {
                    val part = volume * share
                    raw[muscle] = (raw[muscle] ?: 0.0) + part
                    total += part
                }
            }
        }

        val rows = raw.entries
            .map { MuscleVolumeRow(it.key, it.value.roundToInt(), if (total > 0) it.value / total else 0.0) }
            .sortedByDescending { it.kg }

        return MuscleVolume(rows = rows.take(limit), totalKg = total.roundToInt())
    }

    // MARK: - Empuje contra tracción

    data class PushPull(val pushKg: Int, val pullKg: Int, val pct: Int, val label: String, val hasData: Boolean)

    fun pushPullBalance(sessions: List<WorkoutSession>, catalog: Map<String, Exercise>): PushPull {
        var push = 0.0
        var pull = 0.0

        for (session in sessions) {
            for (exercise in session.exercises) {
                val volume = exercise.volumeKg
                if (volume <= 0) continue
                val pattern = catalog[exercise.exerciseID]?.pattern ?: continue
                if (pattern.isPush) push += volume
                else if (pattern.isPull) pull += volume
            }
        }

        val total = push + pull
        if (total <= 0) return PushPull(0, 0, 50, "Sin datos", hasData = false)

        val pct = (push / total * 100).roundToInt()
        val label = when {
            pct >= 65 -> "Falta espalda"
            pct <= 35 -> "Falta pecho"
            else -> "Equilibrado"
        }
        return PushPull(push.roundToInt(), pull.roundToInt(), pct, label, hasData = true)
    }

    // MARK: - Series completadas

    data class Completion(val pct: Int, val completed: Int, val total: Int, val label: String, val hasData: Boolean)

    fun setCompletionRate(sessions: List<WorkoutSession>): Completion {
        var done = 0
        var total = 0
        for (session in sessions) {
            for (exercise in session.exercises) {
                for (set in exercise.sets) {
                    total++
                    if (!set.failed) done++
                }
            }
        }

        if (total <= 0) return Completion(0, 0, 0, "Sin datos", hasData = false)
        val pct = (done.toDouble() / total * 100).roundToInt()
        val label = when {
            pct < 90 -> "Regular"
            pct < 97 -> "Bien"
            else -> "Excelente"
        }
        return Completion(pct, done, total, label, hasData = true)
    }

    // MARK: - Volumen por día de la semana

    data class WeekdayVolume(val index: Int, val label: String, val kg: Int, val pct: Double)

    fun volumeByWeekday(sessions: List<WorkoutSession>): List<WeekdayVolume> {
        val totals = DoubleArray(7)
        for (session in sessions) {
            val finishedAt = session.finishedAt ?: continue
            totals[TrainingCalendar.weekdayIndex(finishedAt)] += session.totalVolumeKg
        }

        val max = totals.maxOrNull() ?: 0.0
        return totals.mapIndexed { index, kg ->
            WeekdayVolume(
                index = index,
                label = TrainingCalendar.dayLabels[index],
                kg = kg.roundToInt(),
                pct = if (max > 0) kg / max else 0.0,
            )
        }
    }

    // MARK: - Ventanas de tiempo

    fun sessionsInLastDays(sessions: List<WorkoutSession>, days: Int = 7, now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone)): List<WorkoutSession> {
        val cutoff = now.minusDays(days.toLong())
        return sessions.filter { it.finishedAt != null && it.finishedAt >= cutoff }
    }

    fun trainedDayKeys(sessions: List<WorkoutSession>): Set<String> =
        sessions.mapNotNull { it.finishedAt }.map { TrainingCalendar.dayKey(it) }.toSet()

    // MARK: - Intensidad

    fun bestOneRepMaxByExercise(sessions: List<WorkoutSession>): Map<String, Double> {
        val best = mutableMapOf<String, Double>()
        for (session in sessions) {
            for (exercise in session.exercises) {
                for (set in exercise.sets.filter { !it.failed }) {
                    val value = Epley.estimatedOneRepMax(set)
                    if (value <= 0) continue
                    val current = best[exercise.exerciseID] ?: 0.0
                    if (value > current) best[exercise.exerciseID] = value
                }
            }
        }
        return best
    }

    data class Intensity(val pct: Int, val label: String, val hasData: Boolean)

    fun relativeIntensity(sessions: List<WorkoutSession>): Intensity {
        val last = sessions.firstOrNull()
            ?: return Intensity(0, "Sin datos", hasData = false)

        val reference = bestOneRepMaxByExercise(sessions)
        var sum = 0.0
        var count = 0

        for (exercise in last.exercises) {
            val max = reference[exercise.exerciseID] ?: continue
            if (max <= 0) continue
            for (set in exercise.sets) {
                if (!set.failed && set.weight > 0) {
                    sum += (set.weight / max) * 100
                    count++
                }
            }
        }

        if (count <= 0) return Intensity(0, "Sin datos", hasData = false)
        val pct = (sum / count).roundToInt()
        val label = when {
            pct >= 85 -> "Muy alta"
            pct >= 70 -> "Alta"
            pct >= 55 -> "Moderada"
            else -> "Suave"
        }
        return Intensity(pct, label, hasData = true)
    }

    // MARK: - Volumen por sesión

    data class VolumeTrend(
        /** De la más vieja a la más nueva, para dibujarlas de izquierda a derecha. */
        val points: List<Int>,
        val averageKg: Int,
        val hasData: Boolean,
    )

    fun volumePerSession(sessions: List<WorkoutSession>, limit: Int = 8): VolumeTrend {
        val points = sessions.take(limit).map { it.totalVolumeKg.roundToInt() }.reversed()
        if (points.isEmpty()) return VolumeTrend(emptyList(), 0, hasData = false)
        val average = points.sum().toDouble() / points.size
        return VolumeTrend(points, average.roundToInt(), hasData = true)
    }

    // MARK: - Zonas de intensidad

    enum class Zone(val label: String) {
        LIGHT("Suave"),
        MED("Media"),
        HIGH("Alta"),
        PEAK("Pico");

        companion object {
            fun forPercentOfMax(pct: Double): Zone = when {
                pct >= 90 -> PEAK
                pct >= 80 -> HIGH
                pct >= 65 -> MED
                else -> LIGHT
            }
        }
    }

    data class Zones(val counts: Map<Zone, Int>, val total: Int) {
        val hasData: Boolean get() = total > 0
        fun count(zone: Zone): Int = counts[zone] ?: 0
        fun share(zone: Zone): Double = if (total > 0) count(zone).toDouble() / total else 0.0
    }

    fun intensityZones(sessions: List<WorkoutSession>): Zones {
        val reference = bestOneRepMaxByExercise(sessions)
        val counts = mutableMapOf<Zone, Int>()
        var total = 0

        for (session in sessions) {
            for (exercise in session.exercises) {
                val max = reference[exercise.exerciseID] ?: continue
                if (max <= 0) continue
                for (set in exercise.sets) {
                    if (!set.failed && set.weight > 0) {
                        val zone = Zone.forPercentOfMax((set.weight / max) * 100)
                        counts[zone] = (counts[zone] ?: 0) + 1
                        total++
                    }
                }
            }
        }
        return Zones(counts, total)
    }

    /** Zona serie por serie de la última sesión, para el gráfico escalonado. */
    fun intensitySequence(sessions: List<WorkoutSession>, limit: Int = 14): List<Zone> {
        val last = sessions.firstOrNull() ?: return emptyList()
        val reference = bestOneRepMaxByExercise(sessions)
        val steps = mutableListOf<Zone>()

        for (exercise in last.exercises) {
            val max = reference[exercise.exerciseID] ?: continue
            if (max <= 0) continue
            for (set in exercise.sets) {
                if (!set.failed && set.weight > 0) {
                    steps.add(Zone.forPercentOfMax((set.weight / max) * 100))
                }
            }
        }
        return steps.take(limit)
    }

    // MARK: - Calorías

    /** Duración útil de una sesión en segundos.
     *  `durationSeconds` está mal guardado en muchas sesiones (hay sesiones de 6
     *  series con 25 segundos), así que si el valor es físicamente imposible se
     *  estima a partir de las series. */
    fun sessionSeconds(session: WorkoutSession): Int {
        val sets = session.totalSetsCompleted
        val stored = session.durationSeconds
        val floor = sets * 30
        return if (stored > 0 && stored >= floor) stored else sets * secondsPerSet
    }

    /** MET × peso corporal × horas. Es una estimación, no una medición: no hay
     *  sensor. Se marca como estimada cuando falta el peso del perfil. */
    fun calories(session: WorkoutSession, bodyWeightKg: Double?): Int {
        val weight = if ((bodyWeightKg ?: 0.0) > 0) bodyWeightKg!! else defaultBodyWeightKg
        val hours = sessionSeconds(session).toDouble() / 3600
        return (resistanceMET * weight * hours).roundToInt()
    }

    data class CalorieGoal(
        val kcal: Int,
        val goal: Int,
        val pct: Int,
        val label: String,
        /** true cuando se usó el peso por defecto porque el perfil no lo tiene. */
        val usesDefaultWeight: Boolean,
        val hasData: Boolean,
    )

    fun weeklyCalories(sessions: List<WorkoutSession>, bodyWeightKg: Double?, goal: Double?): CalorieGoal {
        val target = if ((goal ?: 0.0) > 0) goal!! else defaultWeeklyCalorieGoal
        val kcal = sessions.sumOf { calories(it, bodyWeightKg) }
        val pct = if (target > 0) minOf(100, (kcal.toDouble() / target * 100).roundToInt()) else 0
        val label = when {
            pct >= 100 -> "Objetivo cumplido"
            pct >= 70 -> "Casi"
            pct >= 35 -> "En camino"
            else -> "Vas lento"
        }
        return CalorieGoal(
            kcal = kcal,
            goal = target.roundToInt(),
            pct = pct,
            label = label,
            usesDefaultWeight = !((bodyWeightKg ?: 0.0) > 0),
            hasData = kcal > 0,
        )
    }
}