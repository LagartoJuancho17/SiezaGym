package com.siezagym.app.Features.Routines

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.GroupColor
import com.siezagym.app.Domain.RoutineGrouping
import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData

/**
 * La rutina abierta: las cuentas arriba, los ejercicios agrupados y el reparto
 * muscular. Sólo se puede editar si es propia; una del coach se lee.
 */
@Composable
fun RoutineDetailScreen(
    routine: Routine,
    data: GymData,
    onVolver: () -> Unit = {},
    onEdit: (() -> Unit)? = null,
    onToggleWeek: (() -> Unit)? = null,
    onStart: () -> Unit,
) {
    var abierto by rememberSaveable { mutableStateOf<String?>(null) }
    // Una rutina del coach se abre pero no se toca.
    val propia = !routine.isAssigned
    val editable = propia && onEdit != null
    val minutos = RoutineSummary.estimatedMinutes(routine, data.catalog)
    val reparto = RoutineSummary.muscleDistribution(routine, data.catalog)
    val hayGifs = routine.exercises.any { data.catalog[it.exerciseID]?.thumbnailUrl != null }
    val secciones = RoutineGrouping.seccionar(routine.exercises, { it.group }, { it.groupColor })
    val semana = TrainingCalendar.semana(java.time.ZonedDateTime.now(TrainingCalendar.zone))

    Box(Modifier.fillMaxSize()) {
        Pantalla(
            titulo = routine.name,
            rotulo = if (routine.isAssigned) "Rutina del coach" else null,
            volver = true,
            onVolver = onVolver,
            accion = { if (editable) BotonEditar(onEdit!!) },
        ) {
            Spacer(Modifier.height(20.dp))
            Column(Modifier.fillMaxWidth()) {
                StatsCard(
                    listOf(
                        "${routine.exercises.size}" to
                            if (routine.exercises.size == 1) "ejercicio" else "ejercicios",
                        "${routine.totalSets}" to if (routine.totalSets == 1) "serie" else "series",
                        "$minutos" to "min estimados",
                    )
                )
                Box(
                    Modifier
                        .padding(top = 4.dp)
                        .padding(horizontal = 28.dp)
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(tema.solido)
                )
            }

            if (propia && onToggleWeek != null) {
                Spacer(Modifier.height(14.dp))
                BotonSemana(
                    semana = semana.texto,
                    asignada = routine.weekKey == semana.clave,
                    onClick = onToggleWeek,
                )
            }

            SectionLabel(
                "Ejercicios · ${routine.exercises.size}",
                Modifier.padding(top = 24.dp, bottom = 10.dp),
            )

            if (routine.exercises.isEmpty()) {
                Vacio(
                    texto = "Esta rutina no tiene ejercicios.",
                    accionTitulo = if (editable) "Agregar ejercicios" else null,
                    onAccion = if (editable) onEdit else null,
                )
            } else {
                PanelLista {
                    secciones.forEach { seccion ->
                        if (seccion.agrupada) EncabezadoGrupo(seccion.nombreGrupo, seccion.color,
                            seccion.items.size)
                        seccion.items.forEach { item ->
                            val clave = claveDe(item)
                            val primero = item.id != seccion.items.first().id
                            if (primero) Separador()
                            FilaEjercicio(
                                item = item,
                                ejercicio = data.catalog[item.exerciseID],
                                nombre = data.name(item.exerciseID),
                                abierto = abierto == clave,
                                onClick = { abierto = if (abierto == clave) null else clave },
                            )
                        }
                    }
                }
            }

            if (reparto.isNotEmpty()) {
                SectionLabel("Músculos que trabaja", Modifier.padding(top = 24.dp, bottom = 10.dp))
                GlassCard(padding = 16.dp) {
                    Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                        reparto.take(5).forEach { fila ->
                            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                Row(Modifier.fillMaxWidth()) {
                                    Text(
                                        fila.muscle.label,
                                        Modifier.weight(1f),
                                        color = tema.texto,
                                        fontSize = 12.sp,
                                    )
                                    Text(
                                        "${(fila.pct * 100).toInt()}%",
                                        color = tema.solido,
                                        fontSize = 12.sp,
                                    )
                                }
                                WidgetMeter(fila.pct)
                            }
                        }
                    }
                }
            }

            if (hayGifs) {
                Spacer(Modifier.height(20.dp))
                CreditoGifs()
            }
            Spacer(Modifier.height(90.dp))
        }

        SolidButton(
            "Comenzar entrenamiento",
            Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 18.dp)
                .padding(bottom = 12.dp),
            enabled = routine.exercises.isNotEmpty(),
            icon = Icons.Filled.PlayArrow,
            onClick = onStart,
        )
    }
}

/** La llave de cada ejercicio para saber cuál está desplegado. */
private fun claveDe(item: com.siezagym.app.Models.RoutineExercise): String = item.id

@Composable
private fun BotonEditar(onEdit: () -> Unit) {
    IconButton(
        onClick = onEdit,
        modifier =
            Modifier.size(44.dp)
                .clip(CircleShape)
                .background(tema.vidrio(1))
                .border(1.dp, tema.borde, CircleShape),
    ) {
        Icon(Icons.Outlined.Edit, "Editar la rutina", tint = tema.texto,
            modifier = Modifier.size(17.dp))
    }
}

