package com.siezagym.app.Features.Auth

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.gms.common.SignInButton
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.AuthMode
import android.content.Intent
import com.siezagym.app.Services.AuthService
import com.siezagym.app.Services.MFAHost
import com.siezagym.app.Services.MFAService
import kotlinx.coroutines.launch

/**
 * Entrar o crear la cuenta, en dos pasos: primero se manda la contraseña y después el código de
 * seis números. Lo del medio no es un detalle: con la contraseña correcta y sin el código, la app
 * sigue afuera.
 */
@Composable
fun LoginScreen(auth: AuthService) {
    val scope = rememberCoroutineScope()
    LoginScreenBody(
        auth = auth,
        onGoogleIntent = { lanzar ->
            val intent = auth.googleSignInIntent()
            if (intent != null) {
                lanzar(intent)
                null
            } else {
                "Google no está configurado para esta app. Probá con email."
            }
        },
        onGoogleResult = { data -> if (data != null) scope.launch { auth.completeGoogleSignIn(data) } },
    )
}

/**
 * El formulario y el segundo paso, sin Firebase detrás.
 *
 * [onGoogleIntent] devuelve el mensaje de error si el flujo no se puede armar, o llama a `lanzar` y
 * devuelve `null` si hay un `Intent` para abrir. [onGoogleResult] recibe lo que volvió de Google.
 */
