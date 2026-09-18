package com.siezagym.app.Features.Workout

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.Backdrop
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.SolidButton
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymStore
import java.time.Duration
import java.time.Instant
import java.util.Locale
import kotlin.math.roundToInt
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** El entrenamiento en curso, a pantalla completa como el `fullScreenCover` de
 *  iOS: el reloj, el resumen y las series de cada ejercicio del plan. */
@Composable
fun WorkoutScreen(store: GymStore, routine: Routine?, onCerrar: () -> Unit) {
    val tema = LocalD2Theme.current
    val scope = rememberCoroutineScope()

    var draft by remember(routine) {
        mutableStateOf(WorkoutDraft(routine = routine, catalog = store.catalog.value))
    }
    var isSaving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }
    var showFinishConfirm by remember { mutableStateOf(false) }

    // Ticker de 1s: solo este reloj se redibuja, sin tocar los campos.
    var ahora by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            ahora = Instant.now()
        }
    }
    val transcurrido = Duration.between(draft.startedAt, ahora).seconds.coerceAtLeast(0).toInt()

    // El borrador se reconstruye en cada cambio para que Compose observe las
    // mutaciones de sus listas (los modelos son data classes, no @Observable).
    fun actualizarExercise(exerciseID: String, transform: (ExerciseDraft) -> ExerciseDraft) {
        draft = WorkoutDraft(
            routine = draft.routine,
            startedAt = draft.startedAt,
            exercises = draft.exercises.map { if (it.id == exerciseID) transform(it) else it },
        )
    }

    fun cambiarSet(exerciseID: String, index: Int, transform: (SetDraft) -> SetDraft) {
        actualizarExercise(exerciseID) { exercise ->
            exercise.copy(sets = exercise.sets.mapIndexed { i, set -> if (i == index) transform(set) else set })
        }
    }

    fun agregarSerie(exerciseID: String) {
        // addSet muta el modelo como en Swift; se reenvuelve el borrador para
        // que el estado (que es la variable draft) se escriba y recomponga.
        val d = draft
        d.addSet(exerciseID)
        draft = WorkoutDraft(d.routine, d.startedAt, d.exercises)
    }

    fun guardar() {
        isSaving = true
        saveError = null
        scope.launch {
            try {
                store.saveSession(routine = routine, startedAt = draft.startedAt, exercises = draft.loggedExercises())
                onCerrar()
            } catch (e: Exception) {
                saveError = e.message ?: "No se pudo guardar la sesión."
            } finally {
                isSaving = false
            }
        }
    }

    // Como el `interactiveDismissDisabled` de iOS: atrás solo si no quedó nada
    // hecho (si ya hay series, solo se sale guardando).
    BackHandler(enabled = draft.completedSets == 0 && !isSaving) { onCerrar() }

    Box(
        Modifier
            .fillMaxSize()
            .background(tema.fondoPlano),
    ) {
        Backdrop()

        Column(Modifier.fillMaxSize()) {
            Text(
                routine?.name ?: "Entrenamiento",
                fontSize = 26.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-0.5).sp,
                color = tema.texto,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp)
                    .padding(top = 16.dp),
            )

            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .imePadding()
                    .navigationBarsPadding()
                    .padding(horizontal = 18.dp)
                    .padding(top = 14.dp, bottom = 20.dp),
            ) {
                GlassCard(paddingInterno = 12.dp) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Stat(formatoTiempo(transcurrido), "tiempo", Modifier.weight(1f))
                        Stat("${draft.completedSets}/${draft.totalSets}", "series", Modifier.weight(1f))
                        Stat("${draft.volumeKg.roundToInt()}", "kg", Modifier.weight(1f))
                    }
                }

                draft.exercises.forEach { exercise ->
                    ExerciseCard(
                        exercise = exercise,
                        onAgregarSerie = { agregarSerie(exercise.id) },
                        onCambiarSet = { index, transform -> cambiarSet(exercise.id, index, transform) },
                    )
                }

                if (saveError != null) {
                    Text(saveError.orEmpty(), fontSize = 13.sp, color = tema.texto2)
                }

                Box {
                    SolidButton(
                        texto = "Terminar entrenamiento",
                        onClick = { showFinishConfirm = true },
                        enabled = draft.canSave && !isSaving,
                    )
                    if (isSaving) {
                        CircularProgressIndicator(
                            color = tema.sobreSolido,
                            strokeWidth = 2.dp,
                            modifier = Modifier
                                .align(Alignment.Center)
                                .size(22.dp),
                        )
                    }
                }
            }
        }
    }

    if (showFinishConfirm) {
        AlertDialog(
            onDismissRequest = { showFinishConfirm = false },
            containerColor = tema.vidrio(2),
            textContentColor = tema.texto,
            confirmButton = {
                TextButton(onClick = { guardar() }) { Text("Guardar", color = tema.solido) }
            },
            dismissButton = {
                TextButton(onClick = { showFinishConfirm = false }) {
                    Text("Seguir entrenando", color = tema.texto)
                }
            },
            text = {
                Text("Guardar ${draft.completedSets} series y ${draft.volumeKg.roundToInt()} kg?")
            },
        )
    }
}

// MARK: - Piezas

/** Una de las tres cifras del resumen: número arriba y rótulo abajo. */
@Composable
private fun Stat(valor: String, rotulo: String, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            valor,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = tema.texto,
        )
        Text(rotulo, fontSize = 10.sp, color = tema.texto2)
    }
}

