package com.siezagym.app

import com.siezagym.app.Domain.WorkoutActivityState
import com.siezagym.app.Domain.WorkoutProgress
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** La actividad del entrenamiento: qué ejercicio está en curso y cuánto falta. Puerto de `WorkoutActivityTests`. */
class WorkoutActivityTest {
    @Test
    fun elEjercicioEnCursoEsElPrimeroConSeriesSinMarcar() {
        val estado =
            WorkoutActivityState.contenido(
                listOf(
                    WorkoutProgress("Press", doneSets = 4, totalSets = 4),
                    WorkoutProgress("Remo", doneSets = 1, totalSets = 3),
                    WorkoutProgress("Curl", doneSets = 0, totalSets = 3),
                ),
                volumeKg = 1234.567,
            )

        assertEquals("Remo", estado.exerciseName)
        assertEquals(2, estado.setNumber)
        assertEquals(3, estado.setsInExercise)
        assertEquals("Serie 2 de 3", estado.setLabel)
        assertEquals(5, estado.completedSets)
        assertEquals(10, estado.totalSets)
        assertEquals(1234.57, estado.volumeKg, 0.001)
    }

    @Test
    fun conTodoMarcadoNoHayEjercicioEnCurso() {
        val estado =
            WorkoutActivityState.contenido(
                listOf(WorkoutProgress("Press", doneSets = 3, totalSets = 3)),
                volumeKg = 0.0,
            )

        assertNull(estado.exerciseName)
        assertEquals("Terminaste", estado.setLabel)
        assertEquals(1.0, estado.progress, 0.0)
    }

    @Test
    fun sinSeriesCargadasElProgresoEsCeroYNoDividePorCero() {
        val estado = WorkoutActivityState.contenido(emptyList(), volumeKg = 0.0)

        assertEquals(0.0, estado.progress, 0.0)
        assertEquals(0, estado.totalSets)
        assertNull(estado.exerciseName)
    }

    @Test
    fun elProgresoEsLaFraccionDeSeriesMarcadas() {
        val estado =
            WorkoutActivityState.contenido(
                listOf(
                    WorkoutProgress("Press", doneSets = 2, totalSets = 4),
                    WorkoutProgress("Remo", doneSets = 0, totalSets = 4),
                ),
                volumeKg = 0.0,
            )

        assertEquals(0.25, estado.progress, 0.0)
    }

    /** Un ejercicio al que le agregaron series después de marcarlas todas no puede pasar del total. */
    @Test
    fun laSerieEnCursoNuncaPasaDelTotalDelEjercicio() {
        val estado =
            WorkoutActivityState.contenido(
                listOf(WorkoutProgress("Press", doneSets = 9, totalSets = 4)),
                volumeKg = 0.0,
            )

        assertNull(estado.exerciseName)
        assertEquals(1.0, estado.progress, 0.0)
    }
}
