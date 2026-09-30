package com.siezagym.app.Domain

import kotlin.math.roundToInt

/** Un ejercicio del entrenamiento, reducido a lo que la actividad necesita. */
data class WorkoutProgress(val exerciseName: String, val doneSets: Int, val totalSets: Int)

/**
 * Lo que muestra la actividad del entrenamiento en curso (notificación en Android, Live Activity en
 * iOS). Puerto de `WorkoutActivityAttributes.ContentState`.
 */
data class WorkoutActivityContent(
    /**
     * El ejercicio en el que estás: el primero que todavía tiene series sin marcar. Cuando no queda
     * ninguno, es null y la actividad muestra que terminaste.
     */
    val exerciseName: String?,
    val setNumber: Int,
    val setsInExercise: Int,
    val completedSets: Int,
    val totalSets: Int,
    val volumeKg: Double,
) {
    val progress: Double
        get() = if (totalSets > 0) minOf(1.0, completedSets.toDouble() / totalSets) else 0.0

    /** "Serie 2 de 4" — o el ejercicio terminado. */
    val setLabel: String
        get() =
            if (exerciseName != null && setsInExercise > 0) "Serie $setNumber de $setsInExercise"
            else "Terminaste"
}

object WorkoutActivityState {
    fun contenido(ejercicios: List<WorkoutProgress>, volumeKg: Double): WorkoutActivityContent {
        val actual = ejercicios.firstOrNull { it.doneSets < it.totalSets }

        return WorkoutActivityContent(
            exerciseName = actual?.exerciseName,
            setNumber = actual?.let { minOf(it.doneSets + 1, it.totalSets) } ?: 0,
            setsInExercise = actual?.totalSets ?: 0,
            completedSets = ejercicios.sumOf { it.doneSets },
            totalSets = ejercicios.sumOf { it.totalSets },
            volumeKg = (volumeKg * 100).roundToInt() / 100.0,
        )
    }
}
