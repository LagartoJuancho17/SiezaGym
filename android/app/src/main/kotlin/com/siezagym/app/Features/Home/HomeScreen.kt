package com.siezagym.app.Features.Home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData

/**
 * La portada: saludo con la meta semanal, la semana de entrenamiento, los
 * objetivos, las rutinas y un acceso al historial.
 */
@Composable
fun HomeScreen(data: GymData, onOpenHistory: () -> Unit = {}, onStart: (Routine?) -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp)
            .padding(top = 8.dp)
            .padding(bottom = bottomNavInset),
        verticalArrangement = Arrangement.spacedBy(15.dp),
    ) {
        Saludo(data)

        HoyToca(data) { onStart(it) }

        Column {
            EncabezadoSeccion(data.currentWeek.texto)
            Spacer(Modifier.height(14.dp))
            SemanaCard(data.trainedDayKeys, data.streak)
        }

        Column {
            EncabezadoSeccion("Tus objetivos")
            Spacer(Modifier.height(16.dp))
            Objetivos(data)
        }

        Column {
            EncabezadoSeccion("Las rutinas")
            Spacer(Modifier.height(14.dp))
            if (data.routines.isEmpty()) {
                GlassCard(padding = 24.dp) {
                    Text("Todavía no tenés rutinas.", color = tema.texto2, fontSize = 14.sp)
                }
            } else {
                PanelLista {
                    data.routines.take(3).forEachIndexed { indice, rutina ->
                        if (indice > 0) Separador()
                        FilaRutina(rutina, data) { onStart(rutina) }
                    }
                }
            }
        }

        Column {
            SectionLabel("Tu espacio")
            Spacer(Modifier.height(10.dp))
            GlassCard(padding = 0.dp) {
                FilaLista("Historial", "Todo lo que entrenaste", onClick = onOpenHistory)
            }
        }

        data.loadError?.let { error ->
            Text(error, color = tema.texto2, fontSize = 13.sp)
        }
    }
}

/** "Hola, nombre" con la meta semanal al lado. */
@Composable
private fun Saludo(data: GymData) {
    Row(
        Modifier.padding(top = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(tema.vidrio(2))
                .border(1.dp, tema.borde, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                data.profile?.initial ?: "T",
                color = tema.texto,
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(
                "Hola, ${data.profile?.displayName ?: "atleta"}",
                color = tema.texto,
                fontSize = 21.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = tracking(-0.5f, 21f).sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Icon(Icons.Filled.Bolt, null, tint = tema.texto, modifier = Modifier.size(12.dp))
                Text(
                    "Meta semanal: ${data.calories.pct}%",
                    color = tema.texto2,
                    fontSize = 14.sp,
                )
            }
        }
    }
}

/**
 * "Hoy toca" con el nombre de la rutina en itálica y el botón de play. Si no
 * hay rutina destacada, arrancá un entrenamiento libre.
 */
@Composable
private fun HoyToca(data: GymData, onStart: (Routine?) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(top = 34.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Column(Modifier.weight(1f)) {
            Text("Hoy toca", color = tema.texto, fontSize = 29.sp, fontWeight = FontWeight.Medium)
            Text(
                data.featuredRoutine?.name ?: "entrenar libre",
                color = tema.texto,
                fontSize = 29.sp,
                lineHeight = 33.sp,
                fontWeight = FontWeight.Black,
                fontStyle = FontStyle.Italic,
                letterSpacing = tracking(-0.6f, 29f).sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
        IconButton(
            onClick = { onStart(data.featuredRoutine) },
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(tema.solido),
        ) {
            Icon(
                Icons.Filled.PlayArrow,
                "Empezar entrenamiento",
                tint = tema.sobreSolido,
                modifier = Modifier.size(26.dp),
            )
        }
    }
}

/** El título de cada bloque: un poco más chico y apagado que el de pantalla. */@Composable
private fun EncabezadoSeccion(texto: String) {
    Text(
        texto,
        Modifier.fillMaxWidth(),
        color = tema.texto2,
        fontSize = 20.sp,
        fontWeight = FontWeight.Medium,
        letterSpacing = tracking(-0.4f, 20f).sp,
    )
}

/** Las tres tarjetas que se corren en horizontal: volumen, calorías, series. */
@Composable
private fun Objetivos(data: GymData) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            ObjetivoCard(
                titulo = "Esta semana",
                valor = ProgressMetrics.formatKg(data.weeklyVolumeKg),
                insignia = "volumen",
                progreso = (data.weeklyVolumeKg / 10000.0).coerceIn(0.0, 1.0),
                icono = Icons.Filled.Bolt,
            )
        }
        item {
            ObjetivoCard(
                titulo = "Calorías",
                valor = "${data.calories.kcal} kcal",
                insignia = if (data.calories.usesDefaultWeight) "Estimado" else "Medido",
                progreso = data.calories.pct / 100.0,
                icono = Icons.Filled.Schedule,
            )
        }
        item {
            ObjetivoCard(
                titulo = "Series",
                valor = "${data.completion.pct} %",
                insignia = "${data.completion.completed} de ${data.completion.total}",
                progreso = data.completion.pct / 100.0,
                icono = Icons.Filled.Check,
            )
        }
    }
}

@Composable
private fun ObjetivoCard(
    titulo: String,
    valor: String,
    insignia: String,
    progreso: Double,
    icono: ImageVector,
) {
    GlassCard(radius = 30f, padding = 14.dp) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    titulo,
                    Modifier.weight(1f),
                    color = tema.texto2,
                    fontSize = 11.sp,
                    maxLines = 1,
                )
                Icon(icono, null, tint = tema.solido, modifier = Modifier.size(13.dp))
            }
            Text(
                valor,
                color = tema.texto,
                fontSize = 22.sp,
                lineHeight = 26.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
            WidgetMeter(progreso)
            Text(insignia, color = tema.texto3, fontSize = 10.sp, maxLines = 1)
        }
    }
}

/** Una rutina en la lista, con su detalle según si es asignada o propia. */
@Composable
private fun FilaRutina(rutina: Routine, data: GymData, onClick: () -> Unit) {
    val ejercicio =
        rutina.exercises.firstNotNullOfOrNull { data.catalog[it.exerciseID] }
    FilaLista(
        nombre = rutina.name,
        detalle = detalleRutina(rutina, data),
        miniatura = ejercicio?.mediaUrl,
        valor = "${rutina.totalSets}",
        unidad = "series",
        onClick = onClick,
    )
}

private fun detalleRutina(rutina: Routine, data: GymData): String {
    if (rutina.isAssigned) return "Asignada por tu entrenador"
    val grupos = rutina.exercises.map { it.group }.filter { it.isNotBlank() }.distinct()
    return if (grupos.isEmpty()) "${rutina.exercises.size} ejercicios" else grupos.joinToString(" · ")
}
