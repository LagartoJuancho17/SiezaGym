package com.siezagym.app.Features.Workout

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.SubcomposeAsyncImage
import coil3.request.ImageRequest
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.RestTimer
import com.siezagym.app.Domain.RoutineGrouping
import com.siezagym.app.Domain.RoutineSection
import com.siezagym.app.Features.Routines.SelectorEjercicios
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.*
import java.time.Instant
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToInt
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

private fun draftSaver(routine: Routine?) =
    Saver<WorkoutDraft, String>(
        save = { draft ->
            JSONObject()
                .put("startedAt", draft.startedAt.toString())
                .put(
                    "exercises",
                    JSONArray().apply {
                        draft.exercises.forEach { exercise ->
                            put(
                                JSONObject()
                                    .put("id", exercise.id)
                                    .put("exerciseID", exercise.exerciseID)
                                    .put("name", exercise.name)
                                    .put("timed", exercise.isTimeBased)
                                    .put("media", exercise.mediaUrl ?: JSONObject.NULL)
                                    .put("video", exercise.videoUrl ?: JSONObject.NULL)
                                    .put("description", exercise.description ?: JSONObject.NULL)
                                    .put("group", exercise.group)
                                    .put("groupColor", exercise.groupColor)
                                    .put(
                                        "sets",
                                        JSONArray().apply {
                                            exercise.sets.forEach { set ->
                                                put(
                                                    JSONObject()
                                                        .put("weight", set.weight)
                                                        .put("reps", set.reps)
                                                        .put("rir", set.rir ?: JSONObject.NULL)
                                                        .put("failed", set.failed)
                                                        .put("done", set.done)
                                                )
                                            }
                                        },
                                    )
                            )
                        }
                    },
                )
                .toString()
        },
        restore = { raw ->
            val json = JSONObject(raw)
            val exercises = json.getJSONArray("exercises")
            WorkoutDraft(
                routine,
                Instant.parse(json.getString("startedAt")),
                List(exercises.length()) { index ->
                    val exercise = exercises.getJSONObject(index)
                    val sets = exercise.getJSONArray("sets")
                    ExerciseDraft(
                        id = exercise.getString("id"),
                        exerciseID = exercise.getString("exerciseID"),
                        name = exercise.getString("name"),
                        isTimeBased = exercise.getBoolean("timed"),
                        sets =
                            List(sets.length()) { i ->
                                val set = sets.getJSONObject(i)
                                SetDraft(
                                    weight = set.getDouble("weight"),
                                    reps = set.getInt("reps"),
                                    rir = if (set.isNull("rir")) null else set.getInt("rir"),
                                    failed = set.getBoolean("failed"),
                                    done = set.getBoolean("done"),
                                )
                            },
                        mediaUrl = exercise.optString("media").takeIf { it.isNotEmpty() },
                        videoUrl = exercise.optString("video").takeIf { it.isNotEmpty() },
                        description = exercise.optString("description").takeIf { it.isNotEmpty() },
                        group = exercise.optString("group"),
                        groupColor = exercise.optString("groupColor"),
                    )
                },
            )
        },
    )

/**
 * El entrenamiento en curso: la pantalla que ocupa todo y de la que se sale con la X o volviendo,
 * como en iOS.
 */
