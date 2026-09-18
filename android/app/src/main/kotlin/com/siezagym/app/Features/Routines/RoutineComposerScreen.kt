package com.siezagym.app.Features.Routines

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.Backdrop
import com.siezagym.app.DesignSystem.CapsuleShape
import com.siezagym.app.DesignSystem.GhostButton
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.Miniatura
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.DesignSystem.SolidButton
import com.siezagym.app.DesignSystem.Vacio
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.RoutineDraftValidation
import com.siezagym.app.Features.Shared.NavInset
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Services.GymStore
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.launch
import java.text.Normalizer

/** Armador de rutinas propias. Los ejercicios asignados por un coach siguen
 *  siendo de solo lectura; esta pantalla crea documentos en `routines`. */
@Composable
fun RoutineComposerScreen(store: GymStore, onCerrar: () -> Unit) {
    val tema = LocalD2Theme.current
    val scope = rememberCoroutineScope()

    var name by rememberSaveable { mutableStateOf("") }
    var note by rememberSaveable { mutableStateOf("") }
    var items by remember { mutableStateOf<List<RoutineDraftExercise>>(emptyList()) }
    var mostrandoPicker by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun agregar(_seleccionados: List<Exercise>) {
        val existentes = items.map { it.exerciseID }.toSet()
        items = items + _seleccionados.filter { !existentes.contains(it.id) }.map(RoutineDraftExercise::fromExercise)
    }

    fun quitar(id: String) {
        items = items.filterNot { it.exerciseID == id }
    }

    fun actualizar(indice: Int, actualizado: RoutineDraftExercise) {
        items = items.mapIndexed { i, item -> if (i == indice) actualizado else item }
    }

    fun guardar() {
        errorMessage = null
        try {
            RoutineDraftValidation.validate(name = name, exercises = items)
        } catch (e: IllegalArgumentException) {
            errorMessage = e.message
            return
        }

        isSaving = true
        scope.launch {
            try {
                store.createRoutine(name = name, note = note, exercises = items)
                onCerrar()
            } catch (e: Exception) {
                errorMessage = e.message
                isSaving = false
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        Pantalla(
            titulo = "Nueva rutina",
            volver = true,
            onVolver = { if (!isSaving) onCerrar() },
        ) {
            Column {
                SectionLabel("Datos", modifier = Modifier.padding(top = 18.dp, bottom = 10.dp))

                GlassCard(paddingInterno = 14.dp, radius = 20.dp) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextField(
                            value = name,
                            onValueChange = { name = it },
                            singleLine = true,
                            placeholder = { Text("Ej: Empuje A", color = tema.texto3) },
                            textStyle = TextStyle(color = tema.texto, fontSize = 16.sp, fontWeight = FontWeight.Medium),
                            colors = camposVidrio(tema, tema.texto3),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(tema.vidrio(2)),
                        )

                        TextField(
                            value = note,
                            onValueChange = { note = it },
                            placeholder = { Text("Nota (opcional)", color = tema.texto3) },
                            textStyle = TextStyle(color = tema.texto, fontSize = 14.sp),
                            colors = camposVidrio(tema, tema.texto3),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(96.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(tema.vidrio(2)),
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp, bottom = 10.dp),
                ) {
                    SectionLabel("Ejercicios · ${items.count()}", modifier = Modifier.weight(1f))
                    GhostButton(texto = "Agregar", onClick = { mostrandoPicker = true })
                }

                if (items.isEmpty()) {
                    Vacio(texto = "Todavía no agregaste ningún ejercicio.")
                } else {
                    PanelLista {
                        items.forEachIndexed { indice, item ->
                            if (indice > 0) {
                                Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                            }
                            RoutineDraftRow(
                                item = item,
                                exercise = store.exercise(item.exerciseID),
                                onActualizar = { actualizar(indice, it) },
                                onQuitar = { quitar(item.exerciseID) },
                            )
                        }
                    }
                }

                errorMessage?.let {
                    Text(
                        it,
                        fontSize = 13.sp,
                        color = tema.solido,
                        modifier = Modifier.padding(top = 14.dp),
                    )
                }

                // Aire para que el último ejercicio no quede abajo del botón.
                Spacer(Modifier.height(82.dp))
            }
        }

        SolidButton(
            texto = if (isSaving) "Guardando..." else "Crear rutina",
            onClick = { guardar() },
            enabled = !isSaving,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 18.dp)
                .padding(bottom = 16.dp + NavInset.bottom.dp),
        )
    }

    if (mostrandoPicker) {
        ExercisePickerSheet(
            store = store,
            iniciales = items.map { it.exerciseID }.toSet(),
            onCerrar = { mostrandoPicker = false },
            onConfirm = { seleccionados ->
                agregar(seleccionados)
                mostrandoPicker = false
            },
        )
    }
}

// MARK: - Fila del armador

/** Un ejercicio elegido: miniatura, los tres objetivos con sus steppers y la
 *  nota técnica del ejercicio. */
@Composable
private fun RoutineDraftRow(
    item: RoutineDraftExercise,
    exercise: Exercise?,
    onActualizar: (RoutineDraftExercise) -> Unit,
    onQuitar: () -> Unit,
) {
    val tema = LocalD2Theme.current
    val esDeTiempo = exercise?.registrationType?.isTimeBased == true
    val paso = if (esDeTiempo) 5 else 1
    val rir = item.targetRIR ?: 0

    Column(Modifier.padding(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Miniatura(url = exercise?.mediaUrl, lado = 46.dp)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    exercise?.nameEs ?: item.exerciseID,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(3.dp))
                Text(exercise?.primaryMuscle?.label ?: "Sin datos", fontSize = 11.sp, color = tema.texto2)
            }
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onQuitar),
            ) {
                Icon(
                    Icons.Filled.Delete,
                    contentDescription = "Quitar ${exercise?.nameEs ?: "ejercicio"}",
                    tint = tema.texto3,
                    modifier = Modifier.size(15.dp),
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            CampoObjetivo(
                titulo = "Series",
                valor = "${item.targetSets}",
                menosHabilitado = item.targetSets > 1,
                masHabilitado = item.targetSets < 30,
                onMenos = { onActualizar(item.copy(targetSets = item.targetSets - 1)) },
                onMas = { onActualizar(item.copy(targetSets = item.targetSets + 1)) },
                modifier = Modifier.weight(1f),
            )
            CampoObjetivo(
                titulo = if (esDeTiempo) "Tiempo" else "Reps",
                valor = "${item.targetReps}",
                menosHabilitado = item.targetReps - paso >= 1,
                masHabilitado = item.targetReps + paso <= 999,
                onMenos = { onActualizar(item.copy(targetReps = (item.targetReps - paso).coerceAtLeast(1))) },
                onMas = { onActualizar(item.copy(targetReps = (item.targetReps + paso).coerceAtMost(999))) },
                modifier = Modifier.weight(1f),
            )
            CampoObjetivo(
                titulo = "RIR",
                valor = item.targetRIR?.toString() ?: "—",
                menosHabilitado = rir > 0,
                masHabilitado = rir < 10,
                onMenos = { onActualizar(item.copy(targetRIR = if (rir - 1 == 0) null else rir - 1)) },
                onMas = { onActualizar(item.copy(targetRIR = rir + 1)) },
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(12.dp))

        TextField(
            value = item.techniqueNote,
            onValueChange = { onActualizar(item.copy(techniqueNote = it)) },
            placeholder = { Text("Nota técnica (opcional)", color = tema.texto3) },
            textStyle = TextStyle(color = tema.texto, fontSize = 12.sp),
            colors = camposVidrio(tema, tema.texto3),
            modifier = Modifier
                .fillMaxWidth()
                .height(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(tema.vidrio(2)),
        )
    }
}

/** Un objetivo del draft: título arriba y el stepper con el valor al medio. */
@Composable
private fun CampoObjetivo(
    titulo: String,
    valor: String,
    menosHabilitado: Boolean,
    masHabilitado: Boolean,
    onMenos: () -> Unit,
    onMas: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tema = LocalD2Theme.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(tema.vidrio(2))
            .padding(top = 8.dp, bottom = 8.dp),
    ) {
        Text(titulo, fontSize = 9.sp, color = tema.texto3)
        Spacer(Modifier.height(2.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            StepperBoton(
                icono = Icons.Filled.Remove,
                descripcion = "Menos $titulo",
                habilitado = menosHabilitado,
                onClick = onMenos,
            )
            Text(
                valor,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = tema.texto,
                textAlign = TextAlign.Center,
                modifier = Modifier.width(40.dp),
            )
            StepperBoton(
                icono = Icons.Filled.Add,
                descripcion = "Más $titulo",
                habilitado = masHabilitado,
                onClick = onMas,
            )
        }
    }
}

@Composable
private fun StepperBoton(
    icono: ImageVector,
    descripcion: String,
    habilitado: Boolean,
    onClick: () -> Unit,
) {
    val tema = LocalD2Theme.current
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(28.dp)
            .clickable(enabled = habilitado, onClick = onClick),
    ) {
        Icon(
            icono,
            contentDescription = descripcion,
            tint = if (habilitado) tema.texto else tema.texto3.copy(alpha = 0.4f),
            modifier = Modifier.size(14.dp),
        )
    }
}

