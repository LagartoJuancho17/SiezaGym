package com.siezagym.app.Features.Routines

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.CheckBox
import androidx.compose.material.icons.outlined.Label
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.*
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.PlannedSet
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData
import kotlinx.coroutines.launch

private const val MAX_NOMBRE = 60
private const val MAX_NOTA = 2000

/**
 * El armador de rutinas: nombre, ejercicios con su prescripción, bloques y el
 * reparto muscular que se recalcula mientras se arma.
 */
@Composable
fun RoutineComposerScreen(
    data: GymData,
    routine: Routine? = null,
    onVolver: () -> Unit = {},
    onGuardar: suspend (nombre: String, nota: String, ejercicios: List<RoutineDraftExercise>) -> Unit,
    onCrearEjercicio: suspend (CustomExerciseDraft) -> String = { "" },
) {
    var nombre by rememberSaveable { mutableStateOf("") }
    var nota by rememberSaveable { mutableStateOf("") }
    var items by remember { mutableStateOf(listOf<RoutineDraftExercise>()) }
    var abierto by remember { mutableStateOf<String?>(null) }
    var eligiendo by remember { mutableStateOf(false) }
    var grupoModal by remember { mutableStateOf<GrupoModal?>(null) }
    var error by remember { mutableStateOf("") }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Editar arranca con lo que ya estaba; crear, en blanco.
    LaunchedEffect(routine?.id) {
        if (routine != null && items.isEmpty()) {
            items = routine.ejerciciosOrdenados().map { RoutineDraftExercise(it) }
            nombre = routine.name
            nota = routine.note
        }
    }

    val agregados = items.map { it.exerciseID }.toSet()
    val musculos = RoutineCompose.reparto(items, data.catalog).take(5)
    val secciones = RoutineGrouping.seccionar(items, { it.group }, { it.groupColor })

    fun reemplazar(indice: Int, nuevo: RoutineDraftExercise) {
        items = items.toMutableList().also { it[indice] = nuevo }
    }

    Pantalla(
        titulo = if (routine != null) "Editar rutina" else "Nueva rutina",
        volver = true,
        onVolver = onVolver,
        accion = {
            SolidButton(
                if (guardando) "Guardando…" else "Guardar",
                expands = false,
                enabled = !guardando,
                onClick = {
                    scope.launch {
                        error = ""
                        try {
                            RoutineDraftValidation.validate(nombre, items)
                        } catch (e: RoutineDraftException) {
                            error = e.error.mensaje
                            return@launch
                        }
                        guardando = true
                        try {
                            onGuardar(nombre, nota, items)
                            onVolver()
                        } catch (e: Exception) {
                            error = e.message ?: "No se pudo guardar."
                            guardando = false
                        }
                    }
                },
            )
        },
    ) {
        CampoTexto(
            valor = nombre,
            onChange = { nombre = it.take(MAX_NOMBRE) },
            placeholder = "Nombre de la rutina",
            modifier = Modifier.padding(top = 20.dp),
            minHeight = 60.dp,
            fontSize = 17.sp,
            etiqueta = "Nombre de la rutina",
        )

        SectionLabel(
            if (items.isEmpty()) "Ejercicios" else "Ejercicios · ${items.size}",
            Modifier.padding(top = 24.dp, bottom = 10.dp),
        )

        if (items.isNotEmpty()) {
            PanelLista {
                secciones.forEach { seccion ->
                    if (seccion.agrupada) {
                        EncabezadoGrupo(
                            nombre = seccion.nombreGrupo,
                            color = seccion.color,
                            total = seccion.items.size,
                            onClick = { grupoModal = GrupoModal.paraSeccion(seccion, items) },
                        )
                    }
                    items.forEachIndexed { indice, item ->
                        if (seccion.items.any { it.exerciseID == item.exerciseID }) {
                            if (item.exerciseID != seccion.items.first().exerciseID) Separador()
                            FilaPrescripcion(
                                item = item,
                                ejercicio = data.catalog[item.exerciseID],
                                nombre = data.name(item.exerciseID),
                                abierto = abierto == item.exerciseID,
                                onClick = {
                                    abierto = if (abierto == item.exerciseID) null else item.exerciseID
                                },
                                onQuitar = {
                                    items = items.filterNot { it.exerciseID == item.exerciseID }
                                    if (abierto == item.exerciseID) abierto = null
                                },
                                onAgrupar = {
                                    grupoModal = GrupoModal.paraEjercicio(indice, items)
                                },
                                onChange = { reemplazar(indice, it) },
                            )
                            if (items.size > 1) {
                                Reordenar(
                                    nombre = data.name(item.exerciseID),
                                    puedeSubir = indice > 0,
                                    puedeBajar = indice < items.size - 1,
                                    onSubir = { items = RoutineCompose.mover(items, indice, indice - 1) },
                                    onBajar = { items = RoutineCompose.mover(items, indice, indice + 1) },
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        BotonAgregarEjercicio { eligiendo = true }

        Spacer(Modifier.height(24.dp))
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionLabel("Nota de la rutina (opcional)")
            CampoTexto(
                valor = nota,
                onChange = { nota = it.take(MAX_NOTA) },
                placeholder = "Indicaciones para este entrenamiento",
                minHeight = 90.dp,
                fontSize = 14.sp,
                multilinea = true,
                etiqueta = "Nota de la rutina",
            )
        }

        if (musculos.isNotEmpty()) {
            SectionLabel("Músculos que trabaja", Modifier.padding(top = 24.dp, bottom = 10.dp))
            GlassCard(padding = 16.dp) {
                Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                    musculos.forEach { fila ->
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
                                    color = tema.texto2,
                                    fontSize = 12.sp,
                                )
                            }
                            WidgetMeter(fila.pct)
                        }
                    }
                }
            }
        }

        if (error.isNotEmpty()) {
            Text(
                error,
                Modifier
                    .fillMaxWidth()
                    .padding(top = 14.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(tema.vidrio(1))
                    .padding(16.dp),
                color = tema.texto,
                fontSize = 13.sp,
            )
        }
    }

    if (eligiendo) {
        SelectorEjercicios(
            data = data,
            yaAgregados = agregados,
            onCerrar = { eligiendo = false },
            onElegir = { elegidos ->
                items = items + elegidos.filter { it.id !in agregados }.map { ejercicio ->
                    RoutineDraftExercise(ejercicio)
                }
                eligiendo = false
            },
            onCrearEjercicio = onCrearEjercicio,
        )
    }

    grupoModal?.let { modal ->
        HojaGrupo(
            modal = modal,
            onCerrar = { grupoModal = null },
            onAplicar = { nombreGrupo, color, aplicarLote ->
                items = aplicarGrupo(items, modal, nombreGrupo, color, aplicarLote)
                grupoModal = null
            },
            onQuitar = {
                items = quitarGrupo(items, modal.targetIndices)
                grupoModal = null
            },
        )
    }
}

/**
 * Poner un grupo, o sólo a los que vienen detrás. Con nombre vacío saca el
 * grupo, que es lo mismo que hace el botón "Quitar del grupo".
 */
private fun aplicarGrupo(
    items: List<RoutineDraftExercise>,
    modal: GrupoModal,
    nombre: String,
    color: GroupColor,
    aplicarLote: Boolean,
): List<RoutineDraftExercise> {
    val limpio = nombre.trim()
    if (limpio.isEmpty()) return quitarGrupo(items, modal.targetIndices)

    val copia = items.toMutableList()
    val objetivo = modal.targetIndices.toMutableSet()
    if (aplicarLote && modal.batchCount > 0 && modal.targetIndices.size == 1) {
        val inicio = modal.targetIndices.first()
        for (i in (inicio + 1)..(inicio + modal.batchCount)) {
            if (i in copia.indices) objetivo += i
        }
    }
    for (i in objetivo) {
        if (i in copia.indices) copia[i] = copia[i].copy(group = limpio, groupColor = color.id)
    }
    return copia
}

private fun quitarGrupo(
    items: List<RoutineDraftExercise>,
    indices: List<Int>,
): List<RoutineDraftExercise> {
    val copia = items.toMutableList()
    for (i in indices) {
        if (i in copia.indices) copia[i] = copia[i].copy(group = "", groupColor = "")
    }
    return copia
}

/** El botón de "Agregar ejercicio", con el borde punteado de la referencia. */
@Composable
private fun BotonAgregarEjercicio(onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, tema.bordeFuerte, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(Icons.Filled.Add, null, tint = tema.texto, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(9.dp))
        Text(
            "Agregar ejercicio",
            color = tema.texto,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}

/** El encabezado de un bloque, con el lápiz para editar el grupo entero. */
@Composable
private fun EncabezadoGrupo(
    nombre: String,
    color: GroupColor?,
    total: Int,
    onClick: () -> Unit,
) {
    val tono = color?.color ?: tema.texto3
    Row(
        Modifier
            .fillMaxWidth()
            .background(tono.copy(alpha = 0.12f))
            .clickable(onClick = onClick)
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
            fontWeight = FontWeight.Bold,
        )
        Text("$total", color = tono, fontSize = 11.sp)
        Icon(Icons.Filled.Edit, "Editar el grupo", tint = tono, modifier = Modifier.size(12.dp))
    }
}

/** Subir y bajar, que es como se reordena sin arrastrar con el dedo. */
@Composable
private fun Reordenar(
    nombre: String,
    puedeSubir: Boolean,
    puedeBajar: Boolean,
    onSubir: () -> Unit,
    onBajar: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(start = 14.dp, end = 14.dp, bottom = 12.dp),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Flecha(
            Icons.Filled.KeyboardArrowUp,
            "Subir $nombre",
            puedeSubir,
            Modifier.alpha(if (puedeSubir) 1f else 0.35f),
            onSubir,
        )
        Spacer(Modifier.width(8.dp))
        Flecha(
            Icons.Filled.KeyboardArrowDown,
            "Bajar $nombre",
            puedeBajar,
            Modifier.alpha(if (puedeBajar) 1f else 0.35f),
            onBajar,
        )
    }
}

@Composable
private fun Flecha(
    icono: ImageVector,
    rotulo: String,
    activa: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier
            .size(width = 34.dp, height = 30.dp)
            .clip(CircleShape)
            .background(tema.vidrio(1))
            .border(1.dp, tema.borde, CircleShape)
            .clickable(enabled = activa, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icono, rotulo, tint = tema.texto, modifier = Modifier.size(14.dp))
    }
}

/**
 * Un ejercicio del armador. Se abre para editar series, reps, peso, RIR y la
 * nota técnica; al costado están el botón de agrupar y el de quitar.
 */
@Composable
private fun FilaPrescripcion(
    item: RoutineDraftExercise,
    ejercicio: Exercise?,
    nombre: String,
    abierto: Boolean,
    onClick: () -> Unit,
    onQuitar: () -> Unit,
    onAgrupar: () -> Unit,
    onChange: (RoutineDraftExercise) -> Unit,
) {
    val esDeTiempo = ejercicio?.registrationType?.isTimeBased == true
    val llevaPeso = ejercicio?.registrationType == RegistrationType.PESO_REPS

    Column(Modifier.animateContentSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                Modifier.weight(1f).clickable(onClick = onClick),
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
                Text(
                    item.resumen(esDeTiempo),
                    color = tema.texto2,
                    fontSize = 12.sp,
                    maxLines = 1,
                )
                Icon(
                    Icons.Filled.ExpandMore,
                    null,
                    tint = tema.texto3,
                    modifier = Modifier.size(16.dp).rotate(if (abierto) 180f else 0f),
                )
            }
            IconButton(onClick = onAgrupar, modifier = Modifier.size(30.dp)) {
                Icon(
                    if (item.group.isEmpty()) Icons.Outlined.Label else Icons.Filled.Label,
                    if (item.group.isEmpty()) "Agrupar $nombre" else "Grupo de $nombre: ${item.group}",
                    tint =
                        if (item.group.isEmpty()) tema.texto3
                        else GroupColor.resuelto(item.groupColor, item.group)?.color ?: tema.texto3,
                    modifier = Modifier.size(15.dp),
                )
            }
            IconButton(onClick = onQuitar, modifier = Modifier.size(34.dp)) {
                Icon(
                    Icons.Filled.Close,
                    "Quitar $nombre",
                    tint = tema.texto3,
                    modifier = Modifier.size(14.dp),
                )
            }
        }

        if (abierto) {
            DetallePrescripcion(
                item = item,
                llevaPeso = llevaPeso,
                rotuloReps = if (esDeTiempo) "Tiempo (s)" else "Reps",
                onChange = onChange,
            )
        }
    }
}

