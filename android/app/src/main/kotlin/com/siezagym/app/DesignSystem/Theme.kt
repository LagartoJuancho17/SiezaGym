package com.siezagym.app.DesignSystem

import android.content.SharedPreferences
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CapsuleShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Offset
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.R

/** Una parada del degradado de fondo, como `Gradient.Stop` en iOS. */
@Immutable
data class ColorStop(val color: Color, val location: Float)

/**
 * Un tema del diseño: los mismos tokens que `.d2[data-d2-theme="..."]` en la
 * web. Los valores los genera `android/scripts/sync-theme.mjs` desde el CSS,
 * así que no hay colores escritos a mano de este lado.
 */
@Immutable
data class D2Theme(
    val id: String,
    val nombre: String,

    /** Opacidad de la tinta del vidrio, en tres niveles. */
    val glass1: Float,
    val glass2: Float,
    val glass3: Float,

    val borde: Color,
    val bordeFuerte: Color,

    val texto: Color,
    val texto2: Color,
    val texto3: Color,

    /** El sólido del tema: el botón principal, el día entrenado, la serie
     * confirmada. Y el color del texto que va encima. */
    val solido: Color,
    val sobreSolido: Color,

    /** Las tres luces que se apoyan sobre el degradado de base. */
    val luzA: Color,
    val luzB: Color,
    val luzC: Color,

    val mancha1: Color,
    val mancha2: Color,
    val mancha3: Color,

    /** Puntos de inicio y fin del degradado, en fracción del alto y ancho. */
    val fondoInicio: Pair<Float, Float>,
    val fondoFin: Pair<Float, Float>,
    val fondo: List<ColorStop>,

    /**
     * Nombre del tema cuando trae una obra de fondo en vez de un degradado.
     * `null` en los demás.
     */
    val obra: String?,
) {
    /** Un color plano del tema, para los pocos lugares que no pueden llevar el
     * degradado entero (los indicadores de sistema, un relleno de respaldo). */
    val fondoPlano: Color get() = fondo.lastOrNull()?.color ?: Color.Black

    /** El vidrio no tiene color propio: es blanco translúcido y el color se lo
     * da el fondo que difumina. */
    fun vidrio(nivel: Int = 1): Color {
        val opacidad = if (nivel >= 3) glass3 else if (nivel == 2) glass2 else glass1
        return Color.White.copy(alpha = opacidad)
    }

    companion object {
        fun conId(id: String?): D2Theme =
            TemasTokens.firstOrNull { it.id == id } ?: TemaPorDefecto
    }
}

/** El tema elegido, guardado en el aparato igual que en la web. */
class ThemeStore(private val preferencias: SharedPreferences) {
    private val clave = "d2-theme-v2"

    var actual: D2Theme by mutableStateOf(D2Theme.conId(preferencias.getString(clave, null)))
        private set

    fun elegir(id: String) {
        actual = D2Theme.conId(id)
        preferencias.edit().putString(clave, id).apply()
    }

    companion object {
        val CLAVE_PREFERENCIAS = "com.siezagym.app.preferences"
    }
}

val LocalD2Theme = staticCompositionLocalOf<D2Theme> { TemaPorDefecto }
val LocalThemeStore = staticCompositionLocalOf<ThemeStore> {
    error("Sin ThemeStore en el árbol")
}

// MARK: - Piezas

/**
 * El fondo de la app: la obra del tema, o el degradado con sus tres luces y
 * las manchas desenfocadas encima.
 *
 * Las manchas no son decoración: el vidrio de las tarjetas difumina lo que
 * tiene atrás, y sobre un color plano el desenfoque no se percibe.
 */
@Composable
fun Backdrop(modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    val obra = tema.obra

    androidx.compose.foundation.layout.BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val ancho = maxWidth
        val alto = maxHeight
        val gradiente = Brush.linearGradient(
            colors = tema.fondo.map { it.color },
            colorStops = tema.fondo.map { it.location }.toFloatArray(),
            start = Offset(ancho.value * tema.fondoInicio.first, alto.value * tema.fondoInicio.second),
            end = Offset(ancho.value * tema.fondoFin.first, alto.value * tema.fondoFin.second),
        )

        Box(Modifier.fillMaxSize().background(gradiente))

        if (obra != null) {
            Obra(obra)
        } else {
            // Las tres luces, en las mismas posiciones que los
            // radial-gradient de la web.
            Luz(tema.luzA, 0.18f, 0.08f, radio = ancho * 1.1f, ancho, alto)
            Luz(tema.luzB, 0.88f, 0.22f, radio = ancho * 0.9f, ancho, alto)
            Luz(tema.luzC, 0.50f, 1.05f, radio = ancho * 1.2f, ancho, alto)

            Mancha(tema.mancha1, x = -0.14f, y = 0.06f, lado = 460.dp, ancho, alto)
            Mancha(tema.mancha2, x = 0.86f, y = 0.26f, lado = 380.dp, ancho, alto)
            Mancha(tema.mancha3, x = 0.24f, y = 1.12f, lado = 520.dp, ancho, alto)
        }
    }
}

