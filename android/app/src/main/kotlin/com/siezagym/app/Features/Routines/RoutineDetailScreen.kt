package com.siezagym.app.Features.Routines

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.CreditoGifs
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.Miniatura
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.DesignSystem.SolidButton
import com.siezagym.app.DesignSystem.StatsCard
import com.siezagym.app.DesignSystem.Vacio
import com.siezagym.app.DesignSystem.WidgetMeter
import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Features.Shared.NavInset
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.PlannedSet
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.RoutineExercise
import com.siezagym.app.Services.GymStore
import androidx.compose.runtime.collectAsState
import java.util.Locale
import kotlin.math.roundToInt

/** El detalle de una rutina, igual que `/rutinas/<id>` en la web: los tres
 *  números, la lista de ejercicios que se despliega de a uno, el reparto
 *  muscular, y abajo el botón de empezar. */
@Composable
fun RoutineDetailScreen(
    routine: Routine,
    store: GymStore,
    volver: () -> Unit,
    onEmpezar: (Routine) -> Unit,
) {
    val tema = LocalD2Theme.current
    val catalogo by store.catalog.collectAsState()

    var abierto by remember { mutableStateOf<String?>(null) }

    val minutos = RoutineSummary.estimatedMinutes(routine, catalogo)
    val reparto = RoutineSummary.muscleDistribution(routine, catalogo)
    val hayGifs = routine.exercises.any { catalogo[it.exerciseID]?.mediaUrl != null }

    Box(Modifier.fillMaxSize()) {
        Pantalla(
            titulo = routine.name,
            rotulo = if (routine.isAssigned) "Rutina del coach" else null,
            volver = true,
            onVolver = volver,
        ) {
            Column {
                StatsCard(
                    datos = listOf(
                        "${routine.exercises.count()}" to if (routine.exercises.count() == 1) "ejercicio" else "ejercicios",
                        "${routine.totalSets}" to if (routine.totalSets == 1) "serie" else "series",
                        // Es una cuenta sobre las series prescritas, no un tiempo
                        // medido: la pantalla lo dice.
                        "$minutos" to "min estimados",
                    ),
                    modifier = Modifier.padding(top = 20.dp),
                )

                SectionLabel(
                    "Ejercicios · ${routine.exercises.count()}",
                    modifier = Modifier.padding(top = 24.dp, bottom = 10.dp),
                )

                if (routine.exercises.isEmpty()) {
                    Vacio(texto = "Esta rutina no tiene ejercicios.")
                } else {
                    PanelLista {
                        routine.exercises.forEachIndexed { indice, item ->
                            if (indice > 0) {
                                Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                            }
                            val clave = "$indice-${item.exerciseID}"
                            FilaEjercicio(
                                item = item,
                                ejercicio = catalogo[item.exerciseID],
                                nombre = store.name(item.exerciseID),
                                abierto = abierto == clave,
                                alTocar = {
                                    abierto = if (abierto == clave) null else clave
                                },
                            )
                        }
                    }
                }

                if (reparto.isNotEmpty()) {
                    SectionLabel(
                        "Músculos que trabaja",
                        modifier = Modifier.padding(top = 24.dp, bottom = 10.dp),
                    )

                    GlassCard {
                        Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                            reparto.take(5).forEach { fila ->
                                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(fila.muscle.label, fontSize = 12.sp, color = tema.texto)
                                        Spacer(Modifier.weight(1f))
                                        Text(
                                            "${(fila.pct * 100).roundToInt()}%",
                                            fontSize = 12.sp,
                                            color = tema.texto2,
                                        )
                                    }
                                    WidgetMeter(proporcion = fila.pct.toFloat())
                                }
                            }
                        }
                    }
                }

                if (hayGifs) {
                    CreditoGifs()
                }

                // Aire para que el último ejercicio no quede abajo del botón.
                Spacer(Modifier.height(90.dp))
            }
        }

        SolidButton(
            texto = "Comenzar entrenamiento",
            onClick = { onEmpezar(routine) },
            enabled = routine.exercises.isNotEmpty(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 18.dp)
                .padding(bottom = 12.dp + NavInset.bottom.dp),
        )
    }
}

/** Un ejercicio de la rutina. Cerrado muestra el resumen de lo prescrito;
 *  abierto, una fila por serie. */
