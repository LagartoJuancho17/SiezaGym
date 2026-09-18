package com.siezagym.app.Domain

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.Routine
import kotlin.math.roundToInt

/** Estimación de duración y reparto muscular de una rutina.
 *  Los segundos por serie son los mismos que usa la web. */
object RoutineSummary {
    const val secondsPerWorkingSet = 40
    const val secondsPerRest = 75

    fun estimatedMinutes(routine: Routine, catalog: Map<String, Exercise>): Int {
        val seconds = routine.exercises.sumOf { item ->
            val exercise = catalog[item.exerciseID]
            val working = if (exercise?.registrationType?.isTimeBased == true) {
                if (item.targetReps > 0) item.targetReps else secondsPerWorkingSet
            } else secondsPerWorkingSet
            item.targetSets * (working + secondsPerRest)
        }
        return (seconds / 60.0).roundToInt()
    }

    data class MuscleShare(val muscle: MuscleGroup, val pct: Double)

    /** Los targetSets de cada ejercicio se reparten entre sus músculos según
     *  `muscleWeights`, y el total se normaliza sobre el volumen de la rutina. */
    fun muscleDistribution(routine: Routine, catalog: Map<String, Exercise>): List<MuscleShare> {
        val raw = linkedMapOf<MuscleGroup, Double>()
        var total = 0.0

        for (item in routine.exercises) {
            val exercise = catalog[item.exerciseID] ?: continue
            for ((muscle, weight) in exercise.muscleWeights) {
                val contribution = item.targetSets.toDouble() * weight
                raw[muscle] = (raw[muscle] ?: 0.0) + contribution
                total += contribution
            }
        }

        if (total <= 0) return emptyList()
        return raw.entries
            .map { MuscleShare(it.key, it.value / total) }
            .sortedByDescending { it.pct }
    }
}