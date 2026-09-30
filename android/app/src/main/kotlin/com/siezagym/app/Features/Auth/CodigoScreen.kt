package com.siezagym.app.Features.Auth

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.CodigoMFA
import com.siezagym.app.Services.MFAHost
import com.siezagym.app.Services.MFAService
import java.util.Locale
import kotlin.math.roundToInt
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * El segundo paso: el código de seis números que llegó al mail.
 *
 * El campo real es uno solo, invisible, con los seis casilleros dibujados encima. Pegar el código
 * entero del mail tiene que funcionar, y con seis campos de a uno hay que pegarlos de a uno.
 */
@Composable
fun PantallaCodigo(
    desafio: MFAService.Desafio,
    form: AuthForm,
    auth: MFAHost,
    onCerrar: () -> Unit,
) {
    var vigente by remember { mutableStateOf(desafio) }
    var codigo by remember { mutableStateOf("") }
    var vence by
        remember {
            mutableStateOf(System.currentTimeMillis() + desafio.venceEnSegundos * 1000L)
        }
    var esperaReenvio by
        remember { mutableStateOf(System.currentTimeMillis() + ESPERA_REENVIO) }
    var intentos by remember { mutableStateOf(0) }
    val working by auth.isWorking.collectAsStateWithLifecycle()
    val error by auth.errorMessage.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val teclado = LocalSoftwareKeyboardController.current
    val haptic = LocalHapticFeedback.current
    val completo = CodigoMFA(codigo).completo

    /** Borra el código y sacude los casilleros. */
    fun rechazar() {
        codigo = ""
        intentos++
        teclado?.show()
    }

    /**
     * El código va como parámetro y no se lee del estado: [escribir] corre antes de que la
     * recomposición vea el número nuevo, así que el estado todavía diría que falta el último.
     */
    fun entrar(codigo: CodigoMFA) {
        if (!codigo.completo || auth.isWorking.value) return
        scope.launch {
            if (auth.entrarConCodigo(vigente.id, codigo)) {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
            } else {
                // Repetir a ciegas los mismos seis números no sirve de nada: se limpian.
                rechazar()
            }
        }
    }

    fun escribir(entrada: String) {
        val limpio = CodigoMFA.limpiar(entrada)
        if (limpio == codigo) return
        codigo = limpio
        // El error del intento anterior deja de ser cierto en cuanto se corrige un número.
        auth.clearError()
        // Con los seis puestos entra solo: tocar "Entrar" después de tipear el último número
        // es un paso de más.
        entrar(CodigoMFA(limpio))
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Column(Modifier.padding(top = 40.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                "SEGUNDO PASO",
                color = tema.texto2,
                fontSize = 13.sp,
                letterSpacing = tracking(1.8f, 13f).sp,
            )
            Text(
                "Revisá tu mail",
                color = tema.texto,
                fontSize = 30.sp,
                lineHeight = 36.sp,
                letterSpacing = tracking(-0.7f, 30f).sp,
                fontWeight = if (tema.plano) FontWeight.Bold else FontWeight.ExtraBold,
            )
            Text(
                "Te mandamos un código de 6 números a ${form.emailNormalizado}.",
                color = tema.texto2,
                fontSize = 15.sp,
            )
            if (vigente.porConsola) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        Icons.Filled.Build,
                        null,
                        tint = tema.texto3,
                        modifier = Modifier.size(13.dp),
                    )
                    Text(
                        "El servidor no tiene correo configurado: el código quedó en su log.",
                        color = tema.texto3,
                        fontSize = 12.sp,
                    )
                }
            }
        }

        Casilleros(codigo, intentos, onChange = ::escribir)

        error?.let { Aviso(it) }

        SolidButton(
            if (working) "Un momento…" else "Entrar",
            Modifier.fillMaxWidth(),
            enabled = completo && !working,
        ) {
            entrar(CodigoMFA(codigo))
        }

        Column(
            Modifier.fillMaxWidth().padding(top = 6.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text("Vence en", color = tema.texto3, fontSize = 13.sp)
                CuentaAtrasiva(vence)
            }
            Text(
                "Reenviar el código",
                Modifier
                    .alpha(if (System.currentTimeMillis() >= esperaReenvio && !working) 1f else 0.45f)
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        enabled = System.currentTimeMillis() >= esperaReenvio && !working,
                    ) {
                        scope.launch {
                            auth.pedirCodigo(form).let { nuevo ->
                                if (nuevo != null) {
                                    vigente = nuevo
                                    codigo = ""
                                    vence = System.currentTimeMillis() + nuevo.venceEnSegundos * 1000L
                                    // La espera recién arranca si el mail salió: si el pedido falló
                                    // el usuario puede reintentar sin esperar.
                                    esperaReenvio = System.currentTimeMillis() + ESPERA_REENVIO
                                    teclado?.show()
                                }
                            }
                        }
                    }
                    .padding(horizontal = 4.dp),
                color = tema.texto,
                fontSize = 13.sp,
                textDecoration = TextDecoration.Underline,
            )
            Text(
                "Volver",
                Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        enabled = !working,
                    ) {
                        onCerrar()
                    }
                    .padding(horizontal = 4.dp),
                color = tema.texto2,
                fontSize = 13.sp,
            )
        }
    }
}

