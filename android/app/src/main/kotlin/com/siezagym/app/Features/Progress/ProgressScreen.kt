package com.siezagym.app.Features.Progress

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.CreditoGifs
import com.siezagym.app.DesignSystem.FilaLista
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.DesignSystem.StatsCard
import com.siezagym.app.DesignSystem.Vacio
import com.siezagym.app.DesignSystem.WidgetMeter
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Services.GymStore
import java.util.Locale
import kotlinx.coroutines.flow.collectAsState
import kotlin.math.roundToInt

/** Progreso, igual que `/progreso` en la web: los tres números de la semana,
 *  el volumen semana a semana, los días entrenados, dónde fue el volumen, el
 *  balance empuje/tracción y una fila por ejercicio. */
@Composable
fun ProgressScreen(store: GymStore) {
    val sesiones by store.sessions.collectAsState()
    val catalogo by store.catalog.collectAsState()

    val barras = ProgressMetrics.volumeByWeek(sesiones, weeks = 12)
    val grilla = ProgressMetrics.trainedGrid(store.trainedDayKeys, weeks = 26)
    val ejercicios = ProgressMetrics.byExercise(sesiones)
    val entrenamientosSemana = store.weekSessions.size
    val hayGifs = ejercicios.any { store.exercise(it.exerciseID)?.mediaUrl != null }

    Pantalla(titulo = "Progreso") {
        StatsCard(
            datos = listOf(
                ProgressMetrics.formatKg(store.weeklyVolumeKg) to "esta semana",
                "$entrenamientosSemana" to if (entrenamientosSemana == 1) "entrenamiento" else "entrenamientos",
                ProgressMetrics.trendLabel(efectividad(entrenamientosSemana, sesiones)) to "vs semana anterior",
            ),
            modifier = Modifier.padding(top = 20.dp),
        )

        if (sesiones.isEmpty()) {
            Vacio(
                texto = "Todavía no terminaste ningún entrenamiento. Cuando termines el primero, acá vas a ver tu volumen semana a semana.",
                modifier = Modifier.padding(top = 24.dp),
            )
        } else {
            VolumenPorSemana(barras)
            DiasEntrenados(grilla)
            DondeFueElVolumen(musculos = store.muscleVolume, totalSesiones = sesiones.size)
            EmpujeYTraccion(balance = store.pushPull)
            PorEjercicio(ejercicios = ejercicios, store = store, catalogo = catalogo)

            if (hayGifs) {
                CreditoGifs()
            }
            // Aire para que la última tarjeta no quede atrás de la barra.
            Spacer(Modifier.height(60.dp))
        }
    }
}

/** Entrenamientos de esta semana contra los de la anterior. */
private fun efectividad(entrenamientosSemana: Int, sesiones: List<WorkoutSession>): Int? {
    val anterior = HomeMetrics.sessionsInLastDays(sesiones, days = 14).size - entrenamientosSemana
    if (anterior <= 0) return null
    return ((entrenamientosSemana - anterior).toDouble() / anterior * 100).roundToInt()
}

// MARK: - Secciones

@Composable
private fun VolumenPorSemana(barras: List<ProgressMetrics.WeekBar>) {
    val tema = LocalD2Theme.current
    Column {
        SectionLabel("Volumen por semana", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(paddingInterno = 16.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.fillMaxWidth().height(96.dp),
                ) {
                    barras.forEach { barra ->
                        val alto = (96f * barra.height.toFloat()).dp.coerceAtLeast(4.dp)
                        Box(
                            Modifier
                                .weight(1f)
                                .height(alto)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (barra.isEmpty) tema.texto3.copy(alpha = 0.35f) else tema.solido),
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("hace ${barras.size} semanas", fontSize = 10.sp, color = tema.texto2)
                    Spacer(Modifier.weight(1f))
                    Text(mejorSemana(barras), fontSize = 10.sp, color = tema.texto3)
                    Spacer(Modifier.weight(1f))
                    Text("esta semana", fontSize = 10.sp, color = tema.texto2)
                }
            }
        }
    }
}

private fun mejorSemana(barras: List<ProgressMetrics.WeekBar>): String {
    val mejor = barras.maxOfOrNull { it.kg } ?: 0.0
    return if (mejor > 0) "mejor ${ProgressMetrics.formatKg(mejor)}" else "sin volumen todavía"
}

