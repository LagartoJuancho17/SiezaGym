package com.siezagym.app.Features.Profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Services.GymData

/** Volumen de los últimos siete días, por semana y, opcionalmente, últimas sesiones. */
@Composable
fun VolumeScreen(data: GymData, showSessionTrend: Boolean = true) {
    val barras = ProgressMetrics.volumeByWeek(data.sessions, weeks = 12)
    val porDia = ProgressMetrics.volumeByLastSevenDays(data.sessions)
    val tendencia = data.volumeTrend

    Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
        Column {
            SectionLabel("Volumen por día de la semana")
            Spacer(Modifier.height(10.dp))
            GlassCard {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        Modifier.fillMaxWidth().height(90.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        porDia.forEach { dia ->
                            Column(
                                Modifier.weight(1f),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Box(
                                    Modifier.fillMaxWidth()
                                        .height(maxOf(4.dp, (72 * dia.pct).dp))
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(
                                            if (dia.kg > 0) tema.solido
                                            else tema.texto3.copy(alpha = .35f)
                                        )
                                )
                                Text(
                                    dia.label,
                                    color = tema.texto3,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                    Text("Últimos 7 días · hoy al final", color = tema.texto3, fontSize = 10.sp)
                    porDia
                        .maxByOrNull { it.kg }
                        ?.takeIf { it.kg > 0 }
                        ?.let { mejor ->
                            Text(
                                "${mejor.label.replaceFirstChar { c -> c.uppercase() }} concentra más volumen",
                                color = tema.texto2,
                                fontSize = 10.sp,
                            )
                        }
                }
            }
        }

        Column {
            SectionLabel("Volumen por semana")
            Spacer(Modifier.height(10.dp))
            GlassCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        Modifier.fillMaxWidth().height(96.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        barras.forEach { barra ->
                            Box(
                                Modifier.weight(1f)
                                    .height(maxOf(4.dp, (96 * barra.height).dp))
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(
                                        if (barra.isEmpty) tema.texto3.copy(alpha = .35f)
                                        else tema.solido
                                    )
                            )
                        }
                    }
                    Row(Modifier.fillMaxWidth()) {
                        Nota("hace ${barras.size} semanas", Modifier.weight(1f))
                        val mejor = barras.maxOfOrNull { it.kg } ?: 0.0
                        Nota(
                            if (mejor > 0) "mejor ${ProgressMetrics.formatKg(mejor)}"
                            else "sin volumen todavía",
                            Modifier.weight(1f),
                            centrado = true,
                            atenuado = true,
                        )
                        Nota("esta semana", Modifier.weight(1f), derecha = true)
                    }
                }
            }
        }

        if (showSessionTrend && tendencia.hasData) {
            Column {
                SectionLabel("Últimas sesiones")
                Spacer(Modifier.height(10.dp))
                GlassCard {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        val maximo = tendencia.points.maxOrNull()?.toDouble() ?: 0.0
                        Row(
                            Modifier.fillMaxWidth().height(72.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.Bottom,
                        ) {
                            tendencia.points.forEach { kg ->
                                Box(
                                    Modifier.weight(1f)
                                        .height(
                                            if (maximo > 0) maxOf(4.dp, (72 * kg / maximo).dp)
                                            else 4.dp
                                        )
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(
                                            if (kg > 0) tema.solido
                                            else tema.texto3.copy(alpha = .35f)
                                        )
                                )
                            }
                        }
                        Row(Modifier.fillMaxWidth()) {
                            Nota("${tendencia.points.size} entrenamientos", Modifier.weight(1f))
                            Nota(
                                "promedio ${ProgressMetrics.formatKg(tendencia.averageKg.toDouble())}",
                                Modifier.weight(1f),
                                derecha = true,
                            )
                        }
                    }
                }
            }
        }
    }
}

/** La grilla de días entrenados, estilo contribuciones de GitHub. */
@Composable
fun TrainedDaysScreen(data: GymData) {
    val grilla = ProgressMetrics.trainedGrid(data.trainedDayKeys, weeks = 26)
    Column {
        GlassCard {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    Modifier.fillMaxWidth().height(96.dp),
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    grilla.columns.forEach { columna ->
                        Column(
                            Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(3.dp),
                        ) {
                            columna.forEach { dia ->
                                Box(
                                    Modifier.weight(1f)
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(2.5.dp))
                                        .background(
                                            if (dia.trained) tema.solido
                                            else tema.texto3.copy(alpha = .3f)
                                        )
                                        .alpha(if (dia.isFuture) 0.25f else 1f)
                                )
                            }
                        }
                    }
                }
                Row(Modifier.fillMaxWidth()) {
                    Nota(
                        if (grilla.total == 1) "1 día entrenado"
                        else "${grilla.total} días entrenados",
                        Modifier.weight(1f),
                    )
                    Nota(
                        "últimas ${grilla.columns.size} semanas",
                        Modifier.weight(1f),
                        derecha = true,
                    )
                }
            }
        }
    }
}