@Composable
fun WorkoutScreen(routine: Routine?, data: GymData, store: GymStore, onBack: () -> Unit) {
    // Volver con la flecha no tira el trabajo: la rutina queda en standby y la barra de la pantalla
    // de atrás ofrece seguir. Sólo la X descarta, y pregunta antes.
    val enStandby = remember { store.activeWorkout?.takeIf { it.routine?.id == routine?.id } }
    var draft by
        rememberSaveable(stateSaver = draftSaver(routine)) {
            mutableStateOf(enStandby ?: WorkoutDraft(routine, data.catalog))
        }
    var abierto by rememberSaveable { mutableStateOf<String?>(null) }
    var saving by remember { mutableStateOf(false) }
    var confirm by remember { mutableStateOf(false) }
    var descartar by remember { mutableStateOf(false) }
    var eligiendo by remember { mutableStateOf(false) }
    var preview by remember { mutableStateOf<ExerciseDraft?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var descanso by remember { mutableStateOf(RestTimer()) }
    val scope = rememberCoroutineScope()
    val haptic = LocalHapticFeedback.current

    fun avisar(descansoTerminado: Boolean, completo: Boolean = false) {
        if (descansoTerminado) {
            // Sin archivo de sonido: el aviso es el del sistema.
            runCatching {
                android.media.ToneGenerator(android.media.AudioManager.STREAM_NOTIFICATION, 80)
                    .startTone(android.media.ToneGenerator.TONE_PROP_BEEP2, 250)
            }
        } else {
            haptic.performHapticFeedback(
                if (completo) HapticFeedbackType.LongPress else HapticFeedbackType.TextHandleMove
            )
        }
    }

    LaunchedEffect(Unit) {
        if (abierto == null) abierto = draft.ejercicioEnCurso
    }

    // El descanso baja solo. La LaunchedEffect se relanza cada segundo porque la clave son los
    // segundos que quedan: cuando el contador se va, no hay efecto corriendo.
    LaunchedEffect(descanso.restantes) {
        if (descanso.restantes == null) return@LaunchedEffect
        delay(1000)
        val (nuevo, termino) = descanso.tick()
        descanso = nuevo
        if (termino) avisar(descansoTerminado = true)
    }

    fun reemplazar(cambio: (List<ExerciseDraft>) -> List<ExerciseDraft>) {
        draft = WorkoutDraft(routine, draft.startedAt, cambio(draft.exercises))
    }

    fun editarSerie(ejercicioID: String, serie: Int, cambio: (SetDraft) -> SetDraft) {
        reemplazar { lista ->
            lista.map { ejercicio ->
                if (ejercicio.id != ejercicioID) ejercicio
                else
                    ejercicio.copy(
                        sets =
                            ejercicio.sets.mapIndexed { i, actual ->
                                if (i == serie) cambio(actual) else actual
                            }
                    )
            }
        }
    }

    fun serieTerminada(ejercicioID: String) {
        val completo =
            draft.exercises.firstOrNull { it.id == ejercicioID }?.estaCompleto == true
        avisar(descansoTerminado = false, completo = completo)
        descanso = descanso.arrancar()
        // Terminado un ejercicio se abre el siguiente: seguir con la rutina sin tocar la pantalla.
        if (completo) abierto = draft.ejercicioEnCurso
    }

    fun salirGuardando() {
        if (saving) return
        store.activeWorkout = draft
        onBack()
    }

    BackHandler { salirGuardando() }

    val secciones = remember(draft.exercises) {
        RoutineGrouping.seccionar(draft.exercises, { it.group }, { it.groupColor })
    }

    Column(Modifier.fillMaxSize().background(Color.Transparent)) {
        BarraEntrenamiento(
            nombre = routine?.name ?: "Libre",
            ocupada = saving,
            onVolver = ::salirGuardando,
            onDescartar = { descartar = true },
        )

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Resumen(draft, Modifier.fillMaxWidth())

            if (descanso.corriendo) {
                TarjetaDescanso(
                    descanso,
                    onRestar = { descanso = descanso.restar() },
                    onSumar = { descanso = descanso.sumar() },
                    onSaltar = { descanso = descanso.saltar() },
                )
            }

            secciones.forEach { seccion ->
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (seccion.agrupada) EncabezadoGrupoEntrenamiento(seccion)
                    seccion.items.forEach { ejercicio ->
                        key(ejercicio.id) {
                            TarjetaEjercicio(
                                ejercicio = ejercicio,
                                abierto = abierto == ejercicio.id,
                                ocupada = saving,
                                onTocar = {
                                    abierto = if (abierto == ejercicio.id) null else ejercicio.id
                                },
                                onSerieTerminada = { serieTerminada(ejercicio.id) },
                                onAgregarSerie = {
                                    draft.addSet(ejercicio.id)
                                    draft = WorkoutDraft(routine, draft.startedAt, draft.exercises)
                                },
                                onEditarSerie = { serie, cambio ->
                                    editarSerie(ejercicio.id, serie, cambio)
                                },
                                onMultimedia = { preview = ejercicio },
                            )
                        }
                    }
                }
            }

            // El entrenamiento libre es el único lugar donde se eligen ejercicios sobre la hora:
            // en la routine viene lo que escribió el entrenador.
            if (routine == null) {
                GhostButton("+ Agregar ejercicio", onClick = { eligiendo = true })
            }

            error?.let {
                Text(it, color = tema.texto, fontSize = 13.sp, lineHeight = 19.sp)
            }

            SolidButton(
                if (saving) "Guardando…" else "Terminar entrenamiento",
                Modifier.fillMaxWidth(),
                enabled = draft.canSave && !saving,
            ) {
                confirm = true
            }
        }
    }

    if (confirm)
        Confirmacion(
            titulo = "¿Guardar ${draft.completedSets} series y ${number(draft.volumeKg.toInt())} kg?",
            aceptar = "Guardar",
            onAceptar = {
                confirm = false
                saving = true
                error = null
                scope.launch {
                    try {
                        store.saveSession(routine, draft.startedAt, draft.loggedExercises())
                        store.activeWorkout = null
                        onBack()
                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        // No se tira lo hecho: la pantalla sigue abierta con las series cargadas.
                        error =
                            "No se pudo guardar el entrenamiento. Tus series siguen acá; volvé a intentar."
                    } finally {
                        saving = false
                    }
                }
            },
            onCancelar = { confirm = false },
        )

    if (descartar)
        Confirmacion(
            titulo = "¿Descartar entrenamiento?",
            mensaje = "Se perderán las series registradas en esta sesión.",
            aceptar = "Descartar y salir",
            onAceptar = {
                descartar = false
                store.activeWorkout = null
                onBack()
            },
            onCancelar = { descartar = false },
        )

    if (eligiendo)
        SelectorEjercicios(
            data = data,
            yaAgregados = draft.exercises.map { it.exerciseID }.toSet(),
            onCerrar = { eligiendo = false },
            onElegir = { elegidos ->
                reemplazar { lista ->
                    lista +
                        elegidos.map { ejercicio ->
                            ExerciseDraft(
                                id = ejercicio.id,
                                exerciseID = ejercicio.id,
                                name = ejercicio.nameEs,
                                isTimeBased = ejercicio.registrationType.isTimeBased,
                                sets = List(3) { SetDraft() },
                                mediaUrl = ejercicio.mediaUrl,
                                videoUrl = ejercicio.videoUrl,
                                description =
                                    ejercicio.descriptionEs.takeIf { it.isNotBlank() },
                            )
                        }
                }
                eligiendo = false
            },
            onCrearEjercicio = { nuevo -> store.createCustomExercise(nuevo) },
        )

    // El gesto de atrás cierra lo que está encima de la pantalla, en orden, y recién después
    // deja el entrenamiento en standby.
    if (preview != null || eligiendo || confirm || descartar)
        BackHandler {
            preview = null
            eligiendo = false
            confirm = false
            descartar = false
        }

    preview?.let { ejercicio ->
        HojaMultimedia(ejercicio) { preview = null }
    }
}