@Composable
private fun DiasEntrenados(grilla: ProgressMetrics.Grid) {
    val tema = LocalD2Theme.current
    Column {
        SectionLabel("Días entrenados", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(paddingInterno = 16.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.fillMaxWidth()) {
                    grilla.columns.forEach { columna ->
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.weight(1f)) {
                            columna.forEach { dia ->
                                val base = if (dia.trained) tema.solido else tema.texto3.copy(alpha = 0.3f)
                                val color = if (dia.isFuture) base.copy(alpha = base.alpha * 0.25f) else base
                                Box(
                                    Modifier
                                        .fillMaxWidth()
                                        .aspectRatio(1f)
                                        .clip(RoundedCornerShape(2.5.dp))
                                        .background(color),
                                )
                            }
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${grilla.total} ${if (grilla.total == 1) "día entrenado" else "días entrenados"}",
                        fontSize = 10.sp,
                        color = tema.texto2,
                    )
                    Spacer(Modifier.weight(1f))
                    Text("últimas ${grilla.columns.size} semanas", fontSize = 10.sp, color = tema.texto2)
                }
            }
        }
    }
}

@Composable
private fun DondeFueElVolumen(musculos: HomeMetrics.MuscleVolume, totalSesiones: Int) {
    if (musculos.rows.isEmpty()) return
    val tema = LocalD2Theme.current
    Column {
        SectionLabel("Dónde fue el volumen", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(paddingInterno = 16.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                musculos.rows.take(6).forEach { fila ->
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(fila.label, fontSize = 12.sp, color = tema.texto)
                            Spacer(Modifier.weight(1f))
                            Text(ProgressMetrics.formatKg(fila.kg.toDouble()), fontSize = 12.sp, color = tema.texto2)
                        }
                        Spacer(Modifier.height(5.dp))
                        // Sale de muscleWeights del catálogo cruzado con el
                        // peso y las reps de cada serie, no de una estimación
                        // por tipo de rutina.
                        WidgetMeter(proporcion = fila.pct.toFloat())
                    }
                }
                Text(
                    "Repartido sobre tus últimos $totalSesiones entrenamientos",
                    fontSize = 10.sp,
                    color = tema.texto3,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun EmpujeYTraccion(balance: HomeMetrics.PushPull) {
    if (!balance.hasData) return
    val tema = LocalD2Theme.current
    Column {
        SectionLabel("Empuje y tracción", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(paddingInterno = 16.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .height(26.dp)
                        .clip(RoundedCornerShape(9.dp)),
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth((balance.pct / 100f).coerceIn(0f, 1f))
                            .fillMaxHeight()
                            .background(tema.solido),
                    )
                    Box(Modifier.weight(1f).fillMaxHeight().background(tema.vidrio(3)))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("empuje ${ProgressMetrics.formatKg(balance.pushKg.toDouble())}", fontSize = 10.sp, color = tema.texto2)
                    Spacer(Modifier.weight(1f))
                    Text(balance.label, fontSize = 10.sp, color = tema.texto3)
                    Spacer(Modifier.weight(1f))
                    Text("tracción ${ProgressMetrics.formatKg(balance.pullKg.toDouble())}", fontSize = 10.sp, color = tema.texto2)
                }
            }
        }
    }
}

@Composable
private fun PorEjercicio(
    ejercicios: List<ProgressMetrics.ExerciseRow>,
    store: GymStore,
    catalogo: Map<String, Exercise>,
) {
    if (ejercicios.isEmpty()) return
    val tema = LocalD2Theme.current
    Column {
        SectionLabel("Por ejercicio", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        PanelLista {
            ejercicios.forEachIndexed { indice, fila ->
                if (indice > 0) {
                    Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                }
                FilaLista(
                    nombre = store.name(of = fila.exerciseID),
                    detalle = "${fila.sessions} ${if (fila.sessions == 1) "entrenamiento" else "entrenamientos"}",
                    valor = if (fila.bestOneRepMax > 0) "${peso(fila.bestOneRepMax)} kg" else null,
                    unidad = if (fila.bestOneRepMax > 0) "1RM est." else null,
                    miniatura = catalogo[fila.exerciseID]?.mediaUrl,
                    chevron = false,
                )
            }
        }
    }
}

/** El peso como lo muestra Swift: "105" y "102,5", sin ceros de relleno. */
private fun peso(kg: Double): String {
    if (kg % 1.0 == 0.0) return "${kg.roundToInt()}"
    return String.format(Locale("es", "AR"), "%.1f", kg).trimEnd('0').trimEnd(',')
}