@Composable
fun LoginScreenBody(
    auth: MFAHost,
    onGoogleIntent: (lanzar: (Intent) -> Unit) -> String?,
    onGoogleResult: (Intent?) -> Unit = {},
) {
    var form by rememberSaveable(stateSaver = AuthFormSaver) { mutableStateOf(AuthForm()) }
    var verContrasena by rememberSaveable { mutableStateOf(false) }
    // Las contraseñas nunca van en el bundle de estado: se pierden al girar la pantalla.
    var password by remember { mutableStateOf("") }
    var repetir by remember { mutableStateOf("") }
    var desafio by remember { mutableStateOf<MFAService.Desafio?>(null) }
    var googleError by remember { mutableStateOf<String?>(null) }
    val working by auth.isWorking.collectAsStateWithLifecycle()
    val error by auth.errorMessage.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val teclado = LocalSoftwareKeyboardController.current
    val puedeEnviar = form.puedeEnviar && !working

    fun escribir(cambio: (AuthForm) -> AuthForm) {
        form = cambio(form)
    }

    fun enviar() {
        if (!puedeEnviar) return
        teclado?.hide()
        scope.launch { desafio = auth.pedirCodigo(conPassword(form, password, repetir)) }
    }

    val launcher =
        rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            onGoogleResult(result.data)
        }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Column(
            Modifier.padding(top = 50.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                "SIEZAGYM",
                color = tema.texto2,
                fontSize = 13.sp,
                letterSpacing = tracking(1.8f, 13f).sp,
            )
            Text(
                form.modo.titulo,
                color = tema.texto,
                fontSize = 30.sp,
                lineHeight = 36.sp,
                letterSpacing = tracking(-0.7f, 30f).sp,
                fontWeight = if (tema.plano) FontWeight.Bold else FontWeight.ExtraBold,
            )
        }

        PestanasModo(form.modo, enabled = !working) { nuevo ->
            // Al cambiar de pestaña se limpian las contraseñas, no el email: es el mismo de todos
            // modos y volver a escribirlo es la parte molesta.
            form = form.cambiarA(nuevo)
            password = ""
            repetir = ""
            auth.clearError()
            googleError = null
        }

        SurfaceCard(padding = 18.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                BotonGoogle(working) {
                    teclado?.hide()
                    googleError = onGoogleIntent { intent -> launcher.launch(intent) }
                }
                Separador("o con tu email")
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    if (form.modo == AuthMode.CREAR)
                        CampoAuth(
                            etiqueta = "Nombre",
                            marcador = "Como querés que te llamemos",
                            valor = form.nombre,
                            teclado = KeyboardType.Text,
                            onChange = { nuevo -> escribir { it.copy(nombre = nuevo) } },
                        )
                    CampoAuth(
                        etiqueta = "Email",
                        marcador = "tu@email.com",
                        valor = form.email,
                        teclado = KeyboardType.Email,
                        onChange = { nuevo -> escribir { it.copy(email = nuevo) } },
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "Contraseña",
                                Modifier.weight(1f),
                                color = tema.texto2,
                                fontSize = 12.sp,
                            )
                            Text(
                                if (verContrasena) "Ocultar" else "Mostrar",
                                Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null,
                                    ) { verContrasena = !verContrasena }
                                    .padding(horizontal = 4.dp, vertical = 2.dp),
                                color = tema.texto2,
                                fontSize = 11.sp,
                            )
                        }
                        CampoAuth(
                            etiqueta = null,
                            marcador = if (form.modo == AuthMode.CREAR) "Al menos 6 caracteres" else "Tu contraseña",
                            valor = password,
                            teclado = KeyboardType.Password,
                            esPassword = !verContrasena,
                            descripcion = "Contraseña",
                            onChange = { nuevo ->
                                password = nuevo
                                escribir { it.copy(password = nuevo) }
                            },
                            // En el login es el último campo: "Ir" manda el formulario.
                            onIrA = { enviar() },
                        )
                    }
                    if (form.modo == AuthMode.CREAR) {
                        CampoAuth(
                            etiqueta = "Repetir contraseña",
                            marcador = "La misma de arriba",
                            valor = repetir,
                            teclado = KeyboardType.Password,
                            esPassword = !verContrasena,
                            descripcion = "Repetir contraseña",
                            onChange = { nuevo ->
                                repetir = nuevo
                                escribir { it.copy(repetir = nuevo) }
                            },
                            onIrA = { enviar() },
                        )
                    }
                    (form.problema ?: error ?: googleError)?.let { Aviso(it) }
                    SolidButton(
                        if (working) "Un momento…" else form.modo.accion,
                        Modifier.fillMaxWidth(),
                        enabled = puedeEnviar,
                    ) {
                        enviar()
                    }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (form.modo == AuthMode.CREAR) "¿Ya tenés cuenta?" else "¿Todavía no tenés cuenta?",
                color = tema.texto2,
                fontSize = 13.sp,
            )
            Text(
                if (form.modo == AuthMode.CREAR) "Iniciá sesión" else "Creá una gratis",
                Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        enabled = !working,
                    ) {
                        form =
                            form.cambiarA(
                                if (form.modo == AuthMode.CREAR) AuthMode.ENTRAR else AuthMode.CREAR
                            )
                        password = ""
                        repetir = ""
                        auth.clearError()
                    }
                    .padding(horizontal = 4.dp),
                color = tema.texto,
                fontSize = 13.sp,
                textDecoration = TextDecoration.Underline,
            )
        }
    }

    desafio?.let { activo ->
        PantallaCodigo(
            desafio = activo,
            form = conPassword(form, password, repetir),
            auth = auth,
            onCerrar = {
                desafio = null
                auth.clearError()
            },
        )
    }
}

/** La contraseña vive en memoria, no en el formulario que se guarda al girar la pantalla. */
private fun conPassword(form: AuthForm, password: String, repetir: String) =
    form.copy(password = password, repetir = repetir)

@Composable
private fun PestanasModo(actual: AuthMode, enabled: Boolean, onCambio: (AuthMode) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        AuthMode.entries.forEach { modo ->
            val activa = modo == actual
            val radio = if (tema.plano) 12.dp else 26.dp
            Box(
                Modifier
                    .weight(1f)
                    .heightIn(min = 38.dp)
                    .clip(RoundedCornerShape(radio))
                    .background(if (activa) tema.solido else tema.vidrio(1))
                    .then(
                        if (activa) Modifier
                        else Modifier.border(BorderStroke(1.dp, tema.borde), RoundedCornerShape(radio))
                    )
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        enabled = enabled,
                        onClick = { onCambio(modo) },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    modo.pestana,
                    color = if (activa) tema.sobreSolido else tema.texto2,
                    fontSize = 13.sp,
                )
            }
        }
    }
}

