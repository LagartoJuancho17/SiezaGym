package com.siezagym.app.Features.Workout

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.*
import java.time.Instant
import java.util.Locale
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
                        exercise.getString("id"),
                        exercise.getString("exerciseID"),
                        exercise.getString("name"),
                        exercise.getBoolean("timed"),
                        List(sets.length()) { i ->
                            val set = sets.getJSONObject(i)
                            SetDraft(
                                set.getDouble("weight"),
                                set.getInt("reps"),
                                if (set.isNull("rir")) null else set.getInt("rir"),
                                set.getBoolean("failed"),
                                set.getBoolean("done"),
                            )
                        },
                    )
                },
            )
        },
    )

@Composable
fun WorkoutScreen(routine: Routine?, data: GymData, store: GymStore, onBack: () -> Unit) {
    var draft by
        rememberSaveable(stateSaver = draftSaver(routine)) {
            mutableStateOf(WorkoutDraft(routine, data.catalog))
        }
    var saving by remember { mutableStateOf(false) }
    var confirm by remember { mutableStateOf(false) }
    var leave by remember { mutableStateOf(false) }
    var picker by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    fun back() {
        if (!saving) {
            if (draft.completedSets > 0) leave = true else onBack()
        }
    }
    BackHandler { back() }
    fun update(exerciseIndex: Int, setIndex: Int, change: (SetDraft) -> SetDraft) {
        draft =
            WorkoutDraft(
                routine,
                draft.startedAt,
                draft.exercises.mapIndexed { i, exercise ->
                    if (i != exerciseIndex) exercise
                    else
                        exercise.copy(
                            sets =
                                exercise.sets.mapIndexed { j, set ->
                                    if (j == setIndex) change(set) else set
                                }
                        )
                },
            )
    }
    Column {
        Row(
            Modifier.fillMaxWidth().heightIn(min = 52.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = { back() }, enabled = !saving) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver", tint = Theme.onDark)
            }
            Text(
                routine?.name ?: "Entrenamiento",
                color = Theme.onDark,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            SurfaceCard {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Elapsed(draft.startedAt)
                    Stat("${draft.completedSets}/${draft.totalSets}", "series")
                    Stat(number(draft.volumeKg.toInt()), "kg")
                }
            }
            draft.exercises.forEachIndexed { exerciseIndex, exercise ->
                key(exercise.id) {
                    SurfaceCard(padding = 12.dp) {
                        Row {
                            Text(
                                exercise.name,
                                Modifier.weight(1f),
                                color = Theme.cardText,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                "${exercise.completedCount}/${exercise.sets.size}",
                                color =
                                    if (exercise.completedCount == exercise.sets.size) Theme.accent
                                    else Theme.cardMuted,
                                fontSize = 12.sp,
                            )
                        }
                        exercise.sets.forEachIndexed { setIndex, set ->
                            Row(
                                Modifier.fillMaxWidth().heightIn(min = 44.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Text(
                                    "${setIndex+1}",
                                    Modifier.width(18.dp),
                                    color = Theme.cardMuted,
                                    fontSize = 12.sp,
                                )
                                if (!exercise.isTimeBased)
                                    SetNumber(set.weight, "kg", Modifier.weight(1f), !saving) { raw
                                        ->
                                        raw.replace(',', '.')
                                            .toDoubleOrNull()
                                            ?.takeIf { it.isFinite() && it >= 0 }
                                            ?.let { value ->
                                                update(exerciseIndex, setIndex) {
                                                    it.copy(weight = value)
                                                }
                                            }
                                    }
                                SetNumber(
                                    set.reps,
                                    "${if(exercise.isTimeBased) "s" else "reps"}",
                                    Modifier.weight(1f),
                                    !saving,
                                ) { raw ->
                                    raw.toIntOrNull()
                                        ?.takeIf { it >= 0 }
                                        ?.let { value ->
                                            update(exerciseIndex, setIndex) {
                                                it.copy(reps = value)
                                            }
                                        }
                                }
                                IconButton(
                                    onClick = {
                                        update(exerciseIndex, setIndex) {
                                            it.copy(
                                                failed = !it.failed,
                                                done = if (!it.failed) true else it.done,
                                            )
                                        }
                                    },
                                    enabled = !saving,
                                    modifier = Modifier.size(44.dp),
                                ) {
                                    Icon(
                                        Icons.Outlined.Cancel,
                                        "Serie ${setIndex+1}: marcar fallada",
                                        tint =
                                            if (set.failed) Theme.accentHover
                                            else Theme.cardMuted.copy(alpha = .5f),
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        update(exerciseIndex, setIndex) {
                                            it.copy(
                                                done = !it.done,
                                                failed = if (it.done) false else it.failed,
                                            )
                                        }
                                    },
                                    enabled = !saving,
                                    modifier = Modifier.size(44.dp),
                                ) {
                                    Icon(
                                        if (set.done) Icons.Outlined.CheckCircle
                                        else Icons.Outlined.RadioButtonUnchecked,
                                        "Serie ${setIndex+1}: ${if(set.done) "desmarcar" else "completar"}",
                                        tint =
                                            if (set.done) Theme.accent
                                            else Theme.cardMuted.copy(alpha = .5f),
                                    )
                                }
                            }
                        }
                        TextButton(
                            onClick = {
                                draft.addSet(exercise.id)
                                draft = WorkoutDraft(routine, draft.startedAt, draft.exercises)
                            },
                            enabled = !saving,
                        ) {
                            Text("+ Agregar serie", color = Theme.accent, fontSize = 12.sp)
                        }
                    }
                }
            }
            // iOS exposes a free-workout entry. Make it usable on Android with a catalog picker.
            if (routine == null)
                TextButton(onClick = { picker = true }, enabled = !saving) {
                    Text("+ Agregar ejercicio", color = Theme.accentLight)
                }
            error?.let { Text(it, color = Theme.accentLight, fontSize = 13.sp) }
            AccentButton(
                if (saving) "Guardando…" else "Terminar entrenamiento",
                Modifier.fillMaxWidth(),
                enabled = draft.canSave && !saving,
            ) {
                confirm = true
            }
        }
    }
    if (confirm)
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = {
                Text(
                    "¿Guardar ${draft.completedSets} series y ${number(draft.volumeKg.toInt())} kg?"
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirm = false
                        saving = true
                        error = null
                        scope.launch {
                            try {
                                store.saveSession(routine, draft.startedAt, draft.loggedExercises())
                                onBack()
                            } catch (e: CancellationException) {
                                throw e
                            } catch (e: Exception) {
                                error =
                                    "No se pudo guardar el entrenamiento. Tus series siguen acá; volvé a intentar."
                            } finally {
                                saving = false
                            }
                        }
                    }
                ) {
                    Text("Guardar")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirm = false }) { Text("Seguir entrenando") }
            },
        )
    if (leave)
        AlertDialog(
            onDismissRequest = { leave = false },
            title = { Text("¿Salir sin guardar?") },
            text = { Text("Se perderán las series de este entrenamiento.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        leave = false
                        onBack()
                    }
                ) {
                    Text("Descartar")
                }
            },
            dismissButton = {
                TextButton(onClick = { leave = false }) { Text("Seguir entrenando") }
            },
        )
    if (picker) {
        var query by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { picker = false },
            title = { Text("Agregar ejercicio") },
            text = {
                Column {
                    OutlinedTextField(
                        query,
                        { query = it },
                        label = { Text("Buscar") },
                        singleLine = true,
                    )
                    Column(Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState())) {
                        data.catalog.values
                            .filter {
                                it.nameEs.contains(query, ignoreCase = true) &&
                                    draft.exercises.none { chosen -> chosen.exerciseID == it.id }
                            }
                            .sortedBy { it.nameEs }
                            .forEach { exercise ->
                                TextButton(
                                    onClick = {
                                        draft =
                                            WorkoutDraft(
                                                routine,
                                                draft.startedAt,
                                                draft.exercises +
                                                    ExerciseDraft(
                                                        exercise.id,
                                                        exercise.id,
                                                        exercise.nameEs,
                                                        exercise.registrationType.isTimeBased,
                                                        List(3) { SetDraft() },
                                                    ),
                                            )
                                        picker = false
                                    }
                                ) {
                                    Text(exercise.nameEs)
                                }
                            }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { picker = false }) { Text("Cerrar") } },
        )
    }
}

