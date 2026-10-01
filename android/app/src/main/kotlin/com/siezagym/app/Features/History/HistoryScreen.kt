package com.siezagym.app.Features.History

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.Epley
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Services.GymData
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

fun sessionDate(session: WorkoutSession): String =
    session.finishedAt?.format(
        DateTimeFormatter.ofPattern("d MMM yyyy · HH:mm", Locale.forLanguageTag("es-AR"))
    ) ?: "Sin fecha"

private fun duration(session: WorkoutSession): String {
    val minutes = (HomeMetrics.sessionSeconds(session) / 60.0).roundToInt()
    return if (minutes < 60) "$minutes min" else "${minutes / 60}h ${minutes % 60}min"
}

/** Contenido del único scroll de Pantalla; no anidar otra lista desplazable. */
@Composable
fun HistoryScreen(data: GymData, onOpen: (WorkoutSession) -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = 24.dp)) {
        if (data.sessions.isEmpty() && data.hasLoaded) {
            Vacio("Todavía no terminaste ningún entrenamiento.")
        } else if (data.sessions.isNotEmpty()) {
            PanelLista {
                data.sessions.forEachIndexed { index, session ->
                    if (index > 0) Separador()
                    val date =
                        session.finishedAt?.format(
                            DateTimeFormatter.ofPattern("EEE d MMM", Locale.forLanguageTag("es-AR"))
                        ) ?: "Sin fecha"
                    FilaLista(
                        nombre = session.routineName?.ifBlank { null } ?: "Sesión libre",
                        detalle =
                            "$date · ${duration(session)} · ${session.totalSetsCompleted} series",
                        valor = "${number(session.totalVolumeKg.roundToInt())} kg",
                        unidad = "volumen",
                        chevron = false,
                        onClick = { onOpen(session) },
                    )
                }
            }
        }
    }
}

@Composable
fun SessionDetailScreen(session: WorkoutSession, data: GymData) {
    Column(Modifier.fillMaxWidth().padding(top = 20.dp)) {
        StatsCard(
            listOf(
                duration(session) to "duración",
                "${session.totalSetsCompleted}" to "series",
                "${number(session.totalVolumeKg.roundToInt())} kg" to "volumen",
            )
        )
        Spacer(Modifier.height(24.dp))
        SectionLabel("Ejercicios realizados")
        Spacer(Modifier.height(10.dp))
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            session.exercises.forEach { exercise ->
                GlassCard(padding = 16.dp) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(13.dp),
                        ) {
                            Miniatura(data.catalog[exercise.exerciseID]?.thumbnailUrl, lado = 64.dp)
                            Text(
                                data.name(exercise.exerciseID),
                                color = tema.texto,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            exercise.sets.forEach { set ->
                                Row(
                                    Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Text(
                                        "Serie ${set.setNumber}",
                                        Modifier.width(58.dp),
                                        color = tema.texto2,
                                        fontSize = 12.sp,
                                    )
                                    Column(
                                        Modifier.weight(1f),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                    ) {
                                        Text(
                                            "${number(set.weight)}kg × ${set.reps}",
                                            color = tema.texto,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Medium,
                                        )
                                        if (set.failed)
                                            Text("fallada", color = tema.texto2, fontSize = 11.sp)
                                    }
                                    Text(
                                        if (set.failed) "sin marca"
                                        else
                                            "${number(Epley.estimatedOneRepMax(set.weight, set.reps))} kg · 1RM est.",
                                        Modifier.width(105.dp),
                                        color = tema.texto3,
                                        fontSize = 11.sp,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.End,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        if (session.exercises.any { data.catalog[it.exerciseID]?.thumbnailUrl != null })
            CreditoGifs()
    }
}
