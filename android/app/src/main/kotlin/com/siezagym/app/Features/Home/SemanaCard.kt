package com.siezagym.app.Features.Home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.Domain.TrainingCalendar
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZonedDateTime

/** La semana, igual a la de la web: siete días con flechas para moverse, el
 *  día entrenado con el sólido del tema y hoy con anillo. */
@Composable
fun SemanaCard(
    entrenados: Set<String>,
    racha: Int,
    hoy: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone),
) {
    val tema = LocalD2Theme.current
    var offset by remember { mutableIntStateOf(0) }

    val lunes = hoy.toLocalDate().minusDays((hoy.dayOfWeek.value - 1).toLong()).plusDays(offset * 7L)
    val hoyKey = TrainingCalendar.dayKey(hoy.toLocalDate())

    val dias = (0..6).map { i ->
        val fecha = lunes.plusDays(i.toLong())
        val key = TrainingCalendar.dayKey(fecha)
        DiaSemana(
            key = key,
            inicial = TrainingCalendar.dayLabels[i],
            numero = fecha.dayOfMonth,
            entrenado = entrenados.contains(key),
            esHoy = key == hoyKey,
            futuro = key > hoyKey,
        )
    }
    val entrenadosEnSemana = dias.count { it.entrenado }

    GlassCard(paddingInterno = 16.dp, radius = 26.dp) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Flecha(Icons.AutoMirrored.Filled.KeyboardArrowLeft, "Semana anterior", habilitada = true) { offset -= 1 }
                Text(
                    rango(lunes, offset),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                    modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Flecha(Icons.AutoMirrored.Filled.KeyboardArrowRight, "Semana siguiente", habilitada = offset < 0) { offset += 1 }
            }

            Spacer(Modifier.height(14.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.fillMaxWidth()) {
                dias.forEach { dia ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(dia.inicial, fontSize = 10.sp, color = tema.texto3)
                        Spacer(Modifier.height(7.dp))
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(34.dp),
                        ) {
                            if (dia.entrenado) {
                                Box(
                                    Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(tema.solido),
                                )
                            }
                            Text(
                                "${dia.numero}",
                                fontSize = 13.sp,
                                fontWeight = if (dia.entrenado) FontWeight.Medium else FontWeight.Normal,
                                color = color(dia, tema.solido, tema.sobreSolido, tema.texto, tema.texto2),
                            )
                            if (dia.esHoy) {
                                Box(
                                    Modifier
                                        .size(34.dp)
                                        .border(
                                            width = if (dia.entrenado) 2.dp else 1.dp,
                                            color = tema.texto,
                                            shape = CircleShape,
                                        ),
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                val base = if (entrenadosEnSemana == 0) {
                    "Sin entrenamientos esta semana."
                } else {
                    "${entrenadosEnSemana} ${if (entrenadosEnSemana == 1) "día entrenado" else "días entrenados"}"
                }
                if (entrenadosEnSemana > 0 && offset == 0 && racha > 0) {
                    Icon(
                        Icons.Filled.LocalFireDepartment,
                        contentDescription = null,
                        tint = tema.texto2,
                        modifier = Modifier.size(14.dp),
                    )
                    Spacer(Modifier.width(5.dp))
                    Text(
                        "$base · $racha ${if (racha == 1) "día seguido" else "días seguidos"}",
                        fontSize = 11.sp,
                        color = tema.texto2,
                    )
                } else {
                    Text(base, fontSize = 11.sp, color = tema.texto2)
                }
            }
        }
    }
}

private data class DiaSemana(
    val key: String,
    val inicial: String,
    val numero: Int,
    val entrenado: Boolean,
    val esHoy: Boolean,
    val futuro: Boolean,
)

private fun color(dia: DiaSemana, solido: Color, sobreSolido: Color, texto: Color, texto2: Color): Color {
    if (dia.entrenado) return sobreSolido
    if (dia.esHoy) return texto
    return if (dia.futuro) texto2.copy(alpha = 0.35f) else texto2
}

private fun rango(lunes: LocalDate, offset: Int): String {
    if (offset == 0) return "Esta semana"
    val fin = lunes.plusDays(6)
    val meses = listOf("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic")
    return if (lunes.month == fin.month) {
        "${lunes.dayOfMonth} – ${fin.dayOfMonth} ${meses[lunes.monthValue - 1]}"
    } else {
        "${lunes.dayOfMonth} ${meses[lunes.monthValue - 1]} – ${fin.dayOfMonth} ${meses[fin.monthValue - 1]}"
    }
}

@Composable
private fun Flecha(
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    descripcion: String,
    habilitada: Boolean,
    accion: () -> Unit,
) {
    val tema = LocalD2Theme.current
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .clickable(enabled = habilitada, onClick = accion)
            .border(1.dp, if (habilitada) tema.borde else Color.Transparent, CircleShape),
    ) {
        Icon(
            icono,
            contentDescription = descripcion,
            tint = if (habilitada) tema.texto else tema.texto.copy(alpha = 0.3f),
            modifier = Modifier.size(18.dp),
        )
    }
}