/**
 * Dónde fue el volumen, repartido por grupo muscular. Usa el cálculo completo (hasta 8 filas) y no
 * el resumen de tres filas de Inicio.
 */
@Composable
fun MuscleVolumeScreen(data: GymData) {
    val musculos = HomeMetrics.volumeByMuscleGroup(data.sessions, catalog = data.catalog, limit = 8)
    Column {
        if (musculos.rows.isEmpty()) {
            Vacio("Todavía no hay volumen para repartir entre músculos.")
        } else {
            GlassCard {
                Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                    musculos.rows.forEach { fila ->
                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Row(Modifier.fillMaxWidth()) {
                                Text(
                                    fila.label,
                                    Modifier.weight(1f),
                                    color = tema.texto,
                                    fontSize = 13.sp,
                                )
                                Text(
                                    ProgressMetrics.formatKg(fila.kg.toDouble()),
                                    color = tema.texto2,
                                    fontSize = 13.sp,
                                )
                            }
                            WidgetMeter(fila.pct)
                        }
                    }
                    Text(
                        "Repartido sobre tus últimos ${data.sessions.size} entrenamientos",
                        color = tema.texto3,
                        fontSize = 10.sp,
                    )
                }
            }
        }
    }
}

/** El balance entre volumen de empuje y de tracción. */
@Composable
fun PushPullScreen(data: GymData) {
    val balance = data.pushPull
    Column {
        if (!balance.hasData) {
            Vacio("Todavía no hay ejercicios de empuje ni de tracción registrados.")
        } else {
            GlassCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(Modifier.fillMaxWidth().height(26.dp).clip(RoundedCornerShape(9.dp))) {
                        Box(
                            Modifier.fillMaxHeight()
                                .weight(balance.pct.coerceAtLeast(1).toFloat())
                                .background(tema.solido)
                        )
                        Box(
                            Modifier.fillMaxHeight()
                                .weight((100 - balance.pct).coerceAtLeast(1).toFloat())
                                .background(tema.vidrio(3))
                        )
                    }
                    Row(Modifier.fillMaxWidth()) {
                        Nota(
                            "empuje ${ProgressMetrics.formatKg(balance.pushKg.toDouble())}",
                            Modifier.weight(1f),
                        )
                        Nota(balance.label, Modifier.weight(1f), centrado = true, atenuado = true)
                        Nota(
                            "tracción ${ProgressMetrics.formatKg(balance.pullKg.toDouble())}",
                            Modifier.weight(1f),
                            derecha = true,
                        )
                    }
                }
            }
        }
    }
}

/**
 * Una fila por ejercicio: cuántas veces lo entrenaste y tu mejor 1RM estimado. Con pantalla propia
 * entran más de los 12 que se mostraban antes.
 */
@Composable
fun ExerciseHistoryScreen(data: GymData) {
    val ejercicios = ProgressMetrics.byExercise(data.sessions, limit = 30)
    Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (ejercicios.isEmpty()) {
            Vacio("Todavía no terminaste ningún entrenamiento.")
        } else {
            PanelLista {
                ejercicios.forEachIndexed { indice, fila ->
                    if (indice > 0) Separador()
                    FilaLista(
                        nombre = data.name(fila.exerciseID),
                        detalle =
                            if (fila.sessions == 1) "1 entrenamiento"
                            else "${fila.sessions} entrenamientos",
                        valor =
                            if (fila.bestOneRepMax > 0) "${number(fila.bestOneRepMax)} kg"
                            else null,
                        unidad = if (fila.bestOneRepMax > 0) "1RM est." else null,
                        miniatura = data.catalog[fila.exerciseID]?.thumbnailUrl,
                        chevron = false,
                    )
                }
            }
            if (ejercicios.any { data.catalog[it.exerciseID]?.thumbnailUrl != null }) CreditoGifs()
        }
    }
}

/** Una tarjeta de la grilla de progreso: ícono, título y el dato clave. */
@Composable
fun TarjetaProgreso(icono: ImageVector, titulo: String, valor: String, onClick: () -> Unit) {
    GlassCard(modifier = Modifier.clickable(onClick = onClick), padding = 14.dp) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Icon(icono, null, tint = tema.solido, modifier = Modifier.size(15.dp))
                Spacer(Modifier.weight(1f))
                Icon(
                    Icons.Filled.ChevronRight,
                    null,
                    tint = tema.texto3,
                    modifier = Modifier.size(11.dp),
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    titulo,
                    color = tema.texto,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    valor,
                    color = tema.texto2,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

/** Texto chico al pie de un gráfico. */
@Composable
private fun Nota(
    texto: String,
    modifier: Modifier = Modifier,
    centrado: Boolean = false,
    derecha: Boolean = false,
    atenuado: Boolean = false,
) {
    Text(
        texto,
        modifier,
        color = if (atenuado) tema.texto3 else tema.texto2,
        fontSize = 10.sp,
        textAlign =
            when {
                centrado -> androidx.compose.ui.text.style.TextAlign.Center
                derecha -> androidx.compose.ui.text.style.TextAlign.End
                else -> androidx.compose.ui.text.style.TextAlign.Start
            },
    )
}