@Composable
private fun Obra(nombre: String) {
    val pintura: Painter? = when (nombre) {
        "pliegues" -> painterResource(R.drawable.fondo_pliegues)
        "electrico" -> painterResource(R.drawable.fondo_electrico)
        else -> null
    }
    if (pintura != null) {
        androidx.compose.foundation.Image(
            painter = pintura,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
    }
}

@Composable
private fun Luz(color: Color, x: Float, y: Float, radio: Dp, ancho: Dp, alto: Dp) {
    Box(
        Modifier
            .fillMaxSize()
            .drawBehind {
                drawRect(
                    brush = Brush.radialGradient(
                        colors = listOf(color, color.copy(alpha = 0f)),
                        center = Offset(ancho.value * x, alto.value * y),
                        radius = radio.value,
                    ),
                )
            },
    )
}

@Composable
private fun Mancha(color: Color, x: Float, y: Float, lado: Dp, ancho: Dp, alto: Dp) {
    Box(
        Modifier
            .offset(x = ancho * x, y = alto * y)
            .size(lado)
            .blur(70.dp)
            .background(color, CircleShape),
    )
}

/** Tarjeta de vidrio: el contenedor de todo en este diseño. */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    paddingInterno: Dp = 16.dp,
    radius: Dp = 24.dp,
    nivel: Int = 1,
    contenido: @Composable ColumnScope.() -> Unit,
) {
    val tema = LocalD2Theme.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(radius))
            .background(tema.vidrio(nivel))
            .border(1.dp, tema.borde, RoundedCornerShape(radius))
            .padding(paddingInterno),
        horizontalAlignment = Alignment.Start,
        content = contenido,
    )
}

/** Rótulo de sección: el `d2-label` de la web. */
@Composable
fun SectionLabel(texto: String, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Text(
        texto,
        fontSize = 13.sp,
        color = tema.texto2,
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 4.dp),
    )
}

/** Título de pantalla. */
@Composable
fun PageTitle(texto: String, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Text(
        texto,
        fontSize = 30.sp,
        fontWeight = FontWeight.Heavy,
        letterSpacing = (-0.7).sp,
        color = tema.texto,
        modifier = modifier.fillMaxWidth(),
    )
}

// MARK: - Botones

/** El botón principal: el sólido del tema, con el texto que le corresponde. */
@Composable
fun SolidButton(
    texto: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    expands: Boolean = true,
    enabled: Boolean = true,
) {
    val tema = LocalD2Theme.current
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = CapsuleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = tema.solido,
            contentColor = tema.sobreSolido,
            disabledContainerColor = tema.solido.copy(alpha = 0.5f),
            disabledContentColor = tema.sobreSolido.copy(alpha = 0.7f),
        ),
        contentPadding = PaddingValues(horizontal = 22.dp, vertical = 0.dp),
        modifier = modifier
            .then(if (expands) Modifier.fillMaxWidth() else Modifier)
            .height(52.dp),
    ) {
        Text(texto, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

/** Botón secundario: contorno de vidrio, sin relleno sólido. */
@Composable
fun GhostButton(
    texto: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tema = LocalD2Theme.current
    Button(
        onClick = onClick,
        shape = CapsuleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = tema.vidrio(1),
            contentColor = tema.texto,
        ),
        border = BorderStroke(1.dp, tema.bordeFuerte),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 0.dp),
        modifier = modifier.height(46.dp),
    ) {
        Text(texto, fontSize = 14.sp)
    }
}

// MARK: - Widgets

/** Encabezado de widget: rótulo chico arriba. */
@Composable
fun WidgetHeader(title: String, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Text(
        title,
        fontSize = 13.sp,
        color = tema.texto2,
        modifier = modifier.fillMaxWidth(),
    )
}

/** Número grande de un widget, con su unidad al lado. */
@Composable
fun WidgetValue(value: String, unit: String? = null, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Row(verticalAlignment = Alignment.Bottom, modifier = modifier.fillMaxWidth()) {
        Text(
            value,
            fontSize = 26.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = (-0.8).sp,
            color = tema.texto,
            maxLines = 1,
            softWrap = false,
        )
        if (unit != null) {
            Spacer(Modifier.width(3.dp))
            Text(unit, fontSize = 12.sp, color = tema.texto2)
        }
    }
}

/** Barra de progreso: riel tenue y relleno con el sólido del tema, la misma
 * que `.d2-muscle-bar` en la web. `proporcion` va de 0...1. */
@Composable
fun WidgetMeter(proporcion: Float, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Box(modifier.height(6.dp)) {
        Box(Modifier.fillMaxSize().clip(CapsuleShape).background(tema.texto3.copy(alpha = 0.35f)))
        Box(
            Modifier
                .fillMaxWidth(proporcion.coerceIn(0f, 1f))
                .fillMaxHeight()
                .clip(CapsuleShape)
                .background(tema.solido),
        )
    }
}