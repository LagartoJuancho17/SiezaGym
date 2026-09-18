package com.siezagym.app.Features.Shared

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CapsuleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.LocalD2Theme

/** Barra inferior, igual a la de la web: una pastilla de vidrio flotando, con
 *  la sección activa marcada con el sólido del tema y su nombre escrito. */
@Composable
fun BottomNav(
    seleccion: AppTab,
    onSeleccionar: (AppTab) -> Unit,
) {
    val tema = LocalD2Theme.current
    Row(
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .padding(bottom = 16.dp),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(5.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .shadow(18.dp, CapsuleShape, spotColor = Color.Black.copy(alpha = 0.28f), ambientColor = Color.Black.copy(alpha = 0.28f))
                .background(tema.vidrio(1), CapsuleShape)
                .border(1.dp, tema.bordeFuerte, CapsuleShape)
                .padding(4.dp),
        ) {
            AppTab.entries.forEach { tab ->
                BotonTab(
                    tab = tab,
                    activo = tab == seleccion,
                    onSeleccionar = { onSeleccionar(tab) },
                )
            }
        }
    }
}

private val alturaBoton = 44

@Composable
private fun BotonTab(
    tab: AppTab,
    activo: Boolean,
    onSeleccionar: () -> Unit,
) {
    val tema = LocalD2Theme.current
    val background by animateColorAsState(
        if (activo) tema.solido else Color.Transparent,
        label = "tabBg",
    )
    val iconBed by animateColorAsState(
        if (activo) tema.sobreSolido else tema.vidrio(1),
        label = "iconBed",
    )
    val iconTint by animateColorAsState(
        if (activo) tema.solido else tema.texto,
        label = "iconTint",
    )
    val textTint by animateColorAsState(
        if (activo) tema.sobreSolido else Color.Transparent,
        label = "tabText",
    )

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
        modifier = Modifier
            .background(background, CapsuleShape)
            .clickable(
                interactionSource = MutableInteractionSource(),
                indication = null,
                onClick = onSeleccionar,
            )
            .height(alturaBoton.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.weight(1f),
        ) {
            if (activo) {
                Text(
                    tab.label,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = textTint,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(start = 14.dp, end = 6.dp),
                )
            } else {
                Spacer(Modifier.weight(1f))
            }
        }
        // El icono en su disco, igual que en la web (se pinta sobre el sólido
        // con el color del texto que va encima).
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(36.dp)
                .background(iconBed, CapsuleShape),
        ) {
            Icon(
                if (activo) tab.selectedIcon else tab.unselectedIcon,
                contentDescription = tab.label,
                tint = iconTint,
                modifier = Modifier.size(22.dp),
            )
        }
        if (activo) {
            Spacer(Modifier.width(10.dp))
        }
    }
}

/** Aire abajo para que el contenido no quede atrás de la barra flotante. */
object NavInset {
    const val bottom: Int = 84
}