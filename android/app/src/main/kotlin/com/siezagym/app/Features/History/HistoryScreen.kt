package com.siezagym.app.Features.History

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.CreditoGifs
import com.siezagym.app.DesignSystem.FilaLista
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.Miniatura
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.DesignSystem.StatsCard
import com.siezagym.app.DesignSystem.Vacio
import com.siezagym.app.Domain.Epley
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Services.GymStore
import java.util.Locale
import androidx.compose.runtime.collectAsState
import kotlin.math.roundToInt

/** El historial, igual que `/historial` en la web: una fila por entrenamiento
 *  con su fecha, duración y series, y el volumen a la derecha. */
@Composable
fun HistoryScreen(store: GymStore) {
    val tema = LocalD2Theme.current
    val sesiones by store.sessions.collectAsState()

    var seleccionada by remember { mutableStateOf<WorkoutSession?>(null) }

    val sesion = seleccionada
    if (sesion != null) {
        SesionDetalle(session = sesion, store = store, volver = { seleccionada = null })
    } else {
        Pantalla(titulo = "Historial", rotulo = "Tu actividad") {
            if (sesiones.isEmpty()) {
                Vacio(
                    texto = "Todavía no terminaste ningún entrenamiento.",
                    modifier = Modifier.padding(top = 24.dp),
                )
            } else {
                PanelLista(modifier = Modifier.padding(top = 24.dp)) {
                    sesiones.forEachIndexed { indice, sesion ->
                        if (indice > 0) {
                            Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                        }
                        FilaLista(
                            nombre = sesion.routineName ?: "Sesión libre",
                            detalle = detalle(sesion),
                            valor = "${sesion.totalVolumeKg.roundToInt()} kg",
                            unidad = "volumen",
                            chevron = false,
                            onClick = { seleccionada = sesion },
                        )
                    }
                }
                // Aire para que la lista no quede atrás de la barra de abajo.
                Spacer(Modifier.height(60.dp))
            }
        }
    }
}

/** El detalle de una sesión: los tres números arriba y una tarjeta por
 *  ejercicio con sus series, igual que en la web. */
@Composable
private fun SesionDetalle(session: WorkoutSession, store: GymStore, volver: () -> Unit) {
    val hayGifs = session.exercises.any { store.exercise(it.exerciseID)?.mediaUrl != null }

    Pantalla(
        titulo = session.routineName ?: "Sesión libre",
        rotulo = session.finishedAt?.let { fechaLarga(it) },
        volver = true,
        onVolver = volver,
    ) {
        StatsCard(
            datos = listOf(
                duracion(session.durationSeconds) to "duración",
                "${session.totalSetsCompleted}" to "series",
                "${session.totalVolumeKg.roundToInt()} kg" to "volumen",
            ),
            modifier = Modifier.padding(top = 20.dp),
        )

        SectionLabel("Ejercicios realizados", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))

        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            session.exercises.forEach { ejercicio ->
                TarjetaEjercicio(ejercicio = ejercicio, store = store)
            }
        }

        if (hayGifs) {
            CreditoGifs()
        }
        Spacer(Modifier.height(60.dp))
    }
}

@Composable
private fun TarjetaEjercicio(ejercicio: LoggedExercise, store: GymStore) {
    val tema = LocalD2Theme.current
    GlassCard(paddingInterno = 16.dp) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Miniatura(url = store.exercise(ejercicio.exerciseID)?.mediaUrl, lado = 64.dp)
                Spacer(Modifier.width(13.dp))
                Text(
                    store.name(of = ejercicio.exerciseID),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(14.dp))

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                ejercicio.sets.forEach { serie ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "Serie ${serie.setNumber}",
                            fontSize = 12.sp,
                            color = tema.texto2,
                            modifier = Modifier.width(66.dp),
                        )

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(2.dp),
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(
                                "${peso(serie.weight)}kg × ${serie.reps}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = tema.texto,
                            )
                            if (serie.failed) {
                                Text("fallada", fontSize = 11.sp, fontStyle = FontStyle.Italic, color = tema.texto2)
                            }
                        }

                        // Una serie fallada no da marca: el resto de la app la
                        // descarta, y mostrarla acá diría que levantaste algo
                        // que no levantaste.
                        Text(
                            if (serie.failed) {
                                "sin marca"
                            } else {
                                "${String.format(Locale("es", "AR"), "%.1f", Epley.estimatedOneRepMax(weight = serie.weight, reps = serie.reps))} kg · 1RM est."
                            },
                            fontSize = 11.sp,
                            color = tema.texto3,
                            textAlign = TextAlign.End,
                            modifier = Modifier.width(118.dp),
                        )
                    }
                }
            }
        }
    }
}

private fun detalle(sesion: WorkoutSession): String {
    val fecha = sesion.finishedAt?.let { fechaCorta(it) } ?: "Sin fecha"
    return "$fecha · ${duracion(sesion.durationSeconds)} · ${sesion.totalSetsCompleted} series"
}

private fun duracion(segundos: Int): String {
    val minutos = (segundos / 60.0).roundToInt()
    if (minutos < 60) return "$minutos min"
    return "${minutos / 60}h ${minutos % 60}min"
}

private val diasCortos = listOf("lun", "mar", "mié", "jue", "vie", "sáb", "dom")
private val mesesCortos = listOf("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic")
private val mesesLargos = listOf(
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)

private fun fechaCorta(fecha: java.time.ZonedDateTime): String =
    "${diasCortos[fecha.dayOfWeek.value - 1]} ${fecha.dayOfMonth} ${mesesCortos[fecha.monthValue - 1]}"

private fun fechaLarga(fecha: java.time.ZonedDateTime): String =
    "${fecha.dayOfMonth} de ${mesesLargos[fecha.monthValue - 1]}, " +
        "${fecha.hour.toString().padStart(2, '0')}:${fecha.minute.toString().padStart(2, '0')}"

/** El peso como lo muestra Swift: "20" y "22,5", sin ceros de relleno. */
private fun peso(kg: Double): String {
    if (kg % 1.0 == 0.0) return "${kg.roundToInt()}"
    return String.format(Locale("es", "AR"), "%.1f", kg).trimEnd('0').trimEnd(',')
}