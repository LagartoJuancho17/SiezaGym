package com.siezagym.app.Features.Home

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Features.Shared.AppTab
import com.siezagym.app.Features.Shared.NavInset
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymStore
import kotlinx.coroutines.flow.collectAsState
import kotlin.math.roundToInt

/** La portada, con la misma estructura que la web: saludo, qué toca hoy, la
 *  semana, los objetivos, las rutinas y los accesos. */
@Composable
fun HomeScreen(
    store: GymStore,
    onEmpezar: (Routine) -> Unit,
    onIrATab: (AppTab) -> Unit,
    onAbrirRutina: (String) -> Unit,
) {
    val tema = LocalD2Theme.current
    val perfil by store.profile.collectAsState()
    val rutinas by store.routines.collectAsState()
    val sesiones by store.sessions.collectAsState()
    val catalogo by store.catalog.collectAsState()
    val error by store.loadError.collectAsState()

    val featured = rutinas.firstOrNull { it.showOnHome } ?: rutinas.firstOrNull()
    val entrenados = com.siezagym.app.Domain.HomeMetrics.trainedDayKeys(sesiones)
    val racha = TrainingCalendar.streak(entrenados)
    val volumenSemana = com.siezagym.app.Domain.HomeMetrics.sessionsInLastDays(sesiones, days = 7).sumOf { it.totalVolumeKg }
    val calorias = store.calories
    val completado = store.completion

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp)
            .padding(top = 8.dp)
            .padding(bottom = com.siezagym.app.Features.Shared.NavInset.bottom.dp),
    ) {
        Encabezado(perfil?.displayName, perfil?.photoUrl, "Meta semanal: ${calorias.pct}%")

        Spacer(Modifier.height(34.dp))

        Row(verticalAlignment = Alignment.Bottom) {
            Column(Modifier.weight(1f)) {
                Text(
                    "Hoy toca",
                    fontSize = 29.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                )
                Text(
                    featured?.name ?: "entrenar libre",
                    fontSize = 29.sp,
                    fontWeight = FontWeight.Heavy,
                    fontStyle = FontStyle.Italic,
                    color = tema.texto,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Box(
                Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(tema.solido)
                    .clickable { featured?.let(onEmpezar) },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.PlayArrow,
                    contentDescription = "Empezar entrenamiento",
                    tint = tema.sobreSolido,
                    modifier = Modifier.size(28.dp),
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        SemanaCard(entrenados, racha)

        Spacer(Modifier.height(15.dp))

        Column {
            Text(
                "Tus objetivos",
                fontSize = 20.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-0.4).sp,
                color = tema.texto2,
            )
            Spacer(Modifier.height(16.dp))
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                ObjetivoCard(
                    titulo = "Esta semana",
                    valor = formatoKg(volumenSemana),
                    insignia = "volumen",
                    progreso = (volumenSemana / 10000).coerceIn(0.0, 1.0),
                    icono = Icons.Filled.FitnessCenter,
                )
                ObjetivoCard(
                    titulo = "Calorías",
                    valor = "${calorias.kcal} kcal",
                    insignia = if (calorias.usesDefaultWeight) "Estimado" else "Medido",
                    progreso = calorias.pct / 100.0,
                    icono = Icons.Filled.Schedule,
                )
                ObjetivoCard(
                    titulo = "Series",
                    valor = "${completado.pct} %",
                    insignia = "${completado.completed} de ${completado.total}",
                    progreso = completado.pct / 100.0,
                    icono = Icons.Filled.Check,
                )
            }
        }

        Spacer(Modifier.height(17.dp))

        Column {
            Text(
                "Las rutinas",
                fontSize = 20.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-0.4).sp,
                color = tema.texto2,
            )
            Spacer(Modifier.height(14.dp))
            if (rutinas.isEmpty()) {
                GlassCard(paddingInterno = 24.dp) {
                    Text(
                        "Todavía no tenés rutinas.",
                        fontSize = 14.sp,
                        color = tema.texto2,
                    )
                }
            } else {
                Column(
                    Modifier
                        .clip(RoundedCornerShape(24.dp))
                        .background(tema.vidrio(1))
                        .border(1.dp, tema.borde, RoundedCornerShape(24.dp)),
                ) {
                    rutinas.take(3).forEachIndexed { indice, rutina ->
                        if (indice > 0) {
                            Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                        }
                        FilaRutina(rutina = rutina, catalog = catalogo) {
                            onAbrirRutina(rutina.id)
                        }
                    }
                }
            }
        }

        SectionLabel("Tu espacio", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(paddingInterno = 0.dp) {
            Column {
                FilaAcceso("Historial", "Todo lo que entrenaste") { onIrATab(AppTab.HISTORY) }
                Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                FilaAcceso("Progreso", "Volumen y marcas") { onIrATab(AppTab.PROGRESS) }
            }
        }

        if (error != null) {
            Spacer(Modifier.height(16.dp))
            Text(error, fontSize = 13.sp, color = tema.texto2)
        }
    }
}

// MARK: - Piezas

@Composable
private fun Encabezado(nombre: String?, foto: String?, meta: String) {
    val tema = LocalD2Theme.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(58.dp)
                .clip(CircleShape)
                .background(tema.vidrio(2))
                .border(1.dp, tema.borde, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            if (foto != null) {
                AsyncImage(
                    model = foto,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer {
                            alpha = 0.85f
                        },
                )
            } else {
                Text(
                    (nombre?.firstOrNull() ?: 'T').toString(),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                )
            }
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text(
                "Hola, ${nombre ?: "atleta"}",
                fontSize = 21.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-0.5).sp,
                color = tema.texto,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.FitnessCenter,
                    contentDescription = null,
                    tint = tema.texto,
                    modifier = Modifier.size(12.dp),
                )
                Spacer(Modifier.width(7.dp))
                Text(meta, fontSize = 14.sp, color = tema.texto2)
            }
        }
    }
}

