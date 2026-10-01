package com.siezagym.app

import android.app.Application
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Features.Shared.*
import com.siezagym.app.Models.*
import com.siezagym.app.Services.*
import java.io.File
import java.time.Instant
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
class AccountNavigationTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()
    private val session =
        WorkoutSession.fromFirestore(
            "session",
            mapOf(
                "routineName" to "Fuerza",
                "finishedAt" to Instant.now(),
                "durationSeconds" to 1800,
                "totalSetsCompleted" to 2,
                "totalVolumeKg" to 400,
                "exercises" to
                    listOf(
                        mapOf(
                            "exerciseId" to "press",
                            "sets" to
                                listOf(
                                    mapOf("setNumber" to 1, "weight" to 40, "reps" to 10),
                                    mapOf(
                                        "setNumber" to 2,
                                        "weight" to 50,
                                        "reps" to 5,
                                        "failed" to true,
                                    ),
                                ),
                        )
                    ),
            ),
        )
    private val data =
        GymData(
            profile = UserProfile.fromFirestore("test", mapOf("displayName" to "Atleta de prueba")),
            sessions = listOf(session),
            catalog =
                mapOf(
                    "press" to Exercise.fromRawValue("press", mapOf("nameEs" to "Press de banca"))
                ),
            hasLoaded = true,
        )

    private fun show(data: GymData = this.data) {
        compose.setContent {
            val themes = rememberThemeStore()
            SiezaTheme(themes) {
                Backdrop {
                    val nav = rememberNavController()
                    val entry by nav.currentBackStackEntryAsState()
                    val active =
                        AppTab.entries.firstOrNull { tab ->
                            entry?.destination?.hierarchy?.any { it.route == tab.name } == true
                        } ?: AppTab.HOME
                    NavHost(nav, startDestination = "start") {
                        composable("start") { Text("Inicio de prueba") }
                        accountDestinations(nav, data, {}, {}, {})
                    }
                    BottomNav(
                        active,
                        { tab ->
                            nav.navigate(tab.name) {
                                popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
                    )
                }
            }
        }
    }

    @Test
    fun lowerTabsOpenProfileHistoryAndSessionWithoutUnboundedScroll() {
        show()
        compose.onNodeWithContentDescription("Perfil").performClick()
        compose.onNodeWithText("Atleta de prueba").assertIsDisplayed()
        capture("profile-design2")
        compose.onNodeWithText("Cerrar sesión").performScrollTo().assertIsDisplayed()
        compose.onNodeWithContentDescription("Historial").performClick()
        compose.onNodeWithText("Tu actividad").assertIsDisplayed()
        compose.onNodeWithText("Fuerza").assertIsDisplayed()
        capture("history-design2")
        compose.onNodeWithText("Fuerza").performClick()
        compose.onNodeWithText("Serie 1").assertIsDisplayed()
        compose.onNodeWithText("sin marca").assertIsDisplayed()
        capture("session-design2")
        compose.onNodeWithContentDescription("Volver").performClick()
        compose.onNodeWithText("Tu actividad").assertIsDisplayed()
        compose.onNodeWithContentDescription("Perfil").performClick()
        compose.onNodeWithText("Cerrar sesión").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun everyProgressCardHasAWorkingDestinationAndBack() {
        show()
        compose.onNodeWithContentDescription("Perfil").performClick()
        listOf("Volumen", "Días entrenados", "Músculos", "Empuje y tracción", "Por ejercicio")
            .forEach { label ->
                compose.onNodeWithText(label).performScrollTo().performClick()
                compose.onNodeWithContentDescription("Volver").assertIsDisplayed()
                if (label == "Por ejercicio")
                    compose.onNodeWithText("Press de banca").assertIsDisplayed()
                compose.onNodeWithContentDescription("Volver").performClick()
                compose.onNodeWithText(label).assertExists()
            }
    }

    @Test
    fun emptyAccountsCanOpenBothLowerTabs() {
        show(GymData(hasLoaded = true))
        compose.onNodeWithContentDescription("Historial").performClick()
        compose.onNodeWithText("Todavía no terminaste ningún entrenamiento.").assertIsDisplayed()
        compose.onNodeWithContentDescription("Perfil").performClick()
        compose.onNodeWithText("Sin nombre").assertIsDisplayed()
        compose.onNodeWithText("Cerrar sesión").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun selectingThemeInProfileUpdatesTheRootImmediately() {
        var current = ""
        compose.setContent {
            val themes = rememberThemeStore()
            SiezaTheme(themes) {
                val activeTheme = tema
                SideEffect { current = activeTheme.id }
                Backdrop {
                    Pantalla("Perfil") {
                        com.siezagym.app.Features.Profile.ProfileScreen(data, {}, {}) {}
                    }
                }
            }
        }
        compose.onNodeWithText("Plata").performScrollTo().performClick()
        compose.runOnIdle { assertEquals("plata", current) }
        capture("profile-plata")
    }

    @Test
    fun signedOutNeverMountsPrivateScreensAndSignOutDisposesThem() {
        var state by mutableStateOf<AuthService.State>(AuthService.State.Loading)
        var privateMounted = false
        compose.setContent {
            SiezaTheme(Theme.porDefecto) {
                SessionGate(
                    state,
                    signedOut = { Text("Iniciar sesión") },
                    signedIn = {
                        DisposableEffect(it.uid) {
                            privateMounted = true
                            onDispose { privateMounted = false }
                        }
                        Text("Cuenta autenticada")
                    },
                )
            }
        }
        compose.runOnIdle {
            assertFalse(privateMounted)
            state = AuthService.State.SignedOut
        }
        compose.onNodeWithText("Iniciar sesión").assertIsDisplayed()
        compose.runOnIdle {
            assertFalse(privateMounted)
            state = AuthService.State.SignedIn("test", null)
        }
        compose.onNodeWithText("Cuenta autenticada").assertIsDisplayed()
        compose.runOnIdle {
            assertTrue(privateMounted)
            state = AuthService.State.SignedOut
        }
        compose.onNodeWithText("Iniciar sesión").assertIsDisplayed()
        compose.runOnIdle { assertFalse(privateMounted) }
    }

    private fun capture(name: String) {
        compose.runOnIdle {
            val view = compose.activity.window.decorView
            val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.draw(Canvas(bitmap))
            val directory = File("build/reports/screenshots").apply { mkdirs() }
            File(directory, "$name.png").outputStream().use {
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
            }
            bitmap.recycle()
        }
    }
}
