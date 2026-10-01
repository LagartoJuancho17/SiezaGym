package com.siezagym.app

import android.app.Application
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.RoutineSearch
import com.siezagym.app.Features.Home.HomeScreen
import com.siezagym.app.Features.Routines.*
import com.siezagym.app.Features.Shared.*
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = Application::class, qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScreenInteractionTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun homeShowsWeekAndGoalsThenStartsTheFeaturedRoutine() {
        val routine = Routine.fromFirestore("routine", mapOf("name" to "Tren superior"))
        var started: Routine? = null
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    HomeScreen(GymData(routines = listOf(routine), hasLoaded = true)) {
                        started = it
                    }
                    BottomNav(
                        AppTab.HOME,
                        {},
                        Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
                    )
                }
            }
        }
        // "Hoy toca" nombra la rutina y el play arranca lo que toca. El mismo
        // nombre vuelve abajo, en la lista de rutinas.
        compose.onAllNodesWithText("Tren superior").assertCountEquals(2)
        compose.onNodeWithContentDescription("Empezar entrenamiento").performClick()
        assertEquals(routine, started)
        capture("home")
        // La semana, los objetivos y las rutinas van más abajo en la misma pantalla.
        compose.onNodeWithText("Tus objetivos").performScrollTo().assertIsDisplayed()
        // "Esta semana" dice dos veces: el rótulo de la semana y la tarjeta de volumen.
        compose.onAllNodesWithText("Esta semana").assertCountEquals(2)
        compose.onNodeWithTag("home-goals").performScrollTo()
        compose.onNodeWithText("Calorías").assertIsDisplayed()
        compose.onNodeWithTag("home-goals").performTouchInput { swipeLeft() }
        compose.onNodeWithText("Series").assertIsDisplayed()
        capture("home-goals")
        compose.onNodeWithText("Las rutinas").performScrollTo().assertIsDisplayed()
    }

    /** Sin rutina destacada el botón igual sirve: entra entrenamiento libre. */
    @Test
    fun homeWithoutRoutinesStartsAFreeWorkout() {
        var libres = 0
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop { HomeScreen(GymData(hasLoaded = true)) { if (it == null) libres++ } }
            }
        }
        compose.onNodeWithText("entrenar libre").assertIsDisplayed()
        compose.onNodeWithContentDescription("Empezar entrenamiento").performClick()
        assertEquals(1, libres)
        compose.onNodeWithText("Todavía no tenés rutinas.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun bottomNavigationSelectsTheRequestedTab() {
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                var selected by remember { mutableStateOf(AppTab.HOME) }
                BottomNav(selected, { selected = it })
            }
        }
        compose
            .onNodeWithContentDescription("Inicio")
            .assertIsSelected()
            .assertWidthIsEqualTo(145.dp)
        compose.onNodeWithContentDescription("Historial").assertWidthIsEqualTo(44.dp)
        compose.onNodeWithContentDescription("Historial").performClick().assertIsSelected()
        compose.onNodeWithContentDescription("Inicio").assertIsNotSelected()
    }

    /** Progreso dejó de ser una pestaña: son cinco pantallas dentro de Perfil. */
    @Test
    fun bottomNavigationHasFourSectionsAndNoProgress() {
        assertEquals(
            listOf(AppTab.HOME, AppTab.ROUTINES, AppTab.HISTORY, AppTab.PROFILE),
            AppTab.entries.toList(),
        )
    }

    @Test
    fun routineDetailShowsTheSeriesAndStartsTheSelectedPlan() {
        val routine =
            Routine.fromFirestore(
                "routine",
                mapOf(
                    "name" to "Fuerza",
                    "exercises" to
                        listOf(
                            mapOf(
                                "exerciseId" to "press",
                                "targetSets" to 3,
                                "targetReps" to 8,
                                "targetWeight" to 40,
                                "group" to "Fuerza",
                            )
                        ),
                ),
            )
        var started = false
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop { RoutineDetailScreen(routine, GymData()) { started = true } }
            }
        }
        // El grupo y el resumen colapsado están a la vista; la grilla no.
        compose.onNodeWithText("FUERZA").assertIsDisplayed()
        compose.onNodeWithText("3 × 8").assertIsDisplayed()
        compose.onNodeWithText("40 kg").assertDoesNotExist()

        // Tocado el ejercicio, aparecen las series una por una.
        compose.onNodeWithText("3 × 8").performClick()
        compose.onNodeWithText("Reps").assertIsDisplayed()
        // Tres series, las tres con 40 kg.
        compose.onAllNodesWithText("40 kg").assertCountEquals(3)

        compose.onNodeWithText("Comenzar entrenamiento").performClick()
        assertTrue(started)
        capture("routine-detail")
    }

    /** Buscando deja de agrupar por semana: manda el nombre. */
    @Test
    fun routinesSearchIgnoresAccentsAndCase() {
        assertTrue(RoutineSearch.coincide("Pectoral", "pecto"))
        assertTrue(RoutineSearch.coincide("Pectoral", "PECTORAL"))
        assertFalse(RoutineSearch.coincide("Pectoral", "espalda"))
        assertTrue(RoutineSearch.coincide("Pectoral", "  "))
    }

    private fun capture(name: String) {
        compose.runOnIdle {
            val view = compose.activity.window.decorView
            val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.draw(Canvas(bitmap))
            val directory = File("build/reports/screenshots").apply { mkdirs() }
            File(directory, "$name.png").outputStream().use { stream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            bitmap.recycle()
        }
    }
}