/** Agregar o sacar la rutina de la semana en curso. */
@Composable
private fun BotonSemana(semana: String, asignada: Boolean, onClick: () -> Unit) {
    Row(
        Modifier
            .padding(horizontal = 28.dp)
            .fillMaxWidth()
            .heightIn(min = 42.dp)
            .clip(CircleShape)
            .background(if (asignada) tema.solido else tema.vidrio(1))
            .then(if (asignada) Modifier else Modifier.border(1.dp, tema.borde, CircleShape))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(
            if (asignada) Icons.Filled.CheckCircle else Icons.Filled.Event,
            null,
            tint = if (asignada) tema.sobreSolido else tema.texto,
            modifier = Modifier.size(15.dp),
        )
        Text(
            if (asignada) "En $semana" else "Agregar a $semana",
            color = if (asignada) tema.sobreSolido else tema.texto,
            fontSize = 13.sp,
        )
    }
}

/** El rótulo de un bloque de ejercicios, con el color del grupo. */
@Composable
private fun EncabezadoGrupo(nombre: String, color: GroupColor?, total: Int) {
    val tono = color?.color ?: tema.texto3
    Row(
        Modifier
            .fillMaxWidth()
            .background(tono.copy(alpha = 0.12f))
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(Modifier.size(7.dp).clip(CircleShape).background(tono))
        Text(
            nombre.uppercase(),
            Modifier.weight(1f),
            color = tono,
            fontSize = 12.sp,
            letterSpacing = tracking(0.4f, 12f).sp,
            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
        )
        Text("$total ${if (total == 1) "ejercicio" else "ejercicios"}", color = tono, fontSize = 11.sp)
    }
}

/**
 * Un ejercicio y sus series. Tocado se despliega la grilla de series: la rutina
 * guarda o los mismos targets para todas o una serie detallada cada una.
 */
@Composable
private fun FilaEjercicio(
    item: com.siezagym.app.Models.RoutineExercise,
    ejercicio: Exercise?,
    nombre: String,
    abierto: Boolean,
    onClick: () -> Unit,
) {
    val series = remember(item) { seriesDe(item) }
    val esDeTiempo = ejercicio?.registrationType?.isTimeBased == true
    // La columna de peso aparece si alguna serie lo trae, no sólo si el catálogo
    // dice que se carga por peso: una rutina con un ejercicio que ya no está en
    // el catálogo igual tiene que mostrar lo que el entrenador escribió.
    val llevaPeso = series.any { it.weight != null }
    val muestraRIR = series.any { it.rir != null }

    Column(Modifier.animateContentSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(if (abierto) tema.solido.copy(alpha = 0.08f) else androidx.compose.ui.graphics.Color.Transparent)
                .clickable(onClick = onClick)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Miniatura(ejercicio?.thumbnailUrl, lado = 54.dp)
            Column(Modifier.weight(1f)) {
                Text(nombre, color = tema.texto, fontSize = 14.sp, maxLines = 1)
                Text(
                    ejercicio?.primaryMuscle?.label ?: "Sin datos",
                    color = tema.texto2,
                    fontSize = 11.sp,
                )
            }
            Text(resumen(series, esDeTiempo), color = tema.texto2, fontSize = 12.sp, maxLines = 1)
            Icon(
                Icons.Filled.ExpandMore,
                null,
                tint = tema.texto3,
                modifier = Modifier.size(16.dp).rotate(if (abierto) 180f else 0f),
            )
        }

        if (abierto) {
            Column(Modifier.padding(start = 14.dp, end = 14.dp, bottom = 14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    Modifier.padding(start = 30.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        if (esDeTiempo) "Tiempo" else "Reps",
                        Modifier.weight(1f),
                        color = tema.texto3,
                        fontSize = 10.sp,
                    )
                    if (llevaPeso) Text("Peso", Modifier.weight(1f), color = tema.texto3, fontSize = 10.sp)
                    if (muestraRIR) Text("RIR", Modifier.weight(1f), color = tema.texto3, fontSize = 10.sp)
                }
                series.forEach { serie ->
                    Row(
                        Modifier.padding(start = 30.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text("${serie.numero}", Modifier.width(14.dp), color = tema.texto3, fontSize = 11.sp)
                        Celda("${serie.reps}${if (esDeTiempo) "s" else ""}")
                        if (llevaPeso) Celda(serie.weight?.let { "${number(it)} kg" })
                        if (muestraRIR) Celda(serie.rir?.toString())
                    }
                }
            }
        }
    }
}

private data class Serie(
    val numero: Int,
    val reps: Int,
    val weight: Double?,
    val rir: Int?,
)

/** Las series detalladas si las hay; si no, los targets repetidos. */
private fun seriesDe(item: com.siezagym.app.Models.RoutineExercise): List<Serie> {
    val detalladas = item.sets
    if (!detalladas.isNullOrEmpty()) {
        return detalladas.mapIndexed { indice, set ->
            Serie(indice + 1, set.reps, set.weight, set.rir)
        }
    }
    return (0 until maxOf(1, item.targetSets)).map { indice ->
        Serie(indice + 1, item.targetReps, item.targetWeight, item.targetRIR)
    }
}

/** "4 × 8" si todas las series coinciden; si no, cada reps por separado. */
private fun resumen(series: List<Serie>, esDeTiempo: Boolean): String {
    val reps = series.map { it.reps }
    val unidad = if (esDeTiempo) "s" else ""
    return if (reps.distinct().size == 1) "${reps.size} × ${reps.first()}$unidad"
    else reps.joinToString(" · ") + unidad
}

@Composable
private fun RowScope.Celda(texto: String?, factor: Float = 1f) {
    Box(
        Modifier
            .weight(factor)
            .heightIn(min = 32.dp)
            .clip(RoundedCornerShape(11.dp))
            .background(if (texto == null) tema.vidrio(1) else tema.solido.copy(alpha = 0.08f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(texto ?: "—", color = if (texto == null) tema.texto3 else tema.solido, fontSize = 13.sp)
    }
}
