package com.siezagym.app.Domain

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource

/** Estado editable de una rutina nueva. Mantiene la misma forma que el
 *  formulario web, pero sin depender de Compose ni de Firebase. */
data class RoutineDraftExercise(
    val exerciseID: String,
    val source: ExerciseSource,
    var targetSets: Int,
    var targetReps: Int,
    var targetRIR: Int?,
    var targetWeight: Double?,
    var techniqueNote: String,
) {
    companion object {
        fun fromExercise(exercise: Exercise): RoutineDraftExercise = RoutineDraftExercise(
            exerciseID = exercise.id,
            source = exercise.source,
            targetSets = 3,
            targetReps = if (exercise.registrationType.isTimeBased) 30 else 10,
            targetRIR = null,
            targetWeight = null,
            techniqueNote = "",
        )
    }

    /** Serialización compatible con `sanitizeExercises` de la web. */
    fun firestoreValue(order: Int): Map<String, Any?> = mapOf(
        "exerciseId" to exerciseID,
        "exerciseSource" to source.raw,
        "order" to order,
        "targetSets" to targetSets,
        "targetReps" to targetReps,
        "targetRIR" to targetRIR,
        "targetWeight" to targetWeight,
        "techniqueNote" to techniqueNote.trim(),
        "sets" to null,
    )
}

sealed class RoutineDraftValidation : IllegalArgumentException() {
    data object MissingName : RoutineDraftValidation() {
        private fun readResolve(): Any = MissingName
        override val message: String get() = "Poné un nombre a la rutina."
    }
    data object MissingExercises : RoutineDraftValidation() {
        private fun readResolve(): Any = MissingExercises
        override val message: String get() = "Agregá al menos un ejercicio."
    }

    companion object {
        fun validate(name: String, exercises: List<RoutineDraftExercise>) {
            require(name.isNotBlank()) { MissingName.message }
            require(exercises.isNotEmpty()) { MissingExercises.message }
        }
    }
}