@Composable
private fun BotonGoogle(working: Boolean, onClick: () -> Unit) {
    val radio = if (tema.plano) 14.dp else 26.dp
    Box(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 50.dp)
            .clip(RoundedCornerShape(radio))
            .background(tema.vidrio(2))
            .border(BorderStroke(1.dp, tema.bordeFuerte), RoundedCornerShape(radio))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                enabled = !working,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        // El botón de Google lo dibuja la librería con su marca registrada: no se reimplementa.
        AndroidView(
            factory = { context ->
                SignInButton(context).apply {
                    setSize(SignInButton.SIZE_WIDE)
                    setColorScheme(SignInButton.COLOR_LIGHT)
                }
            },
            update = { it.isEnabled = !working },
            modifier = Modifier.fillMaxWidth().height(48.dp),
        )
    }
}

@Composable
private fun Separador(texto: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(Modifier.weight(1f).height(1.dp).background(tema.borde))
        Text(texto, color = tema.texto3, fontSize = 11.sp)
        Box(Modifier.weight(1f).height(1.dp).background(tema.borde))
    }
}

@Composable
private fun CampoAuth(
    etiqueta: String?,
    marcador: String,
    valor: String,
    teclado: KeyboardType,
    esPassword: Boolean = false,
    /** Para el lector de pantalla: el marcador desaparece apenas se escribe. */
    descripcion: String? = null,
    onChange: (String) -> Unit,
    /** El último campo del formulario: el "Ir" del teclado envía. */
    onIrA: (() -> Unit)? = null,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        etiqueta?.let { Text(it, color = tema.texto2, fontSize = 12.sp) }
        BasicTextField(
            valor,
            onChange,
            Modifier
                .fillMaxWidth()
                .heightIn(min = 52.dp)
                .clip(RoundedCornerShape(if (tema.plano) 14.dp else Theme.radiusSmall.dp))
                .background(tema.vidrio(1))
                .border(
                    BorderStroke(1.dp, tema.borde),
                    RoundedCornerShape(if (tema.plano) 14.dp else Theme.radiusSmall.dp),
                )
                .padding(horizontal = 16.dp, vertical = 14.dp)
                .semantics { contentDescription = descripcion ?: etiqueta ?: marcador },
            textStyle = TextStyle(color = tema.texto, fontSize = 15.sp),
            cursorBrush = SolidColor(tema.solido),
            singleLine = true,
            visualTransformation = if (esPassword) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions =
                KeyboardOptions(
                    keyboardType = teclado,
                    imeAction = if (onIrA == null) ImeAction.Next else ImeAction.Go,
                ),
            keyboardActions = KeyboardActions(onGo = { onIrA?.invoke() }),
            decorationBox = { inner ->
                Box {
                    if (valor.isEmpty()) Text(marcador, color = tema.texto3, fontSize = 15.sp)
                    inner()
                }
            },
        )
    }
}

/**
 * Guarda el formulario sin las contraseñas, que no van al bundle del sistema.
 *
 * El separador es un carácter de control, no una coma: los emails pueden traer comas y cortarlos
 * ahí devuelve el formulario con el email partido en dos.
 */
internal const val SEPARADOR_FORMULARIO = "\u0001"

internal val AuthFormSaver =
    Saver<AuthForm, String>(
        save = { listOf(it.modo.name, it.email, it.nombre).joinToString(SEPARADOR_FORMULARIO) },
        restore = { raw ->
            val partes = raw.split(SEPARADOR_FORMULARIO)
            AuthForm(
                modo = AuthMode.entries.firstOrNull { it.name == partes[0] } ?: AuthMode.ENTRAR,
                email = partes.getOrElse(1) { "" },
                nombre = partes.getOrElse(2) { "" },
            )
        },
    )
