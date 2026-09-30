package com.siezagym.app

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Features.Routines.RoutineComposerScreen
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * El armador de rutinas contra la misma validación que el repositorio: si acá
 * acepta algo que la web rechaza, se descubre guardando y no antes.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class RoutineComposerTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    private fun prescrito(ejercicio: String) =
        RoutineDraftExercise(exerciseID = ejercicio, source = ExerciseSource.CATALOG)

    @Test
    fun guardaConNombreYAlMenosUnEjercicio() {
        val guardados = mutableListOf<Triple<String, String, List<RoutineDraftExercise>>>()
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    RoutineComposerScreen(
                        data = GymData(hasLoaded = true),
                        onGuardar = { nombre, nota, ejercicios ->
                            guardados += Triple(nombre, nota, ejercicios)
                        },
                    )
                }
            }
        }

        // Sin nombre: el error se ve en la pantalla, no se guarda nada.
        compose.onNodeWithText("Guardar").performClick()
        compose.waitForIdle()
        assertTrue(guardados.isEmpty())
        compose.onNodeWithText("Ponele un nombre a la rutina.").assertIsDisplayed()

        // Con nombre pero sin ejercicios, pasa lo mismo.
        compose.onNodeWithText("Nombre de la rutina").performTextInput("Fuerza")
        compose.onNodeWithText("Guardar").performClick()
        compose.waitForIdle()
        assertTrue(guardados.isEmpty())
        compose.onNodeWithText("Agregá al menos un ejercicio.").assertIsDisplayed()
    }

    @Test
    fun laPrescripcionSeEditaSeriePorSerie() {
        val rutina =
            Routine.fromFirestore(
                "r",
                mapOf(
                    "name" to "Fuerza",
                    "exercises" to
                        listOf(
                            mapOf(
                                "exerciseId" to "press",
                                "targetSets" to 2,
                                "targetReps" to 8,
                                "targetWeight" to 40.0,
                            )
                        ),
                ),
            )
        var guardado: List<RoutineDraftExercise>? = null
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    RoutineComposerScreen(
                        data = GymData(hasLoaded = true),
                        routine = rutina,
                        onGuardar = { _, _, ejercicios -> guardado = ejercicios },
                    )
                }
            }
        }

        // Abrir el ejercicio y prescribir cada serie por separado.
        compose.onNodeWithText("2 × 8").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Prescribir cada serie por separado").performClick()
        compose.waitForIdle()

        compose
            .onNodeWithContentDescription("Reps de la serie 1")
            .performScrollTo()
            .performTextClearance()
        compose.onNodeWithContentDescription("Reps de la serie 1").performTextInput("6")
        compose.waitForIdle()

        compose.onNodeWithText("Guardar").performClick()
        compose.waitForIdle()

        val items = guardado!!
        assertEquals(1, items.size)
        assertTrue("esperaba la serie detallada", items[0].esDetallada)
        assertEquals(2, items[0].cantidadSeries)
        assertEquals(6, items[0].sets!![0].reps)
        // Editar una serie no toca las otras: la segunda sigue en 8.
        assertEquals(8, items[0].sets!![1].reps)
    }

    @Test
    fun editarArrancaConLoQueHabiaGuardado() {
        val rutina =
            Routine.fromFirestore(
                "r",
                mapOf(
                    "name" to "Pierna",
                    "note" to "Sinience antes de entrenar",
                    "exercises" to
                        listOf(
                            mapOf("exerciseId" to "sentadilla", "targetSets" to 4, "targetReps" to 6),
                            mapOf(
                                "exerciseId" to "peso_muerto",
                                "targetSets" to 3,
                                "targetReps" to 5,
                                "group" to "Fuerza",
                                "groupColor" to "amber",
                            ),
                        ),
                ),
            )
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    RoutineComposerScreen(
                        data = GymData(hasLoaded = true),
                        routine = rutina,
                        onGuardar = { _, _, _ -> },
                    )
                }
            }
        }
        compose.onNodeWithText("Pierna").assertIsDisplayed()
        compose.onNodeWithText("Sinience antes de entrenar").assertIsDisplayed()
        compose.onNodeWithText("4 × 6").assertIsDisplayed()
        // El bloque se lee con su color y su rótulo en mayúsculas.
        compose.onNodeWithText("FUERZA").assertIsDisplayed()
    }
}
