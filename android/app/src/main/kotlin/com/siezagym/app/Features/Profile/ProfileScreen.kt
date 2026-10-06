package com.siezagym.app.Features.Profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Services.GymData

@Composable
fun ProfileScreen(
    data: GymData,
    onSignOut: () -> Unit,
    onOpen: (String) -> Unit,
) {
    val totalSeries = data.sessions.sumOf { it.totalSetsCompleted }
    val exerciseCount = ProgressMetrics.byExercise(data.sessions, limit = Int.MAX_VALUE).size
    Column(
        Modifier.fillMaxWidth().padding(top = 20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Identidad(data.profile) { onOpen("perfil/editar") }
            StatsCard(listOf(
                "${data.sessions.size}" to if (data.sessions.size == 1) "entrenamiento" else "entrenamientos",
                "$totalSeries" to if (totalSeries == 1) "serie" else "series",
                "${data.streak}" to if (data.streak == 1) "día seguido" else "días seguidos",
            ))
        }
        Column {
            SectionLabel("Días entrenados")
            Spacer(Modifier.height(10.dp))
            TrainedDaysScreen(data)
        }
        Column {
            VolumeScreen(data, showSessionTrend = false)
        }
        Column {
            SectionLabel("Volumen por músculo")
            Spacer(Modifier.height(10.dp))
            MuscleVolumeScreen(data)
        }
        Column {
            SectionLabel("Empuje y tracción")
            Spacer(Modifier.height(10.dp))
            PushPullScreen(data)
        }
        PanelLista {
            FilaLista(
                nombre = "Por ejercicio",
                detalle = "$exerciseCount ejercicios entrenados",
                onClick = { onOpen("progreso/ejercicio") },
            )
        }
        GhostButton("Cerrar sesión", Modifier.fillMaxWidth(), onClick = onSignOut)
    }
}

@Composable
private fun Identidad(profile: UserProfile?, onEdit: () -> Unit) {
    GlassCard(radius = 26f) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                Modifier.size(58.dp)
                    .clip(CircleShape)
                    .background(tema.vidrio(2))
                    .border(1.dp, tema.borde, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                val inicial =
                    @Composable {
                        Text(
                            profile?.initial ?: "T",
                            color = tema.texto,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                if (!profile?.photoUrl.isNullOrBlank()) {
                    coil3.compose.SubcomposeAsyncImage(
                        model = profile?.photoUrl,
                        contentDescription = null,
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                        loading = { inicial() },
                        error = { inicial() },
                    )
                } else inicial()
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    profile?.displayName ?: "Sin nombre",
                    color = tema.texto,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                profile?.email?.let {
                    Text(it, color = tema.texto2, fontSize = 12.sp, maxLines = 1)
                }
                Text(
                    if (profile?.isCoach == true) "Entrenador" else "Atleta",
                    color = tema.texto3,
                    fontSize = 11.sp,
                )
                TextButton(onClick = onEdit, contentPadding = PaddingValues(0.dp),
                    modifier = Modifier.height(32.dp)) {
                    Text("Editar perfil", color = tema.texto2, fontSize = 12.sp)
                    Spacer(Modifier.width(4.dp))
                    Icon(Icons.Filled.ChevronRight, null, tint = tema.texto3, modifier = Modifier.size(12.dp))
                }
            }
        }
    }
}
