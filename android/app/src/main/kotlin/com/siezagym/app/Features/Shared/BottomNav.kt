package com.siezagym.app.Features.Shared

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.LocalTheme
import com.siezagym.app.DesignSystem.Theme

/**
 * Las cuatro secciones de la app. Progreso vivía acá como quinta pestaña; ahora
 * es una grilla de accesos dentro de Perfil.
 */
enum class AppTab(val label: String) {
    HOME("Inicio"),
    ROUTINES("Rutinas"),
    HISTORY("Historial"),
    PROFILE("Perfil"),
}

/** Alto de la barra y separación del borde inferior. */
val bottomNavHeight: Dp get() = 52.dp
val bottomNavGap: Dp get() = 16.dp

/**
 * Barra inferior con superficie opaca en SIEZA y vidrio en los temas clásicos.
 * La sección activa se marca con el sólido y su nombre: el ícono solo alcanza
 * para reconocer dónde estás parado.
 *
 * No usa la barra del sistema a propósito, que no tiene nada que ver con este
 * diseño.
 */
@Composable
fun BottomNav(selection: AppTab, onSelect: (AppTab) -> Unit, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    val radio = if (theme.plano) 18.dp else 26.dp
    Row(
        modifier
            .width(300.dp)
            .height(bottomNavHeight)
            .clip(RoundedCornerShape(radio))
            .background(theme.vidrio(1))
            .border(1.dp, theme.bordeFuerte, RoundedCornerShape(radio))
            .shadow(if (theme.plano) 0.dp else 18.dp, RoundedCornerShape(radio), ambientColor = Color.Black)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        AppTab.entries.forEach { tab -> TabActivo(theme, tab, tab == selection) { onSelect(tab) } }
    }
}

@Composable
private fun RowScope.TabActivo(
    theme: Theme,
    tab: AppTab,
    activo: Boolean,
    onSelect: () -> Unit,
) {
    val source = remember { MutableInteractionSource() }
    val presionado by source.collectIsPressedAsState()
    val escala by
        animateFloatAsState(
            if (presionado) 0.95f else 1f,
            spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
            label = "navPress",
        )
    val radio = if (theme.plano) 12.dp else 26.dp
    // En Plata el sólido es casi negro sobre un blanco roto: el ícono
    // invertido necesita negro de verdad para separarse del círculo.
    val colorIcono = if (theme.id == "plata") Color.Black else theme.solido

    if (activo) {
        Row(
            Modifier
                .weight(1f)
                .scale(escala)
                .clip(RoundedCornerShape(radio))
                .background(theme.solido)
                .semantics { contentDescription = tab.label }
                .selectable(
                    selected = true,
                    role = Role.Tab,
                    interactionSource = source,
                    indication = null,
                    onClick = onSelect,
                )
                .padding(start = 14.dp, top = 4.dp, bottom = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                tab.label,
                Modifier.weight(1f),
                color = theme.sobreSolido,
                fontSize = 13.sp,
                maxLines = 1,
            )
            Box(
                Modifier.size(36.dp).clip(CircleShape).background(theme.sobreSolido),
                contentAlignment = Alignment.Center,
            ) {
                IconoNav(tab, colorIcono, Modifier.size(22.dp))
            }
        }
    } else {
        Box(
            Modifier
                .weight(1f)
                .height(44.dp)
                .scale(escala)
                .clip(CircleShape)
                .background(theme.vidrio(1))
                .border(1.dp, theme.borde, CircleShape)
                .semantics { contentDescription = tab.label }
                .selectable(
                    selected = false,
                    role = Role.Tab,
                    interactionSource = source,
                    indication = null,
                    onClick = onSelect,
                ),
            contentAlignment = Alignment.Center,
        ) {
            IconoNav(tab, theme.texto, Modifier.size(22.dp))
        }
    }
}

/**
 * Los íconos de la web son SVG sólidos de 22x22 en un viewBox de 24. Acá se
 * dibujan con Path sobre el mismo sistema de coordenadas para que salgan
 * idénticos.
 */
@Composable
private fun IconoNav(tab: AppTab, color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        scale(size.width / 24f, size.height / 24f, pivot = Offset.Zero) {
            drawPath(
                path = when (tab) {
                    AppTab.HOME -> bento
                    AppTab.ROUTINES -> mancuerna
                    AppTab.HISTORY -> clipboard
                    AppTab.PROFILE -> puntos
                },
                color = color,
            )
        }
    }
}

/** Dos bloques a la izquierda y uno alto a la derecha. */
private val bento: Path
    get() {
        val p = Path()
        p.addRoundRect(RoundRect(Rect(4.5f, 4.5f, 11f, 11f), CornerRadius(2f, 2f)))
        p.addRoundRect(RoundRect(Rect(4.5f, 13f, 11f, 19.5f), CornerRadius(2f, 2f)))
        p.addRoundRect(RoundRect(Rect(13f, 4.5f, 19.5f, 19.5f), CornerRadius(2.5f, 2.5f)))
        return p
    }

/** Mancuerna con discos interiores y exteriores. */
private val mancuerna: Path
    get() {
        val p = Path()
        listOf(
            Rect(2f, 10.5f, 4f, 13.5f) to 0.8f,
            Rect(4.5f, 7f, 6.5f, 17f) to 1f,
            Rect(7f, 5f, 10f, 19f) to 1.2f,
            Rect(9.5f, 10.5f, 14.5f, 13.5f) to 0f,
            Rect(14f, 5f, 17f, 19f) to 1.2f,
            Rect(17.5f, 7f, 19.5f, 17f) to 1f,
            Rect(20f, 10.5f, 22f, 13.5f) to 0.8f,
        )
        .forEach { (rect, r) -> p.addRoundRect(RoundRect(rect, CornerRadius(r, r))) }
        return p
    }

/**
 * Cuerpo redondeado con dos renglones calados. El calado sale del relleno
 * par-impar: la forma interior invierte lo que ya estaba pintado.
 */
private val clipboard: Path
    get() {
        val p = Path()
        p.fillType = PathFillType.EvenOdd
        p.addRoundRect(RoundRect(Rect(8.5f, 2.5f, 15.5f, 6f), CornerRadius(1.5f, 1.5f)))
        p.addRoundRect(RoundRect(Rect(4.5f, 5f, 19.5f, 22f), CornerRadius(2.5f, 2.5f)))
        p.addRoundRect(RoundRect(Rect(9f, 9.5f, 15f, 11.5f), CornerRadius(1f, 1f)))
        p.addRoundRect(RoundRect(Rect(9f, 13.5f, 15f, 15.5f), CornerRadius(1f, 1f)))
        return p
    }

private val puntos: Path
    get() {
        val p = Path()
        listOf(6f, 12f, 18f).forEach { x ->
            p.addOval(Rect(x - 2.2f, 9.8f, x + 2.2f, 14.2f))
        }
        return p
    }