/** Una tarjeta por ejercicio del plan: nombre, contador y sus series. */
@Composable
private fun ExerciseCard(
    exercise: ExerciseDraft,
    onAgregarSerie: () -> Unit,
    onCambiarSet: (Int, (SetDraft) -> SetDraft) -> Unit,
) {
    val tema = LocalD2Theme.current
    GlassCard(paddingInterno = 12.dp) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    exercise.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "${exercise.completedCount}/${exercise.sets.size}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (exercise.completedCount == exercise.sets.size) tema.solido else tema.texto2,
                )
            }

            exercise.sets.forEachIndexed { index, set ->
                SetRow(
                    set = set,
                    index = index + 1,
                    isTimeBased = exercise.isTimeBased,
                    onCambiar = { transform -> onCambiarSet(index, transform) },
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clickable(onClick = onAgregarSerie)
                    .padding(top = 2.dp, bottom = 2.dp),
            ) {
                Icon(
                    Icons.Filled.Add,
                    contentDescription = null,
                    tint = tema.texto,
                    modifier = Modifier.size(14.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    "Agregar serie",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = tema.texto,
                )
            }
        }
    }
}

/** Una fila del ejercicio: número, carga, reproducciones y los dos tildes. */
@Composable
private fun SetRow(
    set: SetDraft,
    index: Int,
    isTimeBased: Boolean,
    onCambiar: ((SetDraft) -> SetDraft) -> Unit,
) {
    val tema = LocalD2Theme.current

    // El texto se guarda aparte mientras se escribe: solo se traduce a número
    // cuando da un valor válido, como el binding de formato del TextField iOS.
    var pesoTexto by remember { mutableStateOf(formatoPeso(set.weight)) }
    var repsTexto by remember { mutableStateOf(set.reps.toString()) }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (set.failed) 0.65f else 1f),
    ) {
        Text(
            "$index",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = tema.texto2,
            modifier = Modifier.width(18.dp),
        )

        if (!isTimeBased) {
            // El peso no se registra en ejercicios de tiempo.
            CampoValor(
                texto = pesoTexto,
                onChange = { nuevo ->
                    pesoTexto = nuevo
                    val peso = parsearPeso(nuevo)
                    onCambiar { s -> s.copy(weight = peso ?: s.weight) }
                },
                unidad = "kg",
                ancho = 82.dp,
                keyboardType = KeyboardType.Decimal,
            )
        }

        Spacer(Modifier.width(6.dp))

        CampoValor(
            texto = repsTexto,
            onChange = { nuevo ->
                repsTexto = nuevo
                val reps = nuevo.toIntOrNull()
                onCambiar { s -> s.copy(reps = reps ?: s.reps) }
            },
            unidad = if (isTimeBased) "s" else "reps",
            ancho = 82.dp,
            keyboardType = KeyboardType.Number,
        )

        Spacer(Modifier.weight(1f))

        // Fallada: el peso se registra pero no suma volumen.
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(36.dp)
                .clickable {
                    onCambiar {
                        if (it.failed) it.copy(failed = false) else it.copy(failed = true, done = true)
                    }
                },
        ) {
            Icon(
                Icons.Filled.Cancel,
                contentDescription = if (set.failed) "Serie fallada" else "Marcar como fallada",
                tint = if (set.failed) tema.solido else tema.texto2.copy(alpha = 0.5f),
                modifier = Modifier.size(20.dp),
            )
        }

        // Hecha: el título del estado que se guarda en Firestore.
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(36.dp)
                .clickable {
                    onCambiar {
                        if (it.done) it.copy(done = false, failed = false) else it.copy(done = true)
                    }
                },
        ) {
            Icon(
                if (set.done) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                contentDescription = if (set.done) "Serie hecha" else "Marcar como hecha",
                tint = if (set.done) tema.solido else tema.texto2.copy(alpha = 0.5f),
                modifier = Modifier.size(24.dp),
            )
        }
    }
}

/** Un campo chico con su unidad: la pastilla de 0,05 de negro del Swift. */
@Composable
private fun CampoValor(
    texto: String,
    onChange: (String) -> Unit,
    unidad: String,
    ancho: Dp,
    keyboardType: KeyboardType,
) {
    val tema = LocalD2Theme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .width(ancho)
            .height(40.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Color.Black.copy(alpha = 0.05f))
            .padding(horizontal = 8.dp),
    ) {
        TextField(
            value = texto,
            onValueChange = onChange,
            singleLine = true,
            textStyle = TextStyle(
                color = tema.texto,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.End,
            ),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                disabledContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                cursorColor = tema.solido,
            ),
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.width(3.dp))
        Text(unidad, fontSize = 11.sp, color = tema.texto2)
    }
}

/** MM:SS del tiempo desde que arrancó el entrenamiento, como en Swift. */
private fun formatoTiempo(total: Int): String =
    String.format(Locale.ROOT, "%02d:%02d", total / 60, total % 60)

/** "50" para pesos enteros y "52.5" para los que llevan medio kilo. */
private fun formatoPeso(peso: Double): String =
    String.format(Locale.ROOT, "%.1f", peso)
        .trimEnd('0')
        .trimEnd('.')
        .ifEmpty { "0" }

/** Acepta el "52." que se ve a mitad de escritura como 52, igual que el
 *  formateador del `TextField` de iOS. */
private fun parsearPeso(texto: String): Double? {
    val limpio = texto.trim().replace(',', '.')
    return limpio.toDoubleOrNull() ?: limpio.trimEnd('.').toDoubleOrNull()
}