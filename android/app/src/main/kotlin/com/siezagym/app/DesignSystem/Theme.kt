package com.siezagym.app.DesignSystem

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.R

/**
 * Un tema del diseño: los mismos tokens que `.d2[data-d2-theme="..."]` en la web.
 * Los valores están en [temasDesign2].
 */
data class Theme(
    val id: String,
    val nombre: String,
    val plano: Boolean,
    val glass1: Double,
    val glass2: Double,
    val glass3: Double,
    val superficie1: Color?,
    val superficie2: Color?,
    val superficie3: Color?,
    val borde: Color,
    val bordeFuerte: Color,
    val texto: Color,
    val texto2: Color,
    val texto3: Color,
    /** El sólido del tema: botón principal, día entrenado, serie confirmada. */
    val solido: Color,
    val sobreSolido: Color,
    val luzA: Color,
    val luzB: Color,
    val luzC: Color,
    val mancha1: Color,
    val mancha2: Color,
    val mancha3: Color,
    val fondoInicio: Offset,
    val fondoFin: Offset,
    val fondo: List<Pair<Float, Color>>,
    /** drawable de la obra de fondo para los temas que la traen. `null` en los demás. */
    val obra: Int?,
) {
    /** Un color plano del tema, para las barras del sistema y rellenos de respaldo. */
    val fondoPlano: Color get() = fondo.last().second

    /**
     * Los temas anteriores conservan el vidrio. En SIEZA cada superficie es
     * opaca: el fondo no se filtra ni cambia el contraste de los controles.
     */
    fun vidrio(nivel: Int = 1): Color {
        if (plano)
            return (when {
                    nivel >= 3 -> superficie3
                    nivel == 2 -> superficie2
                    else -> superficie1
                })
                ?: fondoPlano
        val opacidad = when {
            nivel >= 3 -> glass3
            nivel == 2 -> glass2
            else -> glass1
        }
        return Color.White.copy(alpha = opacidad.toFloat())
    }

    /** La esquina de las tarjetas: SIEZA, que es plano, usa la chica. */
    fun esquina(radio: Float): Float = if (plano) minOf(radio, 18f) else radio

    val radio: Dp get() = if (plano) 18.dp else 24.dp
    val radioSmall: Dp get() = if (plano) 14.dp else 16.dp

    companion object {
        /** Radios del diseño, iguales a los de la web. */
        const val radius = 24f
        const val radiusSmall = 16f

        /**
         * El verde de "terminado". Es el único color fijo del diseño: no sale
         * del tema porque significa una sola cosa y tiene que significarla
         * igual en todos. El sólido de cada tema ya se usa para "lo importante
         * de esta pantalla"; si el terminado también fuera el sólido, en
         * Plata (casi negro) no se distinguiría de lo pendiente.
         */
        val hecho = Color(52 / 255f, 199 / 255f, 89 / 255f)

        val porDefecto: Theme = temasDesign2.first { it.id == "sieza" }

        fun conId(id: String?): Theme = temasDesign2.firstOrNull { it.id == id } ?: porDefecto

        // ------------------------------------------------------------------
        // Los nombres que usaba la app antes de design2, resueltos contra el
        // tema activo. Existen para no reescribir las veinte pantallas de una
        // sola vez: mientras se migran, el código viejo compila y se ve con el
        // tema nuevo. Cada pantalla que se migre deja de usarlos.
        //
        // Cuando la última pantalla esté, se borra todo este bloque junto con
        // las reescrituras de los servicios.
        // ------------------------------------------------------------------

        /** El tema activo. `tema` es el atajo de lectura dentro de una vista. */
        val current: Theme
            @Composable get() = tema

        val background: Color
            @Composable get() = tema.fondoPlano

        val accent: Color
            @Composable get() = tema.solido

        val accentHover: Color
            @Composable get() = tema.solido.copy(alpha = 0.85f)

        /** El acento claro ya no existe: en SIEZA el sólido es el único acento. */
        val accentLight: Color
            @Composable get() = tema.solido

        val onDark: Color
            @Composable get() = tema.texto

        val onDarkMuted: Color
            @Composable get() = tema.texto2

        val onDarkFaint: Color
            @Composable get() = tema.texto3

        val cardText: Color
            @Composable get() = tema.texto

        val cardMuted: Color
            @Composable get() = tema.texto2

        val cardBorder: Color
            @Composable get() = tema.borde

        val chartDark: Color
            @Composable get() = tema.solido

        val chartLight: Color
            @Composable get() = tema.texto3

        @Composable
        fun fondoBrush(): Brush = Brush.verticalGradient(*tema.fondo.toTypedArray())
    }
}

