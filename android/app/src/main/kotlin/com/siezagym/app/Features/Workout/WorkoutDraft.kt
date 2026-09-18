package com.siezagym.app.Features.Workout

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.LoggedSet
import com.siezagym.app.Models.Routine
import java.time.Instant
import kotlin.math.max

/** Una serie en curso, mientras se entrena: mutable porque se va tildando. */
data class SetDraft(
    var weight: Double = 0.0,
    var reps: Int = 10,
    var rir: Int? = null,
    var failed: Boolean = false,
    var done: Boolean = false,
)

/** Un ejercicio en curso, con la serie que el usuario va completando. */
data class ExerciseDraft(
    val id: String,
    val exerciseID: String,
    val name: String,
    val isTimeBased: Boolean,
    var sets: List<SetDraft>,
) {
    val completedCount: Int get() = sets.count { it.done }
}

/** Lo que el usuario va cargando durante el entrenamiento, antes de guardarlo.
 *  Solo las series marcadas como hechas terminan en Firestore: una serie con
 *  números escritos pero sin tildar es una intención, no un dato. */
class WorkoutDraft(
    val routine: Routine?,
    val startedAt: Instant,
    var exercises: List<ExerciseDraft>,
) {
    val completedSets: Int get() = exercises.sumOf { it.completedCount }

    val totalSets: Int get() = exercises.sumOf { it.sets.size }

    val volumeKg: Double get() =
        exercises.sumOf { exercise ->
            exercise.sets
                .filter { it.done && !it.failed }
                .sumOf { it.weight * it.reps }
        }

    val canSave: Boolean get() = completedSets > 0

    /** Construye el borrador desde la rutina y el catálogo, como en iOS. */
    constructor(routine: Routine?, catalog: Map<String, Exercise>) : this(
        routine = routine,
        startedAt = Instant.now(),
        exercises = (routine?.exercises ?: emptyList()).map { item ->
            val exercise = catalog[item.exerciseID]
            // Si el coach prescribió series una por una se respetan; si no, se
            // arman targetSets series iguales con el objetivo del plan.
            val sets = item.sets?.takeIf { it.isNotEmpty() }?.map {
                SetDraft(weight = it.weight ?: 0.0, reps = it.reps, rir = it.rir)
            } ?: (0 until max(1, item.targetSets)).map {
                SetDraft(weight = item.targetWeight ?: 0.0, reps = item.targetReps, rir = item.targetRIR)
            }
            ExerciseDraft(
                id = item.id,
                exerciseID = item.exerciseID,
                name = exercise?.nameEs ?: item.exerciseID,
                isTimeBased = exercise?.registrationType?.isTimeBased ?: false,
                sets = sets,
            )
        },
    )

    fun addSet(exerciseID: String) {
        val index = exercises.indexOfFirst { it.id == exerciseID }
        if (index == -1) return
        // La serie nueva copia la última cargada: en el gimnasio casi siempre se
        // repite peso y reps, y así es un toque en vez de dos campos.
        val previous = exercises[index].sets.lastOrNull()
        exercises[index] = exercises[index].copy(
            sets = exercises[index].sets + SetDraft(
                weight = previous?.weight ?: 0.0,
                reps = previous?.reps ?: 10,
                rir = previous?.rir,
            ),
        )
    }

    /** Lo que efectivamente se guarda: solo los ejercicios con series hechas. */
    fun loggedExercises(): List<LoggedExercise> =
        exercises.mapNotNull { exercise ->
            val done = exercise.sets.filter { it.done }
            if (done.isEmpty()) return@mapNotNull null
            LoggedExercise(
                exerciseID = exercise.exerciseID,
                sets = done.mapIndexed { index, set ->
                    LoggedSet(
                        setNumber = index + 1,
                        weight = set.weight,
                        reps = set.reps,
                        rir = set.rir,
                        failed = set.failed,
                    )
                },
            )
        }
}