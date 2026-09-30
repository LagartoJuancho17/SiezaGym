package com.siezagym.app

import androidx.activity.ComponentActivity
import androidx.compose.runtime.Composable
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.AuthMode
import com.siezagym.app.Domain.CodigoMFA
import com.siezagym.app.Features.Auth.*
import com.siezagym.app.Services.MFAHost
import com.siezagym.app.Services.MFAService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * El formulario de acceso. Lo que se mira es la regla del segundo factor: con la contraseña
 * correcta y sin el código, la app sigue afuera, y el botón de enviar no se prende antes de que
 * el formulario esté completo.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PantallaCodigoTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    private val desafio = MFAService.Desafio(id = "d1", venceEnSegundos = 600, porConsola = false)

    @Composable
    private fun Pantalla(
        form: AuthForm = AuthForm(email = "gym@sieza.com", password = "clave123"),
        auth: MFAHost = FakeAuth(),
        onCerrar: () -> Unit = {},
    ) {
        SiezaTheme(Theme.porDefecto) {
            Backdrop { PantallaCodigo(desafio, form, auth, onCerrar) }
        }
    }

    @Test
    fun seVeElDesafioYElBotonArrancaApagado() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("SEGUNDO PASO").assertIsDisplayed()
        compose.onNodeWithText("Revisá tu mail").assertIsDisplayed()
        // El mail es al que se mandó el código, no cualquier otro.
        compose.onNodeWithText("Te mandamos un código de 6 números a gym@sieza.com.").assertIsDisplayed()
        compose.onNodeWithText("Entrar").assertIsNotEnabled()
    }

    @Test
    fun conSeisNumerosElBotonSePrende() {
        compose.setContent { Pantalla() }
        compose.onNodeWithContentDescription("Código de 6 números").performTextInput("123456")
        compose.waitForIdle()
        compose.onNodeWithText("Entrar").assertIsEnabled()
    }

    @Test
    fun conCincoElBotonSigueApagado() {
        compose.setContent { Pantalla() }
        compose.onNodeWithContentDescription("Código de 6 números").performTextInput("12345")
        compose.waitForIdle()
        compose.onNodeWithText("Entrar").assertIsNotEnabled()
    }

    @Test
    fun conUnCodigoIncorrectoLosCasillerosSeLimpian() {
        compose.setContent { Pantalla(auth = FakeAuth(entra = false)) }
        compose.onNodeWithContentDescription("Código de 6 números").performTextInput("000000")
        compose.waitForIdle()
        // El campo real queda vacío: repetir a ciegas los mismos seis números no sirve de nada.
        compose.onNodeWithContentDescription("Código de 6 números").assertTextEquals("")
        compose.onNodeWithText("Entrar").assertIsNotEnabled()
    }

    @Test
    fun elCodigoDelMailSeAceptaPegadoEntero() {
        compose.setContent { Pantalla() }
        // El usuario copia el texto del mail, no los seis números sueltos.
        compose.onNodeWithContentDescription("Código de 6 números").performTextInput("Tu código es 123456")
        compose.waitForIdle()
        // El campo real se queda con los dígitos: lo que sobraba no se guarda.
        compose.onNodeWithContentDescription("Código de 6 números").assertTextEquals("123456")
    }

    @Test
    fun cerrarVuelveAlFormulario() {
        var cerrado = false
        compose.setContent { Pantalla(onCerrar = { cerrado = true }) }
        compose.onNodeWithText("Volver").performClick()
        compose.waitForIdle()
        assertTrue(cerrado)
    }

    @Test
    fun elServidorSinCorreoSeAvisa() {
        compose.setContent {
        SiezaTheme(Theme.porDefecto) {
            Backdrop {
                PantallaCodigo(
                    desafio.copy(porConsola = true),
                    AuthForm(email = "gym@sieza.com", password = "clave123"),
                    FakeAuth(),
                ) {}
            }
        }
        }
        compose
            .onNodeWithText("El servidor no tiene correo configurado: el código quedó en su log.")
            .assertIsDisplayed()
    }
}

/**
 * Un doble con la misma forma que `AuthService` para lo que la pantalla toca. No se instancia el
 * servicio real porque eso pide una sesión de Firebase.
 */
private class FakeAuth(
    private val entra: Boolean = true,
) : MFAHost {
    override val isWorking: StateFlow<Boolean> = MutableStateFlow(false)
    override val errorMessage: StateFlow<String?> = MutableStateFlow<String?>(null)
    override suspend fun pedirCodigo(form: AuthForm): MFAService.Desafio? = null
    override suspend fun entrarConCodigo(desafio: String, codigo: CodigoMFA): Boolean = entra
    override fun clearError() {}
}

/** El formulario decide si el botón se prende, sin pantalla y sin red. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class AuthFormTest {
    @Test
    fun conEmailYPasswordSePuedeEnviar() {
        assertTrue(AuthForm(email = "gym@sieza.com", password = "clave123").puedeEnviar)
    }

    @Test
    fun sinEmailNoSePuedeEnviar() {
        assertFalse(AuthForm(email = "sieza.com", password = "clave123").puedeEnviar)
        assertFalse(AuthForm(email = "", password = "clave123").puedeEnviar)
    }

    @Test
    fun laPasswordCortaNoAlcanza() {
        assertFalse(AuthForm(email = "gym@sieza.com", password = "12345").puedeEnviar)
    }

    @Test
    fun alCrearCuentaHayQueRepetirLaPassword() {
        val form = AuthForm(modo = AuthMode.CREAR, email = "a@b.com", password = "clave123", repetir = "otra")
        assertFalse(form.puedeEnviar)
        assertEquals("Las dos contraseñas no coinciden.", form.problema)
        assertTrue(form.copy(repetir = "clave123").puedeEnviar)
    }

    @Test
    fun cambiarDePestanaLimpiaLasPasswordsYNoElEmail() {
        val form =
            AuthForm(
                modo = AuthMode.ENTRAR,
                email = "gym@sieza.com",
                password = "clave123",
                repetir = "clave123",
            )
        val creado = form.cambiarA(AuthMode.CREAR)
        assertEquals("", creado.password)
        assertEquals("", creado.repetir)
        // El email es el mismo de todos modos: volver a escribirlo es la parte molesta.
        assertEquals("gym@sieza.com", creado.email)
    }

    @Test
    fun elCodigoSeLimpiaYSeCortaEnSeis() {
        assertEquals("123456", CodigoMFA("12 34 56").digitos)
        assertEquals("123456", CodigoMFA("1234567").digitos)
        assertEquals(6, CodigoMFA.limpiar("a1b2c3d4e5f6").length)
        assertEquals("", CodigoMFA("sin números").digitos)
        assertEquals(1, CodigoMFA("12345").faltan)
        assertTrue(CodigoMFA("123456").completo)
    }
}