private const val PREFS = "sieza-diseno"
private const val CLAVE_TEMA = "d2-theme-v2"

/**
 * El tema elegido, guardado en el aparato igual que en la web. `UserDefaults`
 * es el equivalente de `SharedPreferences`: es una preferencia del teléfono,
 * no de la cuenta, así que no viaja a Firestore.
 */
class ThemeStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private val estado: MutableState<Theme> =
        mutableStateOf(Theme.conId(prefs.getString(CLAVE_TEMA, null)))

    val actual: Theme get() = estado.value

    fun seleccionar(theme: Theme) {
        estado.value = theme
        prefs.edit().putString(CLAVE_TEMA, theme.id).apply()
    }

    companion object {
        /** El id guardado, para quien necesite el tema sin depender de la vista. */
        fun temaGuardado(context: Context): String =
            context
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(CLAVE_TEMA, Theme.porDefecto.id)!!
    }
}

val LocalTheme = staticCompositionLocalOf { Theme.porDefecto }

/** Atajo de lectura: `tema.texto` en lugar de `LocalTheme.current.texto`. */
val tema: Theme
    @Composable get() = LocalTheme.current

@Composable
fun rememberThemeStore(): ThemeStore {
    val context = LocalContext.current
    return remember(context) { ThemeStore(context) }
}

@Composable
fun SiezaTheme(theme: Theme, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalTheme provides theme) { content() }
}

/**
 * El fondo de la app: superficie plana en SIEZA; en los temas anteriores, obra o
 * degradado con luces y manchas.
 *
 * Las manchas no son decoración: el vidrio de las tarjetas difumina lo que tiene
 * atrás, y sobre un color plano el desenfoque no se percibe.
 */
@Composable
fun Backdrop(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    val theme = LocalTheme.current
    Box(modifier.fillMaxSize()) {
        if (theme.plano) {
            Box(Modifier.fillMaxSize().background(theme.fondoPlano))
        } else {
            val obra = theme.obra
            if (obra != null) {
                Canvas(Modifier.fillMaxSize()) {
                    drawRect(theme.fondoBrush(size.width, size.height))
                }
                Image(
                    painterResource(obra),
                    null,
                    Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Canvas(Modifier.fillMaxSize()) {
                    drawRect(theme.fondoBrush(size.width, size.height))
                    luz(theme.luzA, 0.18f, 0.08f, size.width * 1.1f)
                    luz(theme.luzB, 0.88f, 0.22f, size.width * 0.9f)
                    luz(theme.luzC, 0.5f, 1.05f, size.width * 1.2f)
                    mancha(theme.mancha1, -0.14f, 0.06f, 460.dp.toPx())
                    mancha(theme.mancha2, 0.86f, 0.26f, 380.dp.toPx())
                    mancha(theme.mancha3, 0.24f, 1.12f, 520.dp.toPx())
                }
            }
        }
        content()
    }
}

/** Una luz radial: en SwiftUI es un `RadialGradient` con centro y radio dados. */
private fun DrawScope.luz(color: Color, x: Float, y: Float, radio: Float) {
    drawRect(
        Brush.radialGradient(
            colors = listOf(color, color.copy(alpha = 0f)),
            center = Offset(size.width * x, size.height * y),
            radius = radio,
        )
    )
}

/**
 * Una mancha de color. SwiftUI la difumina con `blur(radius: 70)`; el
 * degradado que se apaga da el mismo resultado y funciona desde API 26, donde
 * `Modifier.blur` todavía no existe.
 */
private fun DrawScope.mancha(color: Color, x: Float, y: Float, lado: Float) {
    val centro = Offset(size.width * x, size.height * y)
    drawCircle(
        brush =
            Brush.radialGradient(
                colors = listOf(color, color.copy(alpha = 0f)),
                center = centro,
                radius = lado / 2f,
            ),
        radius = lado / 2f,
        center = centro,
    )
}

/**
 * El `tracking` de SwiftUI va en puntos; el `letterSpacing` de Compose es
 * relativo al tamaño de fuente. Esta función hace la conversión para poder
 * copiar los valores del diseño tal cual.
 */
fun tracking(puntos: Float, fontSize: Float): Float = puntos / fontSize

/** El texto del cuerpo: 15 pt medianos, el mismo aire del diseño. */
fun textoPrincipal() = 15.sp

/** El `line height` que SwiftUI deriva del tamaño; Compose no lo hace solo. */
val lineHeightCorto = 1.25f
