package com.siezagym.app

import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.RoutineDraftValidation
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.RegistrationType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class RoutineDraftTest {
    private fun exercise(id: String = "press", timeBased: Boolean = false, source: ExerciseSource = ExerciseSource.CATALOG): Exercise =
        Exercise(
            id = id,
            nameEs = id,
            nameEn = id,
            equipment = null,
            pattern = null,
            muscleWeights = emptyMap(),
            registrationType = if (timeBased) RegistrationType.TIEMPO else RegistrationType.PESO_REPS,
            unilateral = false,
            descriptionEs = "",
            mediaUrl = null,
            source = source,
        )

    @Test
    fun lasRutinasEmpiezanCon3SeriesY10Reps() {
        val draft = RoutineDraftExercise.fromExercise(exercise())
        assertEquals(3, draft.targetSets)
        assertEquals(10, draft.targetReps)
        assertNull(draft.targetRIR)
        assertEquals(ExerciseSource.CATALOG, draft.source)
    }

    @Test
    fun losEjerciciosDeTiempoEmpiezanCon30Segundos() {
        assertEquals(30, RoutineDraftExercise.fromExercise(exercise(timeBased = true)).targetReps)
    }

    @Test
    fun laSerializacionConservaElOrdenElOrigenYLosCamposOpcionales() {
        val draft = RoutineDraftExercise.fromExercise(exercise("plancha", source = ExerciseSource.CUSTOM)).apply {
            targetSets = 4
            targetReps = 45
            targetRIR = 2
            techniqueNote = "  Espalda neutra  "
        }

        val value = draft.firestoreValue(order = 3)
        assertEquals("plancha", value["exerciseId"])
        assertEquals("custom", value["exerciseSource"])
        assertEquals(3, value["order"])
        assertEquals(4, value["targetSets"])
        assertEquals(45, value["targetReps"])
        assertEquals(2, value["targetRIR"])
        assertEquals("Espalda neutra", value["techniqueNote"])
        assertNull(value["sets"])
    }

    @Test
    fun noPermiteGuardarSinNombre() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            RoutineDraftValidation.validate(name = "   ", exercises = listOf(RoutineDraftExercise.fromExercise(exercise())))
        }
        assertEquals("Poné un nombre a la rutina.", error.message)
    }

    @Test
    fun noPermiteGuardarSinEjercicios() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            RoutineDraftValidation.validate(name = "Fuerza", exercises = emptyList())
        }
        assertEquals("Agregá al menos un ejercicio.", error.message)
    }
}