/** La hoja de elegir ejercicios: búsqueda en el catálogo y selección múltiple,
 *  igual que el `ExercisePickerSheet` de iOS. */
@Composable
private fun ExercisePickerSheet(
    store: GymStore,
    iniciales: Set<String>,
    onCerrar: () -> Unit,
    onConfirm: (List<Exercise>) -> Unit,
) {
    val tema = LocalD2Theme.current
    val catalogo by store.catalog.collectAsState()
    val cargando by store.isLoading.collectAsState()

    var query by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf(iniciales) }

    val ordenados = catalogo.values.sortedBy { it.nameEs.lowercase() }
    val termino = normalizar(query.trim())
    val visibles = if (termino.isEmpty()) ordenados else ordenados.filter {
        normalizar("${it.nameEs} ${it.nameEn}").contains(termino)
    }

    fun toggle(id: String) {
        selected = if (selected.contains(id)) selected.minus(id) else selected.plus(id)
    }

    Box(Modifier.fillMaxSize().background(tema.fondoPlano)) {
        Backdrop()
        Column {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp, vertical = 8.dp),
            ) {
                Text(
                    "Cancelar",
                    color = tema.solido,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable { onCerrar() }
                        .padding(vertical = 10.dp),
                )
                Text(
                    "Elegir ejercicios",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = tema.texto,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(48.dp))
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .padding(horizontal = 18.dp)
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(CapsuleShape)
                    .background(tema.vidrio(1))
                    .border(1.dp, tema.borde, CapsuleShape)
                    .padding(horizontal = 16.dp),
            ) {
                Icon(Icons.Filled.Search, contentDescription = null, tint = tema.texto2, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(9.dp))
                TextField(
                    value = query,
                    onValueChange = { query = it },
                    singleLine = true,
                    placeholder = { Text("Buscar ejercicios", color = tema.texto2) },
                    textStyle = TextStyle(color = tema.texto, fontSize = 14.sp),
                    keyboardOptions = KeyboardOptions(
                        capitalization = KeyboardCapitalization.None,
                        autoCorrectEnabled = false,
                    ),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        disabledIndicatorColor = Color.Transparent,
                        cursorColor = tema.solido,
                        focusedPlaceholderColor = tema.texto2,
                        unfocusedPlaceholderColor = tema.texto2,
                    ),
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(10.dp))

            Box(
                Modifier
                    .weight(1f)
                    .padding(horizontal = 18.dp),
            ) {
                when {
                    visibles.isEmpty() -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        if (cargando) {
                            CircularProgressIndicator(color = tema.texto, modifier = Modifier.size(24.dp))
                            Text("Cargando ejercicios...")
                        } else {
                            Text(if (query.isEmpty()) "No hay ejercicios disponibles." else "Ningún ejercicio coincide.")
                        }
                    }
                    else -> LazyColumn(
                        Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(24.dp))
                            .background(tema.vidrio(1))
                            .border(1.dp, tema.borde, RoundedCornerShape(24.dp)),
                    ) {
                        items(visibles, key = { it.id }) { ejercicio ->
                            val marcado = selected.contains(ejercicio.id)
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { toggle(ejercicio.id) }
                                    .padding(horizontal = 18.dp, vertical = 10.dp),
                            ) {
                                Miniatura(url = ejercicio.mediaUrl, lado = 46.dp)
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        ejercicio.nameEs,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = tema.texto,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    Text(
                                        if (ejercicio.source == ExerciseSource.CUSTOM) "Tuyo" else ejercicio.primaryMuscle?.label ?: "Sin datos",
                                        fontSize = 11.sp,
                                        color = tema.texto2,
                                    )
                                }
                                Icon(
                                    if (marcado) Icons.Filled.CheckCircle else Icons.Outlined.Circle,
                                    contentDescription = null,
                                    tint = if (marcado) tema.solido else tema.texto3,
                                    modifier = Modifier.size(22.dp),
                                )
                            }
                            if (ejercicio.id != visibles.last().id) {
                                Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                            }
                        }
                    }
                }
            }

            SolidButton(
                texto = "Agregar ${selected.count()} ${if (selected.count() == 1) "ejercicio" else "ejercicios"}",
                onClick = {
                    onConfirm(ordenados.filter { selected.contains(it.id) })
                    onCerrar()
                },
                enabled = selected.isNotEmpty(),
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp).padding(bottom = NavInset.bottom.dp),
            )
        }
    }
}

/** La config de color de los campos de vidrio, como la del login. */
@Composable
private fun camposVidrio(
    tema: com.siezagym.app.DesignSystem.D2Theme,
    placeholder: Color,
) = TextFieldDefaults.colors(
    focusedContainerColor = Color.Transparent,
    unfocusedContainerColor = Color.Transparent,
    disabledContainerColor = Color.Transparent,
    focusedIndicatorColor = Color.Transparent,
    unfocusedIndicatorColor = Color.Transparent,
    disabledIndicatorColor = Color.Transparent,
    cursorColor = tema.solido,
    focusedPlaceholderColor = placeholder,
    unfocusedPlaceholderColor = placeholder,
)

/** Búsqueda insensible a acentos y a mayúsculas, como el `folding` de Swift. */
private fun normalizar(texto: String): String =
    Normalizer.normalize(texto, Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .lowercase()