/** Volver, de qué se trata y la X que descarta. */
@Composable
private fun BarraEntrenamiento(
    nombre: String,
    ocupada: Boolean,
    onVolver: () -> Unit,
    onDescartar: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        PastillaBoton(
            "Volver",
            Modifier,
            enabled = !ocupada,
            icon = true,
            etiqueta = "Volver",
            onClick = onVolver,
        )

        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "ENTRENAMIENTO",
                    color = tema.solido,
                    fontSize = 11.sp,
                    letterSpacing = tracking(1f, 11f).sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.width(6.dp))
                Text("• STANDBY AL VOLVER", color = tema.texto2, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
            Text(nombre, color = tema.texto, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }

        PastillaBoton(
            "",
            Modifier.size(36.dp),
            enabled = !ocupada,
            onClick = onDescartar,
            etiqueta = "Descartar entrenamiento",
        ) {
            Icon(Icons.Filled.Close, null, tint = tema.texto2, modifier = Modifier.size(13.dp))
        }
    }
}

@Composable
private fun PastillaBoton(
    texto: String,
    modifier: Modifier,
    enabled: Boolean = true,
    icon: Boolean = false,
    etiqueta: String? = null,
    onClick: () -> Unit,
    contenido: @Composable (() -> Unit)? = null,
) {
    val source = remember { MutableInteractionSource() }
    Box(
        modifier
            .heightIn(min = if (icon) 40.dp else 36.dp)
            .clip(CircleShape)
            .background(tema.vidrio(2))
            .border(BorderStroke(1.dp, tema.borde), CircleShape)
            .clickable(
                interactionSource = source,
                indication = null,
                enabled = enabled,
                onClick = onClick,
            )
            .alpha(if (enabled) 1f else 0.5f)
            .then(if (etiqueta != null) Modifier.semantics { contentDescription = etiqueta } else Modifier)
            .padding(horizontal = if (icon) 12.dp else 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        when {
            contenido != null -> contenido()
            texto.isEmpty() -> Unit
            icon ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        null,
                        tint = tema.texto,
                        modifier = Modifier.size(15.dp),
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(texto, color = tema.texto, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            else ->
                Text(texto, color = tema.texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

/** Tiempo, series y volumen, con la barra de avance del sólido arriba. */
@Composable
private fun Resumen(draft: WorkoutDraft, modifier: Modifier) {
    Box(modifier) {
        SurfaceCard {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Reloj(draft.startedAt)
                Cifra("${draft.completedSets}/${draft.totalSets}", "series")
                Cifra(number(draft.volumeKg.toInt()), "kg")
            }
        }
        Box(
            Modifier
                .align(Alignment.TopCenter)
                .padding(top = 1.dp)
                .padding(horizontal = 28.dp)
                .fillMaxWidth()
                .height(4.dp)
                .clip(CircleShape)
                .background(tema.solido)
        )
    }
}

@Composable
private fun Reloj(startedAt: Instant) {
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(startedAt) {
        while (true) {
            delay(1000)
            now = Instant.now()
        }
    }
    val segundos = (now.epochSecond - startedAt.epochSecond).coerceAtLeast(0)
    Cifra(String.format(Locale.ROOT, "%02d:%02d", segundos / 60, segundos % 60), "tiempo")
}

/** Cifra con dígitos de ancho parejo: el reloj no salta de lado cada segundo. */
@Composable
private fun Cifra(valor: String, unidad: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            valor,
            color = tema.texto,
            fontSize = 20.sp,
            lineHeight = 24.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            style = TextStyle(fontFeatureSettings = "tnum"),
        )
        Text(unidad, color = tema.texto2, fontSize = 10.sp)
    }
}

@Composable
private fun TarjetaDescanso(
    descanso: RestTimer,
    onRestar: () -> Unit,
    onSumar: () -> Unit,
    onSaltar: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(tema.vidrio(2))
            .border(BorderStroke(1.dp, tema.solido.copy(alpha = 0.35f)), RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(Icons.Filled.Timer, null, tint = tema.solido, modifier = Modifier.size(18.dp))
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                "DESCANSO",
                color = tema.texto2,
                fontSize = 11.sp,
                lineHeight = 14.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                descanso.texto,
                color = tema.texto,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                style = TextStyle(fontFeatureSettings = "tnum"),
            )
        }
        Spacer(Modifier.weight(1f))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            PastillaBoton("−15s", Modifier, onClick = onRestar)
            PastillaBoton("+30s", Modifier, onClick = onSumar)
            PastillaBoton(
                "Saltar",
                Modifier,
                onClick = onSaltar,
                contenido = {
                    Text("Saltar", color = tema.texto2, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                },
            )
        }
    }
}

/** El bloque al que pertenecen los ejercicios de abajo, con su color. */
@Composable
private fun EncabezadoGrupoEntrenamiento(seccion: RoutineSection<ExerciseDraft>) {
    val tono = seccion.color?.color ?: tema.texto3
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(tono.copy(alpha = 0.14f))
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(Modifier.size(7.dp).clip(CircleShape).background(tono))
        Text(
            seccion.nombreGrupo.uppercase(),
            Modifier.weight(1f),
            color = tono,
            fontSize = 12.sp,
            letterSpacing = tracking(0.4f, 12f).sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "${seccion.items.size} ${if (seccion.items.size == 1) "ejercicio" else "ejercicios"}",
            color = tono,
            fontSize = 11.sp,
        )
    }
}

