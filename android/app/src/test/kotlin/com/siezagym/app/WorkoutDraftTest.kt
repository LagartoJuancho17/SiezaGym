package com.siezagym.app

import com.siezagym.app.Domain.RoutineGrouping
import com.siezagym.app.Features.Workout.SetDraft
import com.siezagym.app.Features.Workout.WorkoutDraft
import com.siezagym.app.Models.Routine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * El borrador del entrenamiento. Lo importante acá es que sólo se guarden las series marcadas: una
 * serie con números escritos pero sin tildar es una intención, no un dato.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class WorkoutDraftTest {
    private fun rutina(vararg ejercicios: Map<String, Any?>) =
        Routine.fromFirestore(
            "r",
            mapOf("name" to "Fuerza", "exercises" to ejercicios.toList()),
        )

    @Test
    fun sinSeriesMarcadasNoSePuedeGuardar() {
        val draft = WorkoutDraft(rutina(mapOf("exerciseId" to "press", "targetSets" to 3)), emptyMap())
        assertFalse(draft.canSave)
        assertTrue(draft.loggedExercises().isEmpty())
    }

    @Test
    fun laSerieFalladaCuentaComoHechaPeroNoSumaVolumen() {
        val base = WorkoutDraft(rutina(mapOf("exerciseId" to "press", "targetSets" to 1)), emptyMap())
        base.marcarProximaSerie()
        assertTrue(base.canSave)

        val hecha = base.conSeries(0, listOf(SetDraft(weight = 100.0, reps = 5, done = true)))
        assertEquals(500.0, hecha.volumeKg, 0.01)

        // La levantaste pero no la pudiste: cuenta como serie, no como volumen.
        val fallada =
            base.conSeries(
                0,
                listOf(SetDraft(weight = 100.0, reps = 5, done = true, failed = true)),
            )
        assertEquals(0.0, fallada.volumeKg, 0.01)
        assertEquals(1, fallada.completedSets)
    }

    @Test
    fun unEjercicioSinSeriesNoEstaTerminado() {
        val draft = WorkoutDraft(rutina(mapOf("exerciseId" to "press", "targetSets" to 1)), emptyMap())
        // 0 de 0 no es estar terminado: sin esta guarda se pintaría de verde sin haber hecho nada.
        assertFalse(draft.conSeries(0, emptyList()).exercises.first().estaCompleto)
        assertTrue(draft.conSeries(0, listOf(SetDraft(done = true))).exercises.first().estaCompleto)
    }

    @Test
    fun laProximaSerieEsLaPrimeraSinMarcarEnOrden() {
        val draft =
            WorkoutDraft(
                rutina(
                    mapOf("exerciseId" to "press", "targetSets" to 2),
                    mapOf("exerciseId" to "sentadilla", "targetSets" to 2),
                ),
                emptyMap(),
            )
        assertEquals("press", draft.enCurso())
        assertTrue(draft.marcarProximaSerie())
        // La segunda serie del primer ejercicio, todavía en el mismo.
        assertEquals("press", draft.enCurso())
        assertTrue(draft.marcarProximaSerie())
        // Con el primero completo, pasa al siguiente.
        assertEquals("sentadilla", draft.enCurso())
    }

    @Test
    fun marcarSinSeriesPendientesNoAvanza() {
        val draft = WorkoutDraft(rutina(mapOf("exerciseId" to "press", "targetSets" to 1)), emptyMap())
        assertTrue(draft.marcarProximaSerie())
        assertNull(draft.proximaSerieSinMarcar())
        // Sin nada pendiente no hay descanso que arrancar: por eso devuelve false.
        assertFalse(draft.marcarProximaSerie())
    }

    @Test
    fun agregarSerieCopiaLaUltimaCargada() {
        val draft =
            WorkoutDraft(rutina(mapOf("exerciseId" to "press", "targetSets" to 1)), emptyMap())
                .conSeries(0, listOf(SetDraft(weight = 82.5, reps = 6)))
        draft.addSet(draft.exercises.first().id)
        // En el gimnasio la serie nueva repite o sube desde la anterior, nunca arranca vacía.
        assertEquals(2, draft.exercises.first().sets.size)
        assertEquals(82.5, draft.exercises.first().sets[1].weight, 0.001)
        assertEquals(6, draft.exercises.first().sets[1].reps)
    }

    @Test
    fun loQueSeGuardaEsLoMarcadoYRenumerado() {
        val draft =
            WorkoutDraft(
                rutina(
                    mapOf(
                        "exerciseId" to "press",
                        "targetSets" to 3,
                        "sets" to
                            listOf(
                                mapOf("reps" to 10, "weight" to 60.0),
                                mapOf("reps" to 8, "weight" to 70.0),
                                mapOf("reps" to 6, "weight" to 75.0),
                            ),
                    )
                ),
                emptyMap(),
            )
        // Se marcan la primera y la tercera, y la segunda se queda con números pero sin tildar.
        val editado =
            draft.conSeries(
                0,
                listOf(
                    SetDraft(weight = 60.0, reps = 10, done = true),
                    SetDraft(weight = 70.0, reps = 8),
                    SetDraft(weight = 75.0, reps = 6, done = true),
                ),
            )

        val guardados = editado.loggedExercises()
        assertEquals(1, guardados.size)
        assertEquals(2, guardados.first().sets.size)
        // Guardar renumera: la segunda serie marcada queda como serie 2, no como serie 3.
        assertEquals(listOf(1, 2), guardados.first().sets.map { it.setNumber })
        assertEquals(75.0, guardados.first().sets[1].weight, 0.001)
    }

    @Test
    fun losBloquesDeLaRutinaSeAgrupanEnOrden() {
        val draft =
            WorkoutDraft(
                rutina(
                    mapOf("exerciseId" to "a", "targetSets" to 2, "group" to "Fuerza", "groupColor" to "amber"),
                    mapOf("exerciseId" to "b", "targetSets" to 2, "group" to "Fuerza", "groupColor" to "amber"),
                    mapOf("exerciseId" to "c", "targetSets" to 2),
                ),
                emptyMap(),
            )
        val secciones = RoutineGrouping.seccionar(draft.exercises, { it.group }, { it.groupColor })
        assertEquals(2, secciones.size)
        assertEquals("Fuerza", secciones.first().nombreGrupo)
        assertEquals(2, secciones.first().items.size)
        // El ejercicio sin grupo no lleva encabezado.
        assertFalse(secciones.last().agrupada)
    }
}

/** El ejercicio abierto es el de la próxima serie sin marcar. */
private fun WorkoutDraft.enCurso(): String? = exercises.firstOrNull { it.id == ejercicioEnCurso }?.exerciseID

/** Reemplaza las series de un ejercicio, como hacerlas al terminar una. */
private fun WorkoutDraft.conSeries(indice: Int, series: List<SetDraft>): WorkoutDraft =
    WorkoutDraft(
        routine,
        startedAt,
        exercises.toMutableList().apply { this[indice] = this[indice].copy(sets = series) },
    )
