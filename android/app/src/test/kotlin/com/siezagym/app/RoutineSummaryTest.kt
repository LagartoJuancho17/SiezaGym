package com.siezagym.app

import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.RoutineExercise
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RoutineSummaryTest {
    private fun routine(vararg items: RoutineExercise): Routine = Routine(
        id = "r1",
        ownerID = "u1",
        name = "Test",
        note = "",
        exercises = items.toList(),
        showOnHome = true,
        lastUsedAt = null,
        createdAt = null,
        updatedAt = null,
        isAssigned = false,
    )

    private fun item(id: String, sets: Int, reps: Int = 10): RoutineExercise = RoutineExercise(
        exerciseID = id,
        source = RoutineExercise.Source.CATALOG,
        order = 0,
        targetSets = sets,
        targetReps = reps,
        targetRIR = null,
        targetWeight = null,
        techniqueNote = "",
        sets = null,
    )

    private fun exercise(id: String, muscles: Map<MuscleGroup, Double>, time: Boolean = false): Exercise = Exercise(
        id = id,
        nameEs = id,
        nameEn = id,
        equipment = null,
        pattern = null,
        muscleWeights = muscles,
        registrationType = if (time) RegistrationType.TIEMPO else RegistrationType.PESO_REPS,
        unilateral = false,
        descriptionEs = "",
        mediaUrl = null,
        source = ExerciseSource.CATALOG,
    )

    @Test
    fun sumaLasSeriesObjetivo() {
        assertEquals(7, routine(item("a", sets = 3), item("b", sets = 4)).totalSets)
    }

    @Test
    fun estimaLaDuracionCon40sDeTrabajoY75sDeDescanso() {
        // 3 series × (40 + 75) = 345 s = 5.75 min -> 6.
        assertEquals(6, RoutineSummary.estimatedMinutes(routine(item("a", sets = 3)), emptyMap()))
    }

    @Test
    fun enUnEjercicioDeTiempoTargetRepsSonSegundosDeTrabajo() {
        val catalog = mapOf("plancha" to exercise("plancha", muscles = mapOf(MuscleGroup.ABDOMEN to 1.0), time = true))
        // 2 series × (60 + 75) = 270 s = 4.5 min -> 5 (redondeo hacia arriba).
        assertEquals(5, RoutineSummary.estimatedMinutes(routine(item("plancha", sets = 2, reps = 60)), catalog))
    }

    @Test
    fun elRepartoMuscularNormalizaAUno() {
        val catalog = mapOf(
            "press" to exercise("press", muscles = mapOf(MuscleGroup.PECHO to 0.6, MuscleGroup.TRICEPS to 0.4)),
            "remo" to exercise("remo", muscles = mapOf(MuscleGroup.DORSAL to 1.0)),
        )
        val shares = RoutineSummary.muscleDistribution(
            routine(item("press", sets = 3), item("remo", sets = 3)),
            catalog,
        )
        assertTrue(kotlin.math.abs(shares.sumOf { it.pct } - 1) < 0.001)
        assertEquals(MuscleGroup.DORSAL, shares.first().muscle)
    }

    @Test
    fun unaRutinaSinEjerciciosDelCatalogoNoReparteNada() {
        assertTrue(RoutineSummary.muscleDistribution(routine(item("x", sets = 3)), emptyMap()).isEmpty())
    }
}