/** Los campos de la prescripción abierta. */
@Composable
private fun DetallePrescripcion(
    item: RoutineDraftExercise,
    llevaPeso: Boolean,
    rotuloReps: String,
    onChange: (RoutineDraftExercise) -> Unit,
) {
    Column(
        Modifier.padding(start = 14.dp, end = 14.dp, bottom = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CampoEntero("Series", item.cantidadSeries, Modifier.weight(1f)) {
                onChange(item.editando { cambiarCantidad(it) })
            }
            if (!item.esDetallada) {
                CampoEntero(rotuloReps, item.targetReps, Modifier.weight(1f)) {
                    onChange(item.copy(targetReps = it))
                }
                if (llevaPeso) {
                    CampoDecimal("Peso (kg)", item.targetWeight, Modifier.weight(1f)) {
                        onChange(item.copy(targetWeight = it))
                    }
                }
                CampoEntero(
                    "RIR",
                    item.targetRIR ?: -1,
                    Modifier.weight(1f),
                    opcional = true,
                ) { onChange(item.copy(targetRIR = it.takeIf { v -> v >= 0 })) }
            }
        }

        Row(
            Modifier.fillMaxWidth().clickable {
                onChange(item.editando { if (esDetallada) emparejar() else detallar() })
            },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            Icon(
                if (item.esDetallada) Icons.Filled.CheckBox else Icons.Outlined.CheckBox,
                null,
                tint = if (item.esDetallada) tema.solido else tema.texto3,
                modifier = Modifier.size(16.dp),
            )
            Text(
                "Prescribir cada serie por separado",
                color = if (item.esDetallada) tema.texto else tema.texto2,
                fontSize = 12.sp,
            )
        }

        CampoTexto(
            valor = item.techniqueNote,
            onChange = { onChange(item.copy(techniqueNote = it)) },
            placeholder = "Nota técnica (opcional)",
            minHeight = 38.dp,
            fontSize = 12.sp,
            radio = 12.dp,
            paddingHorizontal = 12.dp,
        )

        if (item.esDetallada) {
            Row(
                Modifier.fillMaxWidth().padding(start = 27.dp),
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Spacer(Modifier.width(20.dp))
                RotuloColumna(rotuloReps)
                if (llevaPeso) RotuloColumna("Peso")
                RotuloColumna("RIR")
            }
            item.sets.orEmpty().forEachIndexed { indice, serie ->
                Row(
                    Modifier.fillMaxWidth().padding(start = 27.dp),
                    horizontalArrangement = Arrangement.spacedBy(7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("${indice + 1}", Modifier.width(20.dp), color = tema.texto3, fontSize = 11.sp)
                    CampoEntero(
                        rotuloReps,
                        serie.reps,
                        Modifier.weight(1f),
                        etiqueta = "$rotuloReps de la serie ${indice + 1}",
                    ) { nuevo -> onChange(item.cambiarSerie(indice) { it.copy(reps = nuevo) }) }
                    if (llevaPeso) {
                        CampoDecimal(
                            "Peso",
                            serie.weight,
                            Modifier.weight(1f),
                            etiqueta = "Peso de la serie ${indice + 1}",
                        ) { nuevo -> onChange(item.cambiarSerie(indice) { it.copy(weight = nuevo) }) }
                    }
                    CampoEntero(
                        "RIR",
                        serie.rir ?: -1,
                        Modifier.weight(1f),
                        opcional = true,
                        etiqueta = "RIR de la serie ${indice + 1}",
                    ) { nuevo ->
                        onChange(
                            item.cambiarSerie(indice) { it.copy(rir = nuevo.takeIf { v -> v >= 0 }) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RowScope.RotuloColumna(texto: String) {
    Text(
        texto,
        Modifier.weight(1f),
        color = tema.texto2,
        fontSize = 10.sp,
        textAlign = TextAlign.Center,
    )
}

/**
 * Copia el ejercicio y le aplica el cambio. `RoutineDraftExercise` es mutable
 * para que el dominio sea cómodo, pero en Compose hay que devolver un objeto
 * nuevo o la pantalla no se entera del cambio.
 */
private fun RoutineDraftExercise.editando(
    transformar: RoutineDraftExercise.() -> Unit
): RoutineDraftExercise = copy().also(transformar)

/** Igual, para una de sus series. */
private fun RoutineDraftExercise.cambiarSerie(
    indice: Int,
    transformar: (PlannedSet) -> PlannedSet,
): RoutineDraftExercise {
    val filas = sets ?: return this
    if (indice !in filas.indices) return this
    return copy(sets = filas.toMutableList().also { it[indice] = transformar(it[indice]) })
}

// MARK: - Campos

/** Un campo de texto con la caja de design2. */
@Composable
fun CampoTexto(
    valor: String,
    onChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    minHeight: Dp = 46.dp,
    fontSize: TextUnit = 15.sp,
    etiqueta: String? = null,
    multilinea: Boolean = false,
    radio: Dp = 20.dp,
    paddingHorizontal: Dp = 20.dp,
) {
    val forma = RoundedCornerShape(radio)
    BasicTextField(
        valor,
        onChange,
        modifier
            .fillMaxWidth()
            .heightIn(min = minHeight)
            .clip(forma)
            .background(tema.vidrio(1))
            .border(1.dp, tema.borde, forma)
            .padding(horizontal = paddingHorizontal, vertical = 12.dp)
            .then(
                if (etiqueta != null) Modifier.semantics { contentDescription = etiqueta } else Modifier
            ),
        textStyle = TextStyle(color = tema.texto, fontSize = fontSize),
        singleLine = !multilinea,
        keyboardOptions =
            KeyboardOptions(imeAction = if (multilinea) ImeAction.Default else ImeAction.Next),
        cursorBrush = SolidColor(tema.solido),
        decorationBox = { inner ->
            Box {
                if (valor.isEmpty()) Text(placeholder, color = tema.texto3, fontSize = fontSize)
                inner()
            }
        },
    )
}

/**
 * Un número. Mientras tiene el foco manda lo que se escribe, aunque el valor
 * canónico sea 0; al salir se muestra el valor. `opcional` usa -1 como "vacío",
 * igual que la referencia.
 */
@Composable
fun CampoEntero(
    rotulo: String,
    valor: Int,
    modifier: Modifier = Modifier,
    opcional: Boolean = false,
    etiqueta: String? = null,
    onChange: (Int) -> Unit,
) {
    val canonico =
        if (opcional) (if (valor < 0) "" else "$valor") else (if (valor <= 0) "" else "$valor")
    Column(modifier, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(rotulo, color = tema.texto2, fontSize = 10.sp)
        var texto by remember { mutableStateOf(canonico) }
        var enfocado by remember { mutableStateOf(false) }
        LaunchedEffect(canonico, enfocado) {
            if (!enfocado && texto != canonico) texto = canonico
        }
        Box(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(tema.vidrio(1))
                .border(1.dp, tema.borde, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            BasicTextField(
                texto,
                { nuevo ->
                    val digitos = nuevo.filter { it.isDigit() }
                    texto = digitos
                    onChange(digitos.toIntOrNull() ?: if (opcional) -1 else 0)
                },
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp)
                    .onFocusChanged { enfocado = it.isFocused }
                    .then(
                        if (etiqueta != null) Modifier.semantics { contentDescription = etiqueta }
                        else Modifier
                    ),
                singleLine = true,
                textStyle = TextStyle(color = tema.texto, fontSize = 13.sp, textAlign = TextAlign.Center),
                keyboardOptions =
                    KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                cursorBrush = SolidColor(tema.solido),
                decorationBox = { inner ->
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        if (texto.isEmpty() && !enfocado) Text("—", color = tema.texto3, fontSize = 13.sp)
                        inner()
                    }
                },
            )
        }
    }
}

/** Un decimal, con coma o punto: el teclado regional escribe coma. */
@Composable
fun CampoDecimal(
    rotulo: String,
    valor: Double?,
    modifier: Modifier = Modifier,
    etiqueta: String? = null,
    onChange: (Double?) -> Unit,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(rotulo, color = tema.texto2, fontSize = 10.sp)
        var texto by remember { mutableStateOf(valor?.let { number(it) } ?: "") }
        Box(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(tema.vidrio(1))
                .border(1.dp, tema.borde, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            BasicTextField(
                texto,
                { nuevo ->
                    texto = nuevo
                    onChange(nuevo.replace(",", ".").toDoubleOrNull())
                },
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp)
                    .then(
                        if (etiqueta != null) Modifier.semantics { contentDescription = etiqueta }
                        else Modifier
                    ),
                singleLine = true,
                textStyle = TextStyle(color = tema.texto, fontSize = 13.sp, textAlign = TextAlign.Center),
                keyboardOptions =
                    KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Done),
                cursorBrush = SolidColor(tema.solido),
                decorationBox = { inner ->
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        if (texto.isEmpty()) Text("—", color = tema.texto3, fontSize = 13.sp)
                        inner()
                    }
                },
            )
        }
    }
}