/**
 * Un ejercicio y sus series. El borde izquierdo dice en qué estado está: verde terminado, sólido a
 * medias, tenue si todavía no arrancó. Con el ejercicio terminado se le dibuja un borde verde: es lo
 * único que se ve de reojo mientras entrenás.
 */
@Composable
private fun TarjetaEjercicio(
    ejercicio: ExerciseDraft,
    abierto: Boolean,
    ocupada: Boolean,
    onTocar: () -> Unit,
    onSerieTerminada: () -> Unit,
    onAgregarSerie: () -> Unit,
    onEditarSerie: (serie: Int, cambio: (SetDraft) -> SetDraft) -> Unit,
    onMultimedia: () -> Unit,
) {
    val completo = ejercicio.estaCompleto
    val esquina = RoundedCornerShape(tema.esquina(Theme.radius))
    Box(
        Modifier
            .fillMaxWidth()
            .clip(esquina)
            .background(tema.vidrio(1))
            .border(
                BorderStroke(
                    if (completo) 1.5.dp else 1.dp,
                    if (completo) Theme.hecho.copy(alpha = 0.55f) else tema.borde,
                ),
                esquina,
            )
    ) {
        Column(
            Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            EncabezadoEjercicio(
                ejercicio,
                completo,
                abierto,
                ocupada,
                onTocar = onTocar,
                onMultimedia = onMultimedia,
            )
            if (abierto) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    ejercicio.sets.forEachIndexed { indice, set ->
                        FilaSerie(
                            set = set,
                            numero = indice + 1,
                            esDeTiempo = ejercicio.isTimeBased,
                            ocupada = ocupada,
                            onCompletar = {
                                onEditarSerie(indice) { actual ->
                                    if (actual.done) actual.copy(done = false, failed = false)
                                    else {
                                        onSerieTerminada()
                                        actual.copy(done = true)
                                    }
                                }
                            },
                            onFallar = {
                                onEditarSerie(indice) { actual ->
                                    if (actual.failed) {
                                        actual.copy(failed = false)
                                    } else {
                                        // Una serie fallada cuenta como hecha: laLiftas pero no
                                        // suma volumen, y no te obligamos a tacharla aparte.
                                        onSerieTerminada()
                                        actual.copy(failed = true, done = true)
                                    }
                                }
                            },
                            onPeso = { valor -> onEditarSerie(indice) { it.copy(weight = valor) } },
                            onReps = { valor -> onEditarSerie(indice) { it.copy(reps = valor) } },
                        )
                    }
                    Row(
                        Modifier
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                                enabled = !ocupada,
                                onClick = onAgregarSerie,
                            )
                            .padding(top = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Filled.Add, null, tint = tema.texto, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Agregar serie", color = tema.texto, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
        Box(
            Modifier
                .align(Alignment.CenterStart)
                .matchParentSize()
        ) {
            Box(
                Modifier
                    .padding(vertical = 14.dp)
                    .width(3.dp)
                    .fillMaxHeight()
                    .background(
                        when {
                            completo -> Theme.hecho
                            ejercicio.completedCount > 0 -> tema.solido
                            else -> tema.borde
                        }
                    )
            )
        }
    }
}

@Composable
private fun EncabezadoEjercicio(
    ejercicio: ExerciseDraft,
    completo: Boolean,
    abierto: Boolean,
    ocupada: Boolean,
    onTocar: () -> Unit,
    onMultimedia: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onTocar,
            )
            .semantics {
                contentDescription =
                    if (completo) "Ejercicio terminado, ${ejercicio.sets.size} series"
                    else "${ejercicio.completedCount} de ${ejercicio.sets.size} series"
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            ejercicio.name,
            color = tema.texto,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            modifier = Modifier.weight(1f, fill = false),
        )
        if (ejercicio.mediaUrl != null || ejercicio.videoUrl != null) {
            PastillaBoton(
                if (ejercicio.mediaUrl != null) "GIF" else "Video",
                Modifier,
                enabled = !ocupada,
                onClick = onMultimedia,
                contenido = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.PlayArrow,
                            null,
                            tint = tema.solido,
                            modifier = Modifier.size(12.dp),
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (ejercicio.mediaUrl != null) "GIF" else "Video",
                            color = tema.solido,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                },
            )
        }
        Spacer(Modifier.weight(1f))
        ContadorSeries(ejercicio.completedCount, ejercicio.sets.size, completo)
        Icon(
            Icons.Filled.ExpandMore,
            null,
            tint = tema.texto3,
            modifier = Modifier.size(14.dp).rotate(if (abierto) 180f else 0f),
        )
    }
}

