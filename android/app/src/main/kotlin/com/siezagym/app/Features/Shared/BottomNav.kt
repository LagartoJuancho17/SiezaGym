package com.siezagym.app.Features.Shared

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

enum class AppTab(val label: String) {
    HOME("Inicio"),
    ROUTINES("Rutinas"),
    HISTORY("Historial"),
    PROGRESS("Progreso"),
    PROFILE("Perfil"),
}

/** Same 292 × 60 floating bar and 24-unit icon paths as iOS BottomNav.swift. */
@Composable
fun BottomNav(selection: AppTab, onSelect: (AppTab) -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier
            .width(292.dp)
            .height(60.dp)
            .shadow(15.dp, RoundedCornerShape(10.dp))
            .background(Color(0xFFB9B4B4), RoundedCornerShape(10.dp))
            .padding(4.dp)
            .selectableGroup()
    ) {
        AppTab.entries.forEachIndexed { index, tab ->
            Box(
                Modifier.weight(1f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (tab == selection) Color(0xFFF1602F) else Color.Transparent)
                    .selectable(tab == selection, role = Role.Tab, onClick = { onSelect(tab) })
                    .semantics { contentDescription = tab.label },
                contentAlignment = Alignment.Center,
            ) {
                Canvas(Modifier.size(22.dp)) {
                    val path =
                        Path().apply {
                            fillType = PathFillType.EvenOdd
                            fun rect(x: Float, y: Float, w: Float, h: Float, r: Float) {
                                addRoundRect(RoundRect(Rect(x, y, x + w, y + h), CornerRadius(r)))
                            }
                            when (tab) {
                                AppTab.HOME -> {
                                    rect(4.5f, 4.5f, 6.5f, 6.5f, 2f)
                                    rect(4.5f, 13f, 6.5f, 6.5f, 2f)
                                    rect(13f, 4.5f, 6.5f, 15f, 2.5f)
                                }
                                AppTab.ROUTINES -> {
                                    rect(2f, 10.5f, 2f, 3f, .8f)
                                    rect(4.5f, 7f, 2f, 10f, 1f)
                                    rect(7f, 5f, 3f, 14f, 1.2f)
                                    rect(9.5f, 10.5f, 5f, 3f, 0f)
                                    rect(14f, 5f, 3f, 14f, 1.2f)
                                    rect(17.5f, 7f, 2f, 10f, 1f)
                                    rect(20f, 10.5f, 2f, 3f, .8f)
                                }
                                AppTab.HISTORY -> {
                                    rect(8.5f, 2.5f, 7f, 3.5f, 1.5f)
                                    rect(4.5f, 5f, 15f, 17f, 2.5f)
                                    rect(9f, 9.5f, 6f, 2f, 1f)
                                    rect(9f, 13.5f, 6f, 2f, 1f)
                                }
                                AppTab.PROGRESS -> {
                                    rect(7.5f, 2.5f, 2f, 3.5f, 1f)
                                    rect(14.5f, 2.5f, 2f, 3.5f, 1f)
                                    rect(4.5f, 5f, 15f, 17f, 2.5f)
                                    moveTo(7f, 9.5f)
                                    lineTo(17f, 9.5f)
                                    lineTo(17f, 18f)
                                    quadraticTo(17f, 19.5f, 15.5f, 19.5f)
                                    lineTo(8.5f, 19.5f)
                                    quadraticTo(7f, 19.5f, 7f, 18f)
                                    close()
                                    listOf(9.5f, 13f, 16.5f).forEach {
                                        addOval(Rect(it - 1, 12.5f, it + 1, 14.5f))
                                    }
                                }
                                AppTab.PROFILE ->
                                    listOf(6f, 12f, 18f).forEach {
                                        addOval(Rect(it - 2.2f, 9.8f, it + 2.2f, 14.2f))
                                    }
                            }
                        }
                    scale(
                        size.width / 24f,
                        size.height / 24f,
                        pivot = androidx.compose.ui.geometry.Offset.Zero,
                    ) {
                        drawPath(path, Color.White)
                    }
                }
            }
            if (index < 4 && tab != selection && AppTab.entries[index + 1] != selection) {
                Box(Modifier.width(1.dp).fillMaxHeight().background(Color(0xFFAFAAA9)))
            }
        }
    }
}
