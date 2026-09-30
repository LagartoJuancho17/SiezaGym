package com.siezagym.app.Features.Routines

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.*
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import java.time.YearMonth

@Composable
fun RoutinesScreen(data: GymData, onOpen: (Routine) -> Unit) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Hero(190.dp) {
            Text("Rutinas", color = Color.White, fontSize = 40.sp, fontWeight = FontWeight.Bold)
        }
        Column(
            Modifier.padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (data.routines.isEmpty() && data.hasLoaded)
                SurfaceCard(padding = 24.dp) {
                    Text(
                        "Todavía no tenés rutinas.",
                        color = Theme.cardText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        "Creá una desde la web y aparece acá.",
                        color = Theme.cardMuted,
                        fontSize = 12.sp,
                    )
                }
            RoutineSchedule.group(data.routines).forEach { month ->
                key(month.id) {
                    var open by rememberSaveable {
                        mutableStateOf(month.id == YearMonth.now(TrainingCalendar.zone).toString())
                    }
                    SurfaceCard(Modifier.clickable { open = !open }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "▦  ${month.label}",
                                Modifier.weight(1f),
                                color = Theme.cardText,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                "${month.total} ${if(month.total==1) "rutina" else "rutinas"}  ${if(open) "⌃" else "⌄"}",
                                color = Theme.cardMuted,
                                fontSize = 12.sp,
                            )
                        }
                    }
                    if (open)
                        month.weeks.forEach { (week, routines) ->
                            key(week) {
                                var expanded by rememberSaveable { mutableStateOf(true) }
                                SurfaceCard(
                                    Modifier.padding(start = 10.dp).clickable {
                                        expanded = !expanded
                                    },
                                    padding = 10.dp,
                                ) {
                                    Row {
                                        Text(
                                            "Semana $week",
                                            Modifier.weight(1f),
                                            color = Theme.cardText,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                        Text(
                                            "${routines.size}  ${if(expanded) "⌃" else "⌄"}",
                                            color = Theme.cardMuted,
                                            fontSize = 12.sp,
                                        )
                                    }
                                }
                                if (expanded)
                                    routines.forEach { routine ->
                                        SurfaceCard(
                                            Modifier.padding(start = 10.dp).clickable {
                                                onOpen(routine)
                                            },
                                            padding = 0.dp,
                                        ) {
                                            Row(
                                                Modifier.heightIn(min = 72.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                routine.exercises
                                                    .firstNotNullOfOrNull { data.catalog[it.exerciseID] }
                                                    ?.let { Miniatura(it.mediaUrl, lado = 40.dp) }
                                                Column(
                                                    Modifier.weight(1f).padding(horizontal = 12.dp),
                                                    verticalArrangement = Arrangement.spacedBy(6.dp),
                                                ) {
                                                    Text(
                                                        routine.name,
                                                        color = Theme.cardText,
                                                        fontSize = 15.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        maxLines = 1,
                                                    )
                                                    if (routine.isAssigned)
                                                        Text(
                                                            "ASIGNADA",
                                                            color = Theme.accent,
                                                            fontSize = 9.sp,
                                                            fontWeight = FontWeight.Bold,
                                                        )
                                                    Text(
                                                        "${routine.exercises.size} ejercicios · ${routine.totalSets} series · ${RoutineSummary.estimatedMinutes(routine,data.catalog)} min",
                                                        color = Theme.cardMuted,
                                                        fontSize = 11.sp,
                                                    )
                                                }
                                                Text(
                                                    "›",
                                                    Modifier.padding(end = 12.dp),
                                                    color = Theme.cardMuted,
                                                )
                                            }
                                        }
                                    }
                            }
                        }
                }
            }
        }
    }
}

@Composable
fun RoutineDetailScreen(routine: Routine, data: GymData, onStart: () -> Unit) {
    Column(
        Modifier.fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SurfaceCard {
            WidgetHeader(if (routine.isAssigned) "Rutina asignada" else "Rutina")
            Text(
                routine.name,
                color = Theme.cardText,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Stat("${routine.exercises.size}", "ejercicios")
                Stat("${routine.totalSets}", "series")
                Stat("${RoutineSummary.estimatedMinutes(routine,data.catalog)}", "min")
            }
            if (routine.note.isNotEmpty())
                Text(routine.note, color = Theme.cardMuted, fontSize = 13.sp)
        }
        val distribution = RoutineSummary.muscleDistribution(routine, data.catalog)
        if (distribution.isNotEmpty())
            SurfaceCard {
                WidgetHeader("Reparto muscular")
                distribution.take(5).forEach { share ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(share.muscle.label, color = Theme.cardText, fontSize = 12.sp)
                        Text(
                            "${(share.pct*100).toInt()}%",
                            color = Theme.cardMuted,
                            fontSize = 12.sp,
                        )
                    }
                    WidgetMeter(share.pct)
                }
            }
        routine.exercises.forEach { item ->
            SurfaceCard(padding = 12.dp) {
                Text(
                    data.name(item.exerciseID),
                    color = Theme.cardText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                )
                val unit =
                    if (data.catalog[item.exerciseID]?.registrationType?.isTimeBased == true) "s"
                    else " reps"
                Text(
                    buildString {
                        append("${item.targetSets} × ${item.targetReps}$unit")
                        item.targetWeight?.let { append(" · ${number(it)} kg") }
                        item.targetRIR?.let { append(" · RIR $it") }
                    },
                    color = Theme.cardMuted,
                    fontSize = 12.sp,
                )
                if (item.techniqueNote.isNotEmpty())
                    Text(
                        item.techniqueNote,
                        color = Theme.cardMuted,
                        fontSize = 12.sp,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    )
            }
        }
        AccentButton("Empezar entrenamiento", Modifier.fillMaxWidth(), onClick = onStart)
    }
}