@Composable
private fun ContadorSeries(hechas: Int, total: Int, completo: Boolean) {
    Row(
        Modifier
            .then(
                if (completo)
                    Modifier.background(Theme.hecho, CircleShape).padding(horizontal = 8.dp, vertical = 3.dp)
                else Modifier
            )
            .semantics { contentDescription = "$hechas de $total series" },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (completo)
            Icon(
                Icons.Filled.Check,
                null,
                tint = Color.White,
                modifier = Modifier.size(10.dp),
            )
        Text(
            "$hechas/$total",
            color = if (completo) Color.White else tema.texto2,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            style = TextStyle(fontFeatureSettings = "tnum"),
        )
    }
}

@Composable
private fun FilaSerie(
    set: SetDraft,
    numero: Int,
    esDeTiempo: Boolean,
    ocupada: Boolean,
    onCompletar: () -> Unit,
    onFallar: () -> Unit,
    onPeso: (Double) -> Unit,
    onReps: (Int) -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .alpha(if (set.failed) 0.65f else 1f),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text("$numero", color = tema.texto2, fontSize = 12.sp, modifier = Modifier.width(16.dp))
        if (!esDeTiempo) CampoPeso(set.weight, !ocupada, onPeso)
        CampoReps(set.reps, if (esDeTiempo) "s" else "reps", !ocupada, onReps)
        Spacer(Modifier.weight(1f))
        IconoToggle(
            icono = if (set.failed) Icons.Filled.Cancel else Icons.Outlined.Cancel,
            relleno = set.failed,
            descripcion = "Serie $numero: ${if (set.failed) "quitar la marca de fallada" else "marcar fallada"}",
            tint = if (set.failed) tema.solido else tema.texto2.copy(alpha = 0.5f),
            size = 20,
            enabled = !ocupada,
            onClick = onFallar,
        )
        IconoToggle(
            icono =
                if (set.done) Icons.Outlined.CheckCircle else Icons.Outlined.RadioButtonUnchecked,
            relleno = set.done,
            descripcion = "Serie $numero: ${if (set.done) "desmarcar" else "completar"}",
            tint = if (set.done) tema.solido else tema.texto2.copy(alpha = 0.5f),
            size = 24,
            enabled = !ocupada,
            onClick = onCompletar,
        )
    }
}