@Composable
private fun FilaEjercicio(
    item: RoutineExercise,
    ejercicio: Exercise?,
    nombre: String,
    abierto: Boolean,
    alTocar: () -> Unit,
) {
    val tema = LocalD2Theme.current
    val series = series(item)
    val esDeTiempo = ejercicio?.registrationType?.isTimeBased == true
    val llevaPeso = ejercicio?.registrationType == RegistrationType.PESO_REPS
    val muestraRIR = series.any { it.rir != null }

    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = alTocar)
                .padding(horizontal = 14.dp, vertical = 12.dp),
        ) {
            Miniatura(url = ejercicio?.mediaUrl, lado = 54.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    nombre,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(4.dp))
                Text(ejercicio?.primaryMuscle?.label ?: "Sin datos", fontSize = 11.sp, color = tema.texto2)
            }
            Spacer(Modifier.width(12.dp))
            Text(resumen(series, esDeTiempo), fontSize = 12.sp, color = tema.texto2, maxLines = 1)
            Spacer(Modifier.width(8.dp))
            val rotacion by animateFloatAsState(if (abierto) 180f else 0f, label = "chevron")
            Icon(
                Icons.Filled.ExpandMore,
                contentDescription = null,
                tint = tema.texto3,
                modifier = Modifier
                    .size(14.dp)
                    .graphicsLayer { rotationZ = rotacion },
            )
        }

        if (abierto) {
            Column(
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier
                    .padding(horizontal = 14.dp)
                    .padding(bottom = 14.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Box(Modifier.width(22.dp))
                    Text(
                        if (esDeTiempo) "Tiempo" else "Reps",
                        fontSize = 10.sp,
                        color = tema.texto3,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                    )
                    if (llevaPeso) {
                        Text(
                            "Peso",
                            fontSize = 10.sp,
                            color = tema.texto3,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center,
                        )
                    }
                    if (muestraRIR) {
                        Text(
                            "RIR",
                            fontSize = 10.sp,
                            color = tema.texto3,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center,
                        )
                    }
                }

                series.forEach { serie ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                        Text(
                            "${serie.setNumber}",
                            fontSize = 11.sp,
                            color = tema.texto3,
                            modifier = Modifier.width(22.dp),
                        )
                        Celda("${serie.reps}${if (esDeTiempo) "s" else ""}", Modifier.weight(1f))
                        if (llevaPeso) {
                            Celda(peso(serie.weight), Modifier.weight(1f))
                        }
                        if (muestraRIR) {
                            Celda(serie.rir?.toString(), Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

/** Las series prescritas en una sola forma, vengan parejas o detalladas. */
private fun series(item: RoutineExercise): List<PlannedSet> {
    val detalladas = item.sets
    if (!detalladas.isNullOrEmpty()) {
        return detalladas.mapIndexed { indice, serie -> serie.copy(setNumber = indice + 1) }
    }
    return (0 until maxOf(1, item.targetSets)).map {
        PlannedSet(
            setNumber = it + 1,
            weight = item.targetWeight,
            reps = item.targetReps,
            rir = item.targetRIR,
        )
    }
}

/** El resumen de lo prescrito: "3 × 10" cuando todas las reps son iguales, si
 *  no la lista separada por puntos. Con "s" al final si es ejercicio de
 *  tiempo. */
private fun resumen(series: List<PlannedSet>, esDeTiempo: Boolean): String {
    val reps = series.map { it.reps }
    val unidad = if (esDeTiempo) "s" else ""
    return if (reps.distinct().count() == 1) {
        "${reps.count()} × ${reps.first()}$unidad"
    } else {
        reps.joinToString(" · ") + unidad
    }
}

/** Un valor prescrito. Vacío se muestra como raya, no como cero. */
@Composable
private fun Celda(texto: String?, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Text(
        texto ?: "—",
        fontSize = 13.sp,
        color = if (texto == null) tema.texto3 else tema.texto,
        textAlign = TextAlign.Center,
        modifier = modifier
            .background(tema.vidrio(1), RoundedCornerShape(11.dp))
            .padding(vertical = 7.dp),
    )
}

/** El peso a "60 kg" o "60,5 kg": sin los ceros de relleno del Double. */
private fun peso(peso: Double?): String? = peso?.let {
    if (it % 1.0 == 0.0) {
        "${it.toLong()} kg"
    } else {
        "${String.format(Locale.US, "%.1f", it)} kg"
    }
}