@Composable
private fun Elapsed(startedAt: Instant) {
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(startedAt) {
        while (true) {
            delay(1000)
            now = Instant.now()
        }
    }
    val seconds = (now.epochSecond - startedAt.epochSecond).coerceAtLeast(0)
    Stat(String.format(Locale.ROOT, "%02d:%02d", seconds / 60, seconds % 60), "tiempo")
}

@Composable
private fun SetNumber(
    value: Number,
    unit: String,
    modifier: Modifier,
    enabled: Boolean,
    onChange: (String) -> Unit,
) {
    var raw by rememberSaveable { mutableStateOf(value.toString().removeSuffix(".0")) }
    Row(
        modifier
            .background(Theme.cardText.copy(alpha = .05f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicTextField(
            raw,
            { text ->
                if (
                    text.isEmpty() ||
                        text.matches(
                            Regex(if (unit == "kg") "[0-9]{0,5}([.,][0-9]{0,2})?" else "[0-9]{0,5}")
                        )
                ) {
                    raw = text
                    onChange(text.ifEmpty { "0" })
                }
            },
            Modifier.weight(1f),
            enabled = enabled,
            singleLine = true,
            textStyle =
                TextStyle(
                    color = Theme.cardText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                ),
            keyboardOptions =
                KeyboardOptions(
                    keyboardType = if (unit == "kg") KeyboardType.Decimal else KeyboardType.Number
                ),
            cursorBrush = SolidColor(Theme.accent),
        )
        Text(unit, color = Theme.cardMuted, fontSize = 11.sp)
    }
}