private fun formatoKg(kg: Double): String =
    if (kg >= 1000) String.format("%.1f t", kg / 1000).replace(".", ",")
    else "${kg.roundToInt()} kg"

/** Tarjeta de objetivo con su anillo, igual a las de la web. */
@Composable
private fun ObjetivoCard(
    titulo: String,
    valor: String,
    insignia: String,
    progreso: Double,
    icono: ImageVector,
) {
    val tema = LocalD2Theme.current
    GlassCard(paddingInterno = 14.dp, radius = 30.dp, modifier = Modifier.width(168.dp)) {
        Column(Modifier.height(124.dp)) {
            Text(titulo, fontSize = 14.sp, color = tema.texto2, maxLines = 1)
            Spacer(Modifier.height(6.dp))
            Text(
                valor,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = (-0.6).sp,
                color = tema.texto,
                maxLines = 1,
            )
            Spacer(Modifier.weight(1f))
            Row(verticalAlignment = Alignment.Bottom) {
                Box(
                    Modifier
                        .clip(RoundedCornerShape(50))
                        .background(tema.vidrio(1))
                        .border(1.dp, tema.borde, RoundedCornerShape(50))
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                ) {
                    Text(insignia, fontSize = 9.sp, color = tema.texto2, maxLines = 1)
                }
                Spacer(Modifier.weight(1f))
                Anillo(progreso, icono)
            }
        }
    }
}

/** Anillo de progreso con el icono en el centro. */
@Composable
private fun Anillo(progreso: Double, icono: ImageVector) {
    val tema = LocalD2Theme.current
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(52.dp)) {
        androidx.compose.foundation.Canvas(Modifier.fillMaxSize()) {
            val trazo = 3.dp.toPx()
            drawCircle(color = tema.texto3.copy(alpha = 0.4f), style = androidx.compose.ui.graphics.drawscope.Stroke(trazo))
            val barrido = (progreso.coerceIn(0.01, 1.0) * 360f).toFloat()
            drawArc(
                color = tema.solido,
                startAngle = -90f,
                sweepAngle = barrido,
                useCenter = false,
                style = androidx.compose.ui.graphics.drawscope.Stroke(trazo, cap = androidx.compose.ui.graphics.StrokeCap.Round),
            )
        }
        Icon(icono, contentDescription = null, tint = tema.texto, modifier = Modifier.size(14.dp))
    }
}

private fun FilaRutina(
    rutina: Routine,
    catalog: Map<String, com.siezagym.app.Models.Exercise>,
    onClick: () -> Unit,
) {
    val tema = LocalD2Theme.current
    val ejercicios = rutina.exercises.size
    val series = rutina.totalSets
    val minutos = RoutineSummary.estimatedMinutes(rutina, catalog)
    val detalle = "$ejercicios ${if (ejercicios == 1) "ejercicio" else "ejercicios"} · $series ${if (series == 1) "serie" else "series"} · $minutos min"
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 13.dp),
    ) {
        Column(Modifier.weight(1f)) {
            Text(
                rutina.name,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-0.2).sp,
                color = tema.texto,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(5.dp))
            Text(detalle, fontSize = 11.sp, color = tema.texto2)
        }
        Spacer(Modifier.width(8.dp))
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = tema.texto3,
            modifier = Modifier.size(18.dp),
        )
    }
}

private fun FilaAcceso(nombre: String, detalle: String, onClick: () -> Unit) {
    val tema = LocalD2Theme.current
    Column(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 12.dp),
    ) {
        Text(nombre, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = tema.texto)
        Spacer(Modifier.height(4.dp))
        Text(detalle, fontSize = 11.sp, color = tema.texto2)
    }
}