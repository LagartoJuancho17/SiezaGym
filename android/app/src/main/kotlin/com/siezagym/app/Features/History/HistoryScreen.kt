package com.siezagym.app.Features.History

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Services.GymData
import java.time.format.DateTimeFormatter
import java.util.Locale

fun sessionDate(session: WorkoutSession): String =
    session.finishedAt?.format(
        DateTimeFormatter.ofPattern("d MMM yyyy", Locale.forLanguageTag("es-AR"))
    ) ?: "Sesión"

@Composable
fun HistoryScreen(data: GymData, onOpen: (WorkoutSession) -> Unit) {
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (data.sessions.isEmpty() && data.hasLoaded)
            item {
                SurfaceCard(padding = 24.dp) {
                    Text(
                        "Todavía no registraste entrenamientos.",
                        color = Theme.cardMuted,
                        fontSize = 14.sp,
                    )
                }
            }
        items(data.sessions, key = { it.id }) { session ->
            SurfaceCard(Modifier.clickable { onOpen(session) }, padding = 12.dp) {
                Row {
                    Text(
                        session.routineName?.ifBlank { null } ?: "Entrenamiento libre",
                        Modifier.weight(1f),
                        color = Theme.cardText,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(sessionDate(session), color = Theme.cardMuted, fontSize = 11.sp)
                }
                Text(
                    "${session.totalSetsCompleted} series    ${number(session.totalVolumeKg.toInt())} kg    ${HomeMetrics.sessionSeconds(session)/60} min",
                    color = Theme.cardMuted,
                    fontSize = 11.sp,
                )
            }
        }
    }
}

@Composable
fun SessionDetailScreen(session: WorkoutSession, data: GymData) {
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SurfaceCard {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Stat("${session.totalSetsCompleted}", "series")
                    Stat(number(session.totalVolumeKg.toInt()), "kg")
                    Stat("${HomeMetrics.sessionSeconds(session)/60}", "min")
                    Stat("${HomeMetrics.calories(session,data.profile?.bodyWeightKg)}", "kcal est.")
                }
            }
        }
        items(session.exercises) { exercise ->
            SurfaceCard(padding = 12.dp) {
                Text(
                    data.name(exercise.exerciseID),
                    color = Theme.cardText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                )
                exercise.sets.forEach { set ->
                    Row(
                        Modifier.fillMaxWidth().heightIn(min = 28.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("Serie ${set.setNumber}", color = Theme.cardMuted, fontSize = 12.sp)
                        if (set.failed) Text("fallada", color = Theme.accentHover, fontSize = 10.sp)
                        Text(
                            "${number(set.weight)} kg × ${set.reps}",
                            color = Theme.cardText,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            textDecoration = if (set.failed) TextDecoration.LineThrough else null,
                        )
                    }
                }
            }
        }
    }
}
