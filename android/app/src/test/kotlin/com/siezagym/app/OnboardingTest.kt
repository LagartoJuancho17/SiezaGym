package com.siezagym.app

import androidx.activity.ComponentActivity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Features.Onboarding.OnboardingFlow
import com.siezagym.app.Features.Onboarding.OnboardingPage
import com.siezagym.app.Features.Onboarding.OnboardingScreen
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * El recorrido de bienvenida. Lo importante es la regla del botón: "Continuar" en la última
 * pantalla es el único que cierra, y atrás no hace nada en la primera.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class OnboardingTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    private var flow by mutableStateOf(OnboardingFlow.primera)
    private var terminado = false

    @androidx.compose.runtime.Composable
    private fun Pantalla() {
        SiezaTheme(Theme.porDefecto) {
            Backdrop { OnboardingScreen(flow = flow, onChange = { flow = it }, onComplete = { terminado = true }) }
        }
    }

    @Test
    fun arrancaEnLasRutinas() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("BIENVENIDO A SIEZAGYM").assertIsDisplayed()
        compose.onNodeWithText("Entrená").assertIsDisplayed()
        compose.onNodeWithText("Continuar").assertIsDisplayed()
        compose.onNodeWithText("Empezar").assertDoesNotExist()
    }

    @Test
    fun continuarAvanzaYNoCierra() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Continuar").performClick()
        compose.waitForIdle()
        assertFalse(terminado)
        compose.onNodeWithText("REGISTRÁ CADA ENTRENO").assertIsDisplayed()
        compose.onNodeWithText("Continuar").assertIsDisplayed()
    }

    @Test
    fun enLaUltimaElBotonEsEmpezarYCierra() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Continuar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Continuar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("MIRÁ TU AVANCE").assertIsDisplayed()
        compose.onNodeWithText("Empezar").assertIsDisplayed()
        compose.onNodeWithText("Empezar").performClick()
        compose.waitForIdle()
        assertTrue(terminado)
    }

    @Test
    fun omitirCierraDesdeLaPrimera() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Omitir").performClick()
        compose.waitForIdle()
        assertTrue(terminado)
    }

    @Test
    fun atrasEnLaPrimeraNoHaceNada() {
        compose.setContent { Pantalla() }
        // Sin historial al que volver: el botón existe pero no hace nada.
        compose.onNodeWithContentDescription("Volver").assertIsNotEnabled()
    }

    @Test
    fun atrasVuelveDeLaSegundaALaPrimera() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Continuar").performClick()
        compose.waitForIdle()
        compose.onNodeWithContentDescription("Volver").assertIsEnabled().performClick()
        compose.waitForIdle()
        compose.onNodeWithText("BIENVENIDO A SIEZAGYM").assertIsDisplayed()
    }
}

/** El recorrido como valor puro: la regla de "sólo la última pantalla cierra", sin pantalla. */
class OnboardingFlowTest {
    @Test
    fun laPrimeraNoTieneAtras() {
        assertFalse(OnboardingFlow.primera.canGoBack)
        assertEquals(OnboardingFlow.primera, OnboardingFlow.primera.goBack())
    }

    @Test
    fun avanzarDosVecesLlegaALUltima() {
        val (segunda, termino) = OnboardingFlow.primera.advance()
        assertFalse(termino)
        assertEquals(OnboardingPage.ENTRENO, segunda.page)
        val (tercera, termino2) = segunda.advance()
        assertFalse(termino2)
        assertTrue(tercera.isLastPage)
        assertEquals(OnboardingPage.PROGRESO, tercera.page)
    }

    @Test
    fun avanzarEnLaUltimaCierra() {
        val (_, termino) = OnboardingFlow.ultima.advance()
        assertTrue(termino)
    }

    @Test
    fun atrasDesdeLaUltimaVuelveALaTercera() {
        assertEquals(OnboardingPage.ENTRENO, OnboardingFlow.ultima.goBack().page)
    }

    @Test
    fun cadaPantallaTraeEyebrowTitularYDetalle() {
        OnboardingPage.entries.forEach { pagina ->
            assertTrue(pagina.eyebrow.isNotBlank())
            assertTrue(pagina.headline.isNotBlank())
            assertTrue(pagina.headlineEmphasis.isNotBlank())
            assertTrue(pagina.detail.isNotBlank())
        }
        // Son tres escenas distintas, no la misma repetida.
        assertEquals(3, OnboardingPage.entries.map { it.detail }.distinct().size)
    }
}
