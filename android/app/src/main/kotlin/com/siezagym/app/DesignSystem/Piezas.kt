package com.siezagym.app.DesignSystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.NumberFormat
import java.util.Locale

/**
 * Tarjeta compartida: material en los temas clásicos, superficie opaca en SIEZA.
 *
 * El `ultraThinMaterial` de SwiftUI difumina lo que hay atrás; en Android el
 * desenfoque real necesita API 31 y la app corre desde 26. La tinta de [vidrio]
 * sobre un fondo oscuro se ve casi igual, así que la superficie es esa.
 */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    padding: Dp = 16.dp,
    radius: Float = Theme.radius,
    nivel: Int = 1,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalTheme.current
    val esquina = RoundedCornerShape(theme.esquina(radius))
    Column(
        modifier
            .fillMaxWidth()
            .clip(esquina)
            .background(theme.vidrio(nivel))
            .border(BorderStroke(1.dp, theme.borde), esquina)
            .padding(padding),
        content = content,
    )
}

/** Rótulo de sección: el `d2-label` de la web. */
@Composable
fun SectionLabel(texto: String, modifier: Modifier = Modifier) {
    Text(
        texto,
        modifier.fillMaxWidth().padding(start = 4.dp),
        color = tema.texto2,
        fontSize = 13.sp,
        lineHeight = 16.sp,
    )
}

/** Título de pantalla. */
@Composable
fun PageTitle(texto: String, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    Text(
        texto,
        modifier.fillMaxWidth(),
        color = theme.texto,
        fontSize = 30.sp,
        lineHeight = 34.sp,
        fontWeight = if (theme.plano) FontWeight.Bold else FontWeight.ExtraBold,
        letterSpacing = tracking(-0.7f, 30f).sp,
    )
}

/** El botón principal: el sólido del tema, con el texto que le corresponde. */
@Composable
fun SolidButton(
    texto: String,
    modifier: Modifier = Modifier,
    expands: Boolean = true,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val theme = LocalTheme.current
    val radio = RoundedCornerShape(if (theme.plano) 14.dp else 26.dp)
    val source = remember { MutableInteractionSource() }
    Box(
        modifier
            .then(if (expands) Modifier.fillMaxWidth() else Modifier)
            .heightIn(min = 52.dp)
            .clip(radio)
            .background(if (enabled) theme.solido else theme.solido.copy(alpha = .4f))
            .clickable(
                interactionSource = source,
                indication = null,
                enabled = enabled,
                onClick = onClick,
            )
            .padding(horizontal = 22.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            texto,
            color = theme.sobreSolido,
            fontSize = 15.sp,
            lineHeight = 20.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center,
        )
    }
}

/** Botón secundario: contorno de vidrio, sin relleno sólido. */
@Composable
fun GhostButton(
    texto: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val theme = LocalTheme.current
    val radio = RoundedCornerShape(if (theme.plano) 14.dp else 23.dp)
    val source = remember { MutableInteractionSource() }
    Box(
        modifier
            .heightIn(min = 46.dp)
            .clip(radio)
            .background(theme.vidrio(1))
            .border(BorderStroke(1.dp, theme.bordeFuerte), radio)
            .clickable(interactionSource = source, indication = null, onClick = onClick)
            .padding(horizontal = 18.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(texto, color = theme.texto, fontSize = 14.sp, lineHeight = 20.sp)
    }
}

/** Encabezado de widget: rótulo chico arriba. */
@Composable
fun WidgetHeader(title: String, modifier: Modifier = Modifier) {
    Text(title, modifier.fillMaxWidth(), color = tema.texto2, fontSize = 13.sp, lineHeight = 18.sp)
}

/** Número grande de un widget, con su unidad al lado. */
@Composable
fun WidgetValue(value: String, unit: String? = null, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    Row(modifier, verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(
            value,
            color = theme.texto,
            fontSize = 26.sp,
            lineHeight = 30.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = tracking(-0.8f, 26f).sp,
            maxLines = 1,
        )
        if (unit != null) Text(unit, color = theme.texto2, fontSize = 12.sp, lineHeight = 15.sp)
    }
}

/**
 * Barra de progreso: riel tenue y relleno con el sólido del tema, la misma que
 * `.d2-muscle-bar` en la web.
 */
@Composable
fun WidgetMeter(value: Double, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    Box(modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(theme.texto3.copy(alpha = .35f))) {
        Box(
            Modifier
                .fillMaxWidth(value.coerceIn(0.0, 1.0).toFloat())
                .height(6.dp)
                .clip(CircleShape)
                .background(theme.solido)
        )
    }
}

/** Alias de [GlassCard], para las pantallas que ya lo usaban. */
@Composable
fun SurfaceCard(
    modifier: Modifier = Modifier,
    padding: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit,
) = GlassCard(modifier, padding, content = content)

/** El botón principal de antes, ahora [SolidButton]. */
@Composable
fun AccentButton(
    texto: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit,
) = SolidButton(texto, modifier, expands = false, enabled = enabled, onClick = onClick)

/** Una cifra grande con su rótulo, como los widgets de la pantalla de inicio. */
@Composable
fun Stat(valor: String, unidad: String, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    Column(modifier, verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(
            valor,
            color = theme.texto,
            fontSize = 22.sp,
            lineHeight = 26.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
        )
        Text(unidad, color = theme.texto2, fontSize = 10.sp, lineHeight = 14.sp, maxLines = 1)
    }
}

/** El vacío de antes, ahora [Vacio] sin borde ni botón. */
@Composable
fun EmptyWidget(texto: String, modifier: Modifier = Modifier) {
    Text(texto, modifier.fillMaxWidth(), color = tema.texto2, fontSize = 13.sp, lineHeight = 19.sp)
}

/**
 * El bloque grande con imagen de fondo. En design2 lo reemplaza [GlassCard] con
 * el sólido del tema; queda sólo para las pantallas sin migrar.
 */
@Composable
fun Hero(alto: Dp, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier
            .fillMaxWidth()
            .height(alto)
            .clip(RoundedCornerShape(20.dp))
            .background(tema.solido)
            .padding(20.dp),
        verticalArrangement = Arrangement.Bottom,
        content = content,
    )
}

/** Un número con el formato de Argentina: punto para los miles. */
fun number(value: Number): String =
    NumberFormat.getNumberInstance(Locale.forLanguageTag("es-AR"))
        .apply { maximumFractionDigits = 1 }
        .format(value)
