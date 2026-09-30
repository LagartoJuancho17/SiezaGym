package com.siezagym.app

import androidx.activity.ComponentActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.saveable.SaverScope
import com.siezagym.app.Features.Auth.AuthFormSaver
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.AuthMode
import com.siezagym.app.Domain.CodigoMFA
import com.siezagym.app.Features.Auth.LoginScreenBody
import com.siezagym.app.Features.Auth.PantallaCodigo
import com.siezagym.app.Services.MFAService
import com.siezagym.app.Services.MFAHost
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * El login contra la regla del segundo factor, en la pantalla y no sólo en el dominio: con la
 * contraseña se pide el código y la sesión todavía no existe; las pestañas no mezclan formularios.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w390dp-h844dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LoginScreenTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Composable
    private fun Pantalla(auth: MFAHost = FakeLoginAuth()) {
        SiezaTheme(Theme.porDefecto) {
            Backdrop {
                LoginScreenBody(
                    auth = auth,
                    onGoogleIntent = { "Google no está configurado para esta app. Probá con email." },
                )
            }
        }
    }

    @Test
    fun arrancaConElBotonApagado() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Bienvenido de nuevo").assertIsDisplayed()
        compose.onNodeWithText("Ingresar").assertIsNotEnabled()
    }

    @Test
    fun conEmailYPasswordElBotonSePrende() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("tu@email.com").performTextInput("gym@sieza.com")
        compose.onNodeWithContentDescription("Contraseña").performTextInput("clave123")
        compose.waitForIdle()
        compose.onNodeWithText("Ingresar").assertIsEnabled()
    }

    @Test
    fun crearPideNombreYRepeticion() {
        compose.setContent { Pantalla() }
        compose.onNodeWithText("Crear cuenta").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Creá tu cuenta").assertIsDisplayed()
        compose.onNodeWithText("Nombre").assertIsDisplayed()
        compose.onNodeWithText("Repetir contraseña").assertIsDisplayed()
    }

    @Test
    fun passwordsDistintasAvisanAntesDeMandarNada() {
        val auth = FakeLoginAuth()
        compose.setContent { Pantalla(auth) }
        compose.onNodeWithText("Crear cuenta").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Como querés que te llamemos").performTextInput("Valen")
        compose.onNodeWithText("tu@email.com").performTextInput("gym@sieza.com")
        compose.onNodeWithContentDescription("Contraseña").performTextInput("clave123")
        compose.onNodeWithText("La misma de arriba").performTextInput("otra-clave")
        compose.waitForIdle()
        compose.onNodeWithText("Las dos contraseñas no coinciden.").assertIsDisplayed()
        compose.onNodeWithText("Crear mi cuenta").assertIsNotEnabled()
        // No se mandó nada al servidor: el problema es del formulario.
        assertEquals(0, auth.pedidos)
    }

    @Test
    fun conLaPasswordCorrectaSePideElCodigoYNoSeEntraTodavia() {
        val auth = FakeLoginAuth()
        compose.setContent { Pantalla(auth) }
        compose.onNodeWithText("tu@email.com").performTextInput("gym@sieza.com")
        compose.onNodeWithContentDescription("Contraseña").performTextInput("clave123")
        compose.waitForIdle()
        compose.onNodeWithText("Ingresar").performClick()
        compose.waitForIdle()
        assertEquals(1, auth.pedidos)
        // Sigue sin sesión: con la contraseña sola la app no deja pasar.
        assertEquals(0, auth.ingresos)
        compose.onNodeWithText("Revisá tu mail").assertIsDisplayed()
    }

    @Test
    fun elCodigoCorrectoCompletaLaSesion() {
        val auth = FakeLoginAuth()
        compose.setContent { Pantalla(auth) }
        compose.onNodeWithText("tu@email.com").performTextInput("gym@sieza.com")
        compose.onNodeWithContentDescription("Contraseña").performTextInput("clave123")
        compose.waitForIdle()
        compose.onNodeWithText("Ingresar").performClick()
        compose.waitForIdle()
        compose.onNodeWithContentDescription("Código de 6 números").performTextInput("123456")
        compose.waitForIdle()
        assertEquals(1, auth.ingresos)
    }

    @Test
    fun volverDelCodigoDejaElEmailEscrito() {
        val auth = FakeLoginAuth()
        compose.setContent { Pantalla(auth) }
        compose.onNodeWithText("tu@email.com").performTextInput("gym@sieza.com")
        compose.onNodeWithContentDescription("Contraseña").performTextInput("clave123")
        compose.waitForIdle()
        compose.onNodeWithText("Ingresar").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Volver").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Bienvenido de nuevo").assertIsDisplayed()
        // El email no se borra al volver: escribirlo de nuevo sería lo molesto.
        compose.onNodeWithText("gym@sieza.com").assertExists()
    }
}

/**
 * Un doble del servicio: cuenta los pedidos de código y los ingresos para poder afirmar que la
 * contraseña sola no entra.
 */
private class FakeLoginAuth : MFAHost {
    var pedidos = 0
        private set
    var ingresos = 0
        private set

    override val isWorking: StateFlow<Boolean> = MutableStateFlow(false)
    override val errorMessage: StateFlow<String?> = MutableStateFlow(null)

    override suspend fun pedirCodigo(form: AuthForm): MFAService.Desafio? {
        pedidos++
        return MFAService.Desafio(id = "d1", venceEnSegundos = 600, porConsola = false)
    }

    override suspend fun entrarConCodigo(desafio: String, codigo: CodigoMFA): Boolean {
        ingresos++
        return true
    }

    override fun clearError() {}
}

/**
 * Girar la pantalla no puede perder el email, y un email con coma o tilde tiene que volver entero:
 * el estado se serializa en una sola cadena y un separador mal elegido parte el formulario.
 */
class AuthFormSaverTest {
    @Test
    fun elEmailVuelveEnteroConComasYSignos() {
        val original =
            AuthForm(modo = AuthMode.CREAR, email = "a.b+etiqueta,con@coma.com", nombre = "Valen Rossi")
        val vuelta = idaYVuelta(original)
        assertEquals(original.modo, vuelta.modo)
        assertEquals(original.email, vuelta.email)
        assertEquals(original.nombre, vuelta.nombre)
    }

    @Test
    fun lasPasswordsNoSeGuardan() {
        val vuelta = idaYVuelta(AuthForm(email = "gym@sieza.com", password = "clave123"))
        assertEquals("", vuelta.password)
        assertEquals("", vuelta.repetir)
    }

    @Test
    fun sinEmailElFormularioVuelveVacio() {
        val vuelta = idaYVuelta(AuthForm())
        assertEquals(AuthMode.ENTRAR, vuelta.modo)
        assertEquals("", vuelta.email)
        assertEquals("", vuelta.nombre)
    }

    private fun idaYVuelta(form: AuthForm): AuthForm {
        // `save` es una extensión de SaverScope sobre el saver: hacen falta los dos receptores.
        val scope =
            object : SaverScope {
                override fun canBeSaved(value: Any) = true
            }
        val crudo = with(AuthFormSaver) { with(scope) { save(form) } }
        return AuthFormSaver.restore(crudo!!)!!
    }
}