@Composable
private fun IconoToggle(
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    relleno: Boolean,
    descripcion: String,
    tint: Color,
    size: Int,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Box(
        Modifier
            .size(44.dp)
            .clip(CircleShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                enabled = enabled,
                onClick = onClick,
            )
            .semantics { contentDescription = descripcion },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            icono,
            null,
            tint = tint,
            modifier = Modifier.size(size.dp).alpha(if (relleno) 1f else 0.9f),
        )
    }
}

@Composable
private fun PastillaNumero(texto: String, modifier: Modifier, enabled: Boolean, onClick: () -> Unit) {
    Box(
        modifier
            .clip(RoundedCornerShape(6.dp))
            .background(tema.vidrio(2))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                enabled = enabled,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Text(texto, color = tema.texto, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

/**
 * El campo de un número. Acepta coma o punto porque en Argentina el peso se escribe "72,5" y el
 * teclado numérico no siempre trae punto.
 */
@Composable
private fun CampoPeso(valor: Double, enabled: Boolean, onChange: (Double) -> Unit) {
    // El texto del campo no se vuelve a sembrar en cada cambio de valor: si se hiciera, escribir
    // "72,5" lo reiniciaría a "72.5" a mitad de tipeo. Sólo se resiembra cuando el usuario mueve
    // los botones, que es lo único que cambia el número por fuera del teclado.
    var version by remember { mutableStateOf(0) }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        PastillaNumero("−", Modifier.width(22.dp).height(30.dp), enabled) {
            version++
            onChange((max(0.0, valor - 2.5) * 10).roundToInt() / 10.0)
        }
        CampoNumero(
            valor = valor,
            semilla = version,
            unidad = "kg",
            patron = "[0-9]{0,5}([.,][0-9]{0,2})?",
            ancho = 44.dp,
            enabled = enabled,
            onDouble = onChange,
        )
        PastillaNumero("+", Modifier.width(22.dp).height(30.dp), enabled) {
            version++
            onChange(((valor + 2.5) * 10).roundToInt() / 10.0)
        }
    }
}

@Composable
private fun CampoReps(valor: Int, unidad: String, enabled: Boolean, onChange: (Int) -> Unit) {
    CampoNumero(
        valor = valor.toString(),
        semilla = 0,
        unidad = unidad,
        patron = "[0-9]{0,5}",
        ancho = 36.dp,
        enabled = enabled,
        onEntero = onChange,
    )
}

/**
 * El campo de un número. Acepta coma o punto porque en Argentina el peso se escribe "72,5" y el
 * teclado numérico no siempre trae punto.
 *
 * Lo que se escribe manda mientras el campo tiene el foco: borrar todo no salta a 1, y recién al
 * salir se muestra el número del modelo. Un `value` atado al estado haría cualquiera de las dos
 * cosasrar mal.
 */
@Composable
private fun CampoNumero(
    valor: Any,
    semilla: Int,
    unidad: String,
    patron: String,
    ancho: Dp,
    enabled: Boolean,
    onDouble: (Double) -> Unit = {},
    onEntero: (Int) -> Unit = {},
) {
    val inicial = remember(valor, semilla) { valor.toString().removeSuffix(".0") }
    var raw by remember(valor, semilla) { mutableStateOf(inicial) }
    var enfocado by remember { mutableStateOf(false) }
    val regex = remember(patron) { Regex(patron) }
    Row(
        Modifier
            .width(ancho + 24.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Color.Black.copy(alpha = 0.05f))
            .padding(horizontal = 6.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        BasicTextField(
            raw,
            { texto: String ->
                if (texto.matches(regex)) {
                    raw = texto
                    texto.replace(',', '.').toDoubleOrNull()?.let(onDouble)
                    texto.toIntOrNull()?.let(onEntero)
                }
            },
            Modifier
                .width(ancho)
                .onFocusChanged {
                    enfocado = it.isFocused
                    // Al salir se muestra el valor del modelo: "007" no se queda pegado.
                    if (!it.isFocused) {
                        val limpio = raw.trim()
                        val numero = limpio.replace(',', '.').toDoubleOrNull() ?: 0.0
                        if (numero > 0) {
                            onDouble(numero)
                            onEntero(numero.roundToInt())
                        }
                        raw = if (numero > 0) formatea(numero) else valor.toString()
                    }
                }
                .semantics { contentDescription = "$valor $unidad" },
            enabled = enabled,
            singleLine = true,
            textStyle =
                TextStyle(
                    color = tema.texto,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.End,
                ),
            keyboardOptions =
                KeyboardOptions(
                    keyboardType = if (patron.contains(",")) KeyboardType.Decimal else KeyboardType.Number
                ),
            cursorBrush = SolidColor(tema.solido),
        )
        Text(unidad, color = tema.texto2, fontSize = 10.sp)
    }
}

/** "72.5" se muestra como "72.5" pero "72" no como "72.0". */
private fun formatea(valor: Double): String =
    if (valor == valor.roundToInt().toDouble()) valor.roundToInt().toString() else valor.toString()

/** La animación y el video de técnica del ejercicio, con las instrucciones. */
@Composable
private fun HojaMultimedia(ejercicio: ExerciseDraft, onCerrar: () -> Unit) {
    Box(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    ejercicio.name,
                    Modifier.weight(1f),
                    color = tema.texto,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                )
                PastillaBoton(
                    "",
                    Modifier.size(40.dp),
                    onClick = onCerrar,
                    etiqueta = "Cerrar",
                ) { Icon(Icons.Filled.Close, null, tint = tema.texto, modifier = Modifier.size(16.dp)) }
            }

            ejercicio.mediaUrl?.let { url ->
                Box(
                    Modifier
                        .fillMaxWidth()
                        .heightIn(max = 300.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(tema.vidrio(1))
                        .border(BorderStroke(1.dp, tema.borde), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    SubcomposeAsyncImage(
                        model = ImageRequest.Builder(LocalContext.current).data(url).build(),
                        contentDescription = null,
                        modifier = Modifier.fillMaxWidth(),
                        loading = {
                            Box(Modifier.fillMaxWidth().heightIn(min = 200.dp), contentAlignment = Alignment.Center) {
                                Text("Cargando…", color = tema.texto2, fontSize = 13.sp)
                            }
                        },
                        error = {
                            Column(
                                Modifier.fillMaxWidth().heightIn(min = 180.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                            ) {
                                Icon(
                                    Icons.Outlined.Cancel,
                                    null,
                                    tint = tema.texto2,
                                    modifier = Modifier.size(32.dp),
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    "No se pudo cargar la animación",
                                    color = tema.texto2,
                                    fontSize = 13.sp,
                                )
                            }
                        },
                    )
                }
            }

            ejercicio.videoUrl?.let { url ->
                val context = LocalContext.current
                SolidButton(
                    "Ver video de técnica en YouTube",
                    Modifier.fillMaxWidth(),
                    icon = Icons.Filled.PlayCircle,
                    onClick = {
                        runCatching {
                            context.startActivity(
                                android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    android.net.Uri.parse(url),
                                )
                            )
                        }
                    },
                )
            }

            ejercicio.description?.let { descripcion ->
                Column(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(tema.vidrio(2))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        "INSTRUCCIONES",
                        color = tema.texto2,
                        fontSize = 12.sp,
                        lineHeight = 16.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(descripcion, color = tema.texto, fontSize = 14.sp, lineHeight = 21.sp)
                }
            }
        }
    }
}

/** La confirmación a pantalla completa, como el confirmationDialog de iOS. */
@Composable
private fun Confirmacion(
    titulo: String,
    mensaje: String? = null,
    aceptar: String,
    onAceptar: () -> Unit,
    onCancelar: () -> Unit,
) {
    Box(
        Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.55f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier
                .padding(24.dp)
                .clip(RoundedCornerShape(tema.esquina(Theme.radius)))
                .background(tema.vidrio(3))
                .border(BorderStroke(1.dp, tema.borde), RoundedCornerShape(tema.esquina(Theme.radius)))
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(titulo, color = tema.texto, fontSize = 16.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold)
            mensaje?.let { Text(it, color = tema.texto2, fontSize = 13.sp, lineHeight = 19.sp) }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                GhostButton(aceptar, onClick = onAceptar)
                GhostButton("Seguir entrenando", onClick = onCancelar)
            }
        }
    }
}
