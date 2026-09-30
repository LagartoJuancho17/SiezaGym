package com.siezagym.app.Features.Home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.*
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import java.time.LocalDate

@Composable
fun HomeScreen(data: GymData, onStart: (Routine?) -> Unit) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Hero(300.dp) {
            Text(
                "GO TIME!",
                color = Theme.accent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.8.sp,
            )
            Text(
                data.featuredRoutine?.name ?: "Entrenamiento libre",
                color = Color.White,
                fontSize = 38.sp,
                lineHeight = 42.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
            )
            AccentButton("▶  Empezar") { onStart(data.featuredRoutine) }
        }
        Column(
            Modifier.padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            WeekStrip(data.trainedDayKeys, data.streak)
            SurfaceCard {
                WidgetHeader("Volumen por músculo")
                val volume = data.muscleVolume
                if (!volume.hasData) EmptyWidget("Registrá un entrenamiento para ver el reparto.")
                else {
                    WidgetValue(number(volume.totalKg), "kg totales")
                    volume.rows.forEach { row ->
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(
                                row.label,
                                color = Theme.cardText,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                "${(row.pct*100).toInt()}%",
                                color = Theme.cardMuted,
                                fontSize = 12.sp,
                            )
                        }
                        WidgetMeter(row.pct)
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SurfaceCard(Modifier.weight(1f)) {
                    val goal = data.calories
                    WidgetHeader("Calorías semana")
                    WidgetValue(number(goal.kcal), "kcal")
                    WidgetMeter(goal.pct / 100.0)
                    Text(
                        "${goal.label} · meta ${goal.goal}",
                        color = Theme.cardMuted,
                        fontSize = 10.sp,
                    )
                    if (goal.usesDefaultWeight)
                        Text(
                            "Estimado con 75 kg. Cargá tu peso en Perfil.",
                            color = Theme.cardMuted,
                            fontSize = 9.sp,
                        )
                }
                SurfaceCard(Modifier.weight(1f)) {
                    val intensity = data.intensity
                    WidgetHeader("Intensidad")
                    WidgetValue("${intensity.pct}", "% 1RM")
                    WidgetMeter(intensity.pct / 100.0)
                    Text(
                        intensity.label,
                        color = if (intensity.hasData) Theme.accent else Theme.cardMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SurfaceCard(Modifier.weight(1f)) {
                    val balance = data.pushPull
                    WidgetHeader("Empuje / tracción")
                    WidgetValue("${balance.pct}", "%")
                    WidgetMeter(balance.pct / 100.0)
                    Text(
                        balance.label,
                        color = if (balance.hasData) Theme.accent else Theme.cardMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "${balance.pushKg} / ${balance.pullKg} kg",
                        color = Theme.cardMuted,
                        fontSize = 10.sp,
                    )
                }
                SurfaceCard(Modifier.weight(1f)) {
                    val completion = data.completion
                    WidgetHeader("Series completadas")
                    WidgetValue("${completion.pct}", "%")
                    WidgetMeter(completion.pct / 100.0)
                    Text(
                        if (completion.hasData) "${completion.completed} de ${completion.total}"
                        else "Sin datos",
                        color = Theme.cardMuted,
                        fontSize = 10.sp,
                    )
                }
            }
            SurfaceCard {
                WidgetHeader("Volumen por día")
                val days = data.weekdayVolume
                if (days.none { it.kg > 0 }) EmptyWidget("Todavía no hay sesiones esta semana.")
                else
                    Row(
                        Modifier.fillMaxWidth().height(92.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        days.forEach { day ->
                            Column(
                                Modifier.weight(1f),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Box(
                                    Modifier.fillMaxWidth()
                                        .height(maxOf(4f, 70 * day.pct.toFloat()).dp)
                                        .background(
                                            if (day.pct >= 1) Theme.accent else Theme.chartDark,
                                            RoundedCornerShape(3.dp),
                                        )
                                )
                                Text(
                                    day.label,
                                    color = Theme.cardMuted,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    }
            }
            SurfaceCard {
                WidgetHeader("Volumen por sesión")
                val trend = data.volumeTrend
                if (!trend.hasData) EmptyWidget("Necesitás al menos una sesión registrada.")
                else {
                    WidgetValue(number(trend.averageKg), "kg promedio")
                    val peak = (trend.points.maxOrNull() ?: 1).coerceAtLeast(1)
                    Row(
                        Modifier.fillMaxWidth().height(64.dp),
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        trend.points.forEachIndexed { index, kg ->
                            Box(
                                Modifier.weight(1f)
                                    .height(maxOf(4f, 60f * kg / peak).dp)
                                    .background(
                                        if (index == trend.points.lastIndex) Theme.accent
                                        else Theme.chartDark,
                                        RoundedCornerShape(3.dp),
                                    )
                            )
                        }
                    }
                }
            }
            SurfaceCard {
                WidgetHeader("Zonas de intensidad")
                val zones = data.zones
                @Composable
                fun color(zone: HomeMetrics.Zone) =
                    when (zone) {
                        HomeMetrics.Zone.PEAK -> Theme.accent
                        HomeMetrics.Zone.HIGH -> Theme.accentLight
                        HomeMetrics.Zone.MED -> Theme.chartDark
                        HomeMetrics.Zone.LIGHT -> Theme.chartLight
                    }
                if (!zones.hasData) EmptyWidget("Cargá pesos para medir la intensidad.")
                else {
                    Row(
                        Modifier.fillMaxWidth().height(20.dp).clip(RoundedCornerShape(4.dp)),
                        horizontalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        HomeMetrics.Zone.entries
                            .reversed()
                            .filter { zones.count(it) > 0 }
                            .forEach { zone ->
                                Box(
                                    Modifier.weight(zones.count(zone).toFloat())
                                        .fillMaxHeight()
                                        .background(color(zone))
                                )
                            }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        HomeMetrics.Zone.entries
                            .reversed()
                            .filter { zones.count(it) > 0 }
                            .forEach { zone ->
                                Text(
                                    "● ${zone.label} ${zones.count(zone)}",
                                    color = Theme.cardMuted,
                                    fontSize = 9.sp,
                                )
                            }
                    }
                }
            }
        }
    }
}

@Composable
private fun WeekStrip(trained: Set<String>, streak: Int) {
    val today = LocalDate.now(TrainingCalendar.zone)
    val monday = today.minusDays((today.dayOfWeek.value - 1).toLong())
    SurfaceCard(padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.weight(1f)) { WidgetHeader("Tu semana") }
            if (streak > 0)
                Text(
                    "$streak ${if(streak==1) "día" else "días"}",
                    color = Theme.accent,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                )
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            repeat(7) { offset ->
                val day = monday.plusDays(offset.toLong())
                Column(
                    Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Text(
                        TrainingCalendar.dayLabels[offset],
                        color = Theme.cardMuted,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Box(
                        Modifier.size(30.dp)
                            .background(
                                if (day == today) Theme.accent else Color.Transparent,
                                CircleShape,
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "${day.dayOfMonth}",
                            color = if (day == today) Color.White else Theme.cardText,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    Box(
                        Modifier.size(5.dp)
                            .background(
                                if (TrainingCalendar.dayKey(day) in trained) Theme.accent
                                else Color.Transparent,
                                CircleShape,
                            )
                    )
                }
            }
        }
    }
}