/** Treinta segundos entre un reenvío y el siguiente, para no llenarle el mail al usuario. */
private const val ESPERA_REENVIO = 30_000L

/**
 * Los casilleros con el campo de verdad detrás. Cuando el código se rechaza sacuden: tres golpes
 * cortos a un lado y al otro, que es lo que el cuerpo ya entiende sin leer nada.
 */
@Composable
private fun Casilleros(digitos: String, intentos: Int, onChange: (String) -> Unit) {
    val teclado = LocalSoftwareKeyboardController.current
    val haptic = LocalHapticFeedback.current
    val foco = remember { FocusRequester() }
    val x = remember { Animatable(0f) }

    LaunchedEffect(intentos) {
        if (intentos > 0) {
            // Error, no confirmación: el código estaba mal.
            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            repeat(3) {
                x.animateTo(-8f, tween(60))
                x.animateTo(8f, tween(60))
            }
            x.animateTo(0f, tween(60))
        }
    }

    Box(
        Modifier
            .fillMaxWidth()
            .offset { IntOffset(x.value.roundToInt(), 0) }
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            ) {
                teclado?.show()
                runCatching { foco.requestFocus() }
            }
    ) {
        BasicTextField(
            digitos,
            { nuevo: String ->
                // Pegar "Tu código es 123456." tiene que funcionar: se queda con los dígitos.
                val limpio = CodigoMFA.limpiar(nuevo)
                if (limpio != digitos) onChange(limpio)
            },
            Modifier
                .fillMaxWidth()
                .height(58.dp)
                .alpha(0.01f)
                .focusRequester(foco)
                .semantics { contentDescription = "Código de 6 números" },
            singleLine = true,
            textStyle = TextStyle(color = tema.texto, fontSize = 24.sp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            cursorBrush = SolidColor(Color.Transparent),
        )

        Row(
            Modifier.fillMaxWidth().semantics { contentDescription = "Casilleros del código" },
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            repeat(CodigoMFA.largo) { posicion ->
                val digito = digitos.getOrNull(posicion)?.toString() ?: ""
                val enCurso = posicion == digitos.length.coerceAtMost(CodigoMFA.largo - 1)
                val radio = if (tema.plano) 14.dp else Theme.radiusSmall.dp
                Box(
                    Modifier
                        .weight(1f)
                        .height(58.dp)
                        .clip(RoundedCornerShape(radio))
                        .background(tema.vidrio(1))
                        .border(
                            BorderStroke(1.dp, if (enCurso) tema.solido else tema.borde),
                            RoundedCornerShape(radio),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(digito, color = tema.texto, fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun CuentaAtrasiva(hasta: Long) {
    var ahora by remember { mutableStateOf(System.currentTimeMillis() / 1000L) }
    LaunchedEffect(hasta) {
        while (true) {
            delay(1000)
            ahora = System.currentTimeMillis() / 1000L
        }
    }
    val segundos = ((hasta - ahora * 1000L) / 1000L).coerceAtLeast(0)
    Text(
        String.format(Locale.ROOT, "%d:%02d", segundos / 60, segundos % 60),
        color = tema.texto3,
        fontSize = 13.sp,
    )
}
