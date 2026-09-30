package com.siezagym.app.Features.Home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.TrainingCalendar
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * La semana de entrenamiento: los siete días, con los entrenados marcados en el
 * sólido del tema. Se puede correr para atrás para ver las anteriores; hacia
 * adelante no, porque del futuro no hay nada que mirar.
 */
@Composable
fun SemanaCard(trainedDayKeys: Set<String>, streak: Int) {
    var offset by remember { mutableIntStateOf(0) }
    val hoy = ZonedDateTime.now(TrainingCalendar.zone)
    val hoyKey = TrainingCalendar.dayKey(hoy)
    val lunes =
        hoy.minusDays(TrainingCalendar.weekdayIndex(hoy).toLong()).plusDays(offset * 7L)

    val dias =
        (0..6).map { i ->
            val fecha = lunes.plusDays(i.toLong())
            val key = TrainingCalendar.dayKey(fecha)
            DiaSemana(
                inicial = TrainingCalendar.dayLabels[i],
                numero = fecha.dayOfMonth,
                entrenado = trainedDayKeys.contains(key),
                esHoy = key == hoyKey,
                futuro = key > hoyKey,
            )
        }

    GlassCard(radius = 26f) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Flecha(Icons.AutoMirrored.Filled.KeyboardArrowLeft, true) { offset -= 1 }
                Text(
                    rango(offset, lunes),
                    Modifier.weight(1f),
                    color = tema.texto,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Flecha(Icons.AutoMirrored.Filled.KeyboardArrowRight, offset < 0) { offset += 1 }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                dias.forEach { dia ->
                    Column(
                        Modifier.weight(1f),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(7.dp),
                    ) {
                        Text(dia.inicial, color = tema.texto3, fontSize = 10.sp)
                        Box(
                            Modifier
                                .size(34.dp)
                                .alpha(if (dia.futuro) 0.35f else 1f)
                                .then(
                                    if (dia.entrenado) Modifier.clip(CircleShape).background(tema.solido)
                                    else Modifier
                                )
                                .border(
                                    if (dia.esHoy) 2.dp else 1.dp,
                                    if (dia.esHoy) tema.texto else androidx.compose.ui.graphics.Color.Transparent,
                                    CircleShape,
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                "${dia.numero}",
                                color = when {
                                    dia.entrenado -> tema.sobreSolido
                                    dia.esHoy -> tema.texto
                                    else -> tema.texto2
                                },
                                fontSize = 13.sp,
                                fontWeight = if (dia.entrenado) FontWeight.Medium else FontWeight.Normal,
                            )
                        }
                    }
                }
            }

            Text(
                pie(dias.count { it.entrenado }, streak),
                color = tema.texto2,
                fontSize = 11.sp,
            )
        }
    }
}

private data class DiaSemana(
    val inicial: String,
    val numero: Int,
    val entrenado: Boolean,
    val esHoy: Boolean,
    val futuro: Boolean,
)

@Composable
private fun Flecha(
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    habilitada: Boolean,
    onClick: () -> Unit,
) {
    Box(
        Modifier
            .size(32.dp)
            .clip(CircleShape)
            .clickable(enabled = habilitada, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            icono,
            null,
            tint = if (habilitada) tema.texto2 else tema.texto3.copy(alpha = 0.3f),
            modifier = Modifier.size(18.dp),
        )
    }
}

/** "Esta semana", o el rango de fechas cuando se está mirando otra. */
private fun rango(offset: Int, lunes: ZonedDateTime): String {
    if (offset == 0) return "Esta semana"
    val fin = lunes.plusDays(6)
    val mes = DateTimeFormatter.ofPattern("MMM", Locale.forLanguageTag("es-AR"))
    return "${lunes.dayOfMonth} ${mes.format(lunes)} – ${fin.dayOfMonth} ${mes.format(fin)}"
}

private fun pie(entrenados: Int, streak: Int): String {
    val dias = if (entrenados == 1) "1 día entrenado" else "$entrenados días entrenados"
    val racha = when {
        streak <= 0 -> ""
        streak == 1 -> " · 1 día seguido"
        else -> " · $streak días seguidos"
    }
    return "$dias$racha"
}
