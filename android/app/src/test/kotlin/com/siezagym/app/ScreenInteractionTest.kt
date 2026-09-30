package com.siezagym.app

import android.app.Application
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import com.siezagym.app.DesignSystem.*
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
    fun homeStartsFeaturedRoutineAndRendersAllMetricWidgets() {
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
        compose.onNodeWithText("Tren superior").assertIsDisplayed()
        compose.onNodeWithText("▶  Empezar").performClick()
        assertEquals(routine, started)
        capture("home")
        compose.onNodeWithText("Zonas de intensidad").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun bottomNavigationSelectsTheRequestedTab() {
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                var selected by remember { mutableStateOf(AppTab.HOME) }
                BottomNav(selected, { selected = it })
            }
        }
        compose.onNodeWithContentDescription("Inicio").assertIsSelected()
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
    fun routineDetailStartsTheSelectedPlan() {
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
                            )
                        ),
                ),
            )
        var started = false
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    RoutineDetailScreen(routine, GymData()) { started = true }
                }
            }
        }
        compose.onNodeWithText("3 × 8 reps · 40 kg").assertIsDisplayed()
        compose.onNodeWithText("Empezar entrenamiento").performScrollTo().performClick()
        assertTrue(started)
        capture("routine-detail")
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
