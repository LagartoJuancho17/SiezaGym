package com.siezagym.app

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Features.Workout.WorkoutScreen
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import com.siezagym.app.Services.GymStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * El entrenamiento en curso contra la pantalla. Lo que se mira es la regla de oro: una serie escrita
 * pero sin tildar no cuenta, y al tildarla arranca el descanso.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class WorkoutScreenTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    private val rutina =
        Routine.fromFirestore(
            "r",
            mapOf(
                "name" to "Fuerza superior",
                "exercises" to
                    listOf(
                        mapOf("exerciseId" to "press", "targetSets" to 2, "targetReps" to 8, "targetWeight" to 40.0),
                        mapOf(
                            "exerciseId" to "remo",
                            "targetSets" to 2,
                            "targetReps" to 10,
                            "group" to "Agarre",
                            "groupColor" to "sky",
                        ),
                    ),
            ),
        )

    private fun pantalla(alVolver: () -> Unit = {}, store: GymStore = GymStore("u")) {
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    WorkoutScreen(rutina, GymData(hasLoaded = true), store, onBack = alVolver)
                }
            }
        }
    }

    @Test
    fun seVeLaRutinaConSuBloqueYLasSeriesPendientes() {
        pantalla()
        compose.onNodeWithText("ENTRENAMIENTO").assertIsDisplayed()
        compose.onNodeWithText("Fuerza superior").assertIsDisplayed()
        // El bloque aparece con su encabezado; los ejercicios sin grupo, lisos.
        compose.onNodeWithText("AGARRE").assertIsDisplayed()
        // Cada ejercicio muestra las suyas y el resumen, las de toda la rutina.
        compose.onAllNodesWithText("0/2").assertCountEquals(2)
        compose.onNodeWithText("0/4").assertIsDisplayed()
        compose.onNodeWithText("Terminar entrenamiento").assertIsDisplayed()
    }

    @Test
    fun marcarUnaSerieArrancaElDescansoYNoDejaTerminarSinSeries() {
        pantalla()
        // Con cero series hechas el botón de terminar está apagado.
        compose.onNodeWithText("Terminar entrenamiento").assertIsNotEnabled()

        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()

        compose.onNodeWithText("DESCANSO").assertIsDisplayed()
        compose.onNodeWithText("01:30").assertIsDisplayed()
        compose.onNodeWithText("1/2").assertIsDisplayed()
        compose.onNodeWithText("Terminar entrenamiento").assertIsEnabled()
    }

    @Test
    fun terminarUnaSerieFalladaLaCuentaParaGuardar() {
        pantalla()
        compose.onNodeWithContentDescription("Serie 1: marcar fallada").performClick()
        compose.waitForIdle()
        // Se levantó pero no se pudo: cuenta como serie hecha, y el descanso también arranca.
        compose.onNodeWithText("1/2").assertIsDisplayed()
        compose.onNodeWithText("DESCANSO").assertIsDisplayed()
    }

    @Test
    fun desmarcarLaSerieVuelveATenerMenosSeriesYApagaElGuardado() {
        pantalla()
        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()
        compose.onNodeWithContentDescription("Serie 1: desmarcar").performClick()
        compose.waitForIdle()
        compose.onAllNodesWithText("0/2").assertCountEquals(2)
        compose.onNodeWithText("0/4").assertIsDisplayed()
        compose.onNodeWithText("Terminar entrenamiento").assertIsNotEnabled()
    }

    @Test
    fun elDescansoSeSalta() {
        pantalla()
        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Saltar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("DESCANSO").assertDoesNotExist()
    }

    @Test
    fun volverDejaElEntrenamientoEnStandbyYLaXPregunta() {
        var salio = false
        val store = GymStore("u")
        pantalla(alVolver = { salio = true }, store = store)
        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()

        compose.onNodeWithContentDescription("Volver").performClick()
        compose.waitForIdle()
        assertEquals(true, salio)
        // Volver no tira lo hecho: la rutina queda en standby para retomarla.
        assertEquals(1, store.activeWorkout?.completedSets)
    }

    @Test
    fun descartarPideConfirmacionYNoGuarda() {
        var salio = false
        val store = GymStore("u")
        pantalla(alVolver = { salio = true }, store = store)
        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()

        compose.onNodeWithContentDescription("Descartar entrenamiento").performClick()
        compose.waitForIdle()
        // La X siempre pregunta: descartar es la única acción que tira series.
        compose.onNodeWithText("¿Descartar entrenamiento?").assertIsDisplayed()
        compose.onNodeWithText("Seguir entrenando").performClick()
        compose.waitForIdle()
        assertEquals(false, salio)

        compose.onNodeWithContentDescription("Descartar entrenamiento").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Descartar y salir").performClick()
        compose.waitForIdle()
        assertEquals(true, salio)
        assertNull(store.activeWorkout)
    }

    @Test
    fun terminarPideConfirmacionConLasCifras() {
        pantalla()
        compose.onNodeWithContentDescription("Serie 1: completar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Terminar entrenamiento").performClick()
        compose.waitForIdle()
        // 40 kg x 8 son 320 kg: la confirmación dice lo que se va a guardar, no un "guardar?".
        compose.onNodeWithText("¿Guardar 1 series y 320 kg?").assertIsDisplayed()
    }
}
