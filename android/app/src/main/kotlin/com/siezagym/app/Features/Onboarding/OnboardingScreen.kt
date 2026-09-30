package com.siezagym.app.Features.Onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.R

/**
 * El recorrido de bienvenida: tres escenas con fotos locales y controles planos sobre la paleta
 * SIEZA. Va antes del login, y sólo la primera vez en cada teléfono.
 */
@Composable
fun OnboardingScreen(
    modifier: Modifier = Modifier,
    flow: OnboardingFlow = OnboardingFlow.primera,
    onChange: (OnboardingFlow) -> Unit = {},
    onComplete: () -> Unit,
) {
    Box(modifier.fillMaxSize()) {
        Foto(painterResource(flow.page.fondo))
        Column(
            Modifier.fillMaxSize().padding(horizontal = 24.dp).padding(top = 12.dp, bottom = 18.dp)
        ) {
            Encabezado(
                pagina = flow.page,
                indice = flow.indice,
                onOmitir = onComplete,
            )
            Spacer(Modifier.weight(1f).heightIn(min = 24.dp))
            Mensaje(flow.page)
            Controles(
                flow = flow,
                modifier = Modifier.padding(top = 42.dp),
                onAtras = { onChange(flow.goBack()) },
                onAdelante = {
                    val (nuevo, termino) = flow.advance()
                    if (termino) onComplete() else onChange(nuevo)
                },
            )
        }
    }
}

/** Una foto por escena. Locales a propósito: la bienvenida no puede depender de la red. */
private val OnboardingPage.fondo: Int
    get() =
        when (this) {
            OnboardingPage.RUTINAS -> R.drawable.hero_gym
            OnboardingPage.ENTRENO -> R.drawable.fondo_electrico
            OnboardingPage.PROGRESO -> R.drawable.fondo_pliegues
        }

/**
 * La foto con el velo de arriba. Los cinco cortes son los del degradado de iOS: apenas se ve la
 * foto arriba, y el texto de abajo necesita el color plano para leerse.
 */
@Composable
private fun Foto(pintor: androidx.compose.ui.graphics.painter.Painter) {
    Image(
        pintor,
        // La foto es decorativa: el mensaje de la pantalla ya dice lo mismo.
        null,
        Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
    )
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(
                0f to tema.fondoPlano.copy(alpha = 0.52f),
                0.24f to tema.fondoPlano.copy(alpha = 0.02f),
                0.46f to tema.fondoPlano.copy(alpha = 0.04f),
                0.70f to tema.fondoPlano.copy(alpha = 0.83f),
                1f to tema.fondoPlano,
            )
        )
    )
}

@Composable
private fun Encabezado(pagina: OnboardingPage, indice: Int, onOmitir: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        Image(
            painterResource(R.drawable.sieza_wordmark),
            // La imagen es un wordmark: sin nombre no lo lee el lector de pantalla.
            "SiezaGym",
            Modifier.height(15.dp),
            contentScale = ContentScale.Fit,
            // El PNG es negro fijo: sin esto el logo desaparece sobre la foto oscura.
            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(tema.texto),
        )
        // El peso va en la fila, no en cada cápsula: si va en las cápsulas, la fila se lleva todo
        // el ancho y "Omitir" queda con cero píxeles.
        Row(
            Modifier
                .weight(1f)
                .semantics { contentDescription = "Pantalla ${indice + 1} de 3" },
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            OnboardingPage.entries.forEach { anterior ->
                Box(
                    Modifier
                        .weight(1f)
                        .height(3.dp)
                        .clip(CircleShape)
                        .background(
                            if (anterior.ordinal <= indice) tema.texto
                            else tema.texto.copy(alpha = 0.32f)
                        )
                )
            }
        }
        Text(
            "Omitir",
            Modifier
                .clip(CircleShape)
                .background(tema.vidrio(2))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onOmitir,
                )
                .padding(horizontal = 14.dp)
                .heightIn(min = 44.dp)
                .wrapContentHeight(Alignment.CenterVertically)
                .semantics { contentDescription = "Omitir, abre el inicio de sesión" },
            color = tema.texto,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
private fun Mensaje(page: OnboardingPage) {
    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
        Text(
            page.eyebrow,
            color = tema.texto2,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = tracking(2f, 11f).sp,
            modifier = Modifier.padding(bottom = 16.dp),
        )
        Text(
            page.headline,
            color = tema.texto,
            fontSize = 43.sp,
            lineHeight = 47.sp,
            letterSpacing = tracking(-1.8f, 43f).sp,
            fontWeight = FontWeight.Normal,
        )
        Text(
            page.headlineEmphasis,
            color = tema.texto,
            fontSize = 43.sp,
            lineHeight = 47.sp,
            letterSpacing = tracking(-1.8f, 43f).sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp),
        )
        Text(
            page.detail,
            color = tema.texto.copy(alpha = 0.84f),
            fontSize = 15.sp,
            lineHeight = 23.sp,
            maxLines = 4,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun Controles(
    flow: OnboardingFlow,
    modifier: Modifier = Modifier,
    onAtras: () -> Unit,
    onAdelante: () -> Unit,
) {
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            Modifier
                .size(62.dp)
                .clip(CircleShape)
                .background(tema.vidrio(2))
                .border(BorderStroke(1.dp, tema.bordeFuerte), CircleShape)
                .alpha(if (flow.canGoBack) 1f else 0.42f)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    enabled = flow.canGoBack,
                    onClick = onAtras,
                )
                .semantics { contentDescription = "Volver" },
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                null,
                tint = tema.texto,
                modifier = Modifier.size(19.dp),
            )
        }
        Row(
            Modifier
                .weight(1f)
                .height(62.dp)
                .clip(CircleShape)
                .background(if (flow.isLastPage) tema.solido else tema.bordeFuerte)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onAdelante,
                )
                .semantics {
                    contentDescription =
                        if (flow.isLastPage) "Empezar, abre el inicio de sesión"
                        else "Continuar, va a la siguiente pantalla"
                }
                .padding(start = 8.dp, end = 20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                Modifier.size(46.dp).clip(CircleShape).background(tema.fondoPlano),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    null,
                    tint = if (flow.isLastPage) tema.sobreSolido else tema.texto,
                    modifier = Modifier.size(19.dp),
                )
            }
            Text(
                if (flow.isLastPage) "Empezar" else "Continuar",
                Modifier.weight(1f),
                color = if (flow.isLastPage) tema.sobreSolido else tema.texto,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                null,
                tint = if (flow.isLastPage) tema.sobreSolido else tema.texto,
                modifier = Modifier.size(15.dp),
            )
        }
    }
}
