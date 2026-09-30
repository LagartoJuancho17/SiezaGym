package com.siezagym.app.Features.Routines

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.CustomExerciseDraft
import com.siezagym.app.Domain.ExerciseSearch
import com.siezagym.app.Domain.MuscleRegion
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Services.GymData

/**
 * El selector de ejercicios del armador: buscador, filtro por región y los
 * propios. Se pueden elegir varios a la vez y se confirman juntos.
 */
@Composable
fun SelectorEjercicios(
    data: GymData,
    yaAgregados: Set<String>,
    onCerrar: () -> Unit,
    onElegir: (List<Exercise>) -> Unit,
    onCrearEjercicio: suspend (CustomExerciseDraft) -> String,
) {
    var texto by remember { mutableStateOf("") }
    var region by remember { mutableStateOf<MuscleRegion?>(null) }
    var elegidos by remember { mutableStateOf(setOf<String>()) }
    var soloPropios by remember { mutableStateOf(false) }
    var creando by remember { mutableStateOf(false) }

    val catalogo = remember(data.catalog) { data.catalog.values.sortedBy { it.nameEs } }
    val resultados =
        remember(texto, region, soloPropios, catalogo) {
            val filtrados = ExerciseSearch.filtrar(catalogo, texto, region)
            if (soloPropios) filtrados.filter { it.source == ExerciseSource.CUSTOM } else filtrados
        }
    val propios = catalogo.count { it.source == ExerciseSource.CUSTOM }

    Box(
        Modifier
            .fillMaxSize()
            .background(androidx.compose.ui.graphics.Color.Transparent)
    ) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(start = 18.dp, end = 6.dp, top = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    "Ejercicios",
                    Modifier.weight(1f),
                    color = tema.texto,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                IconButton(onClick = onCerrar, modifier = Modifier.size(44.dp)) {
                    Icon(Icons.Filled.Close, "Cerrar", tint = tema.texto, modifier = Modifier.size(16.dp))
                }
            }

            Row(
                Modifier.fillMaxWidth().padding(horizontal = 18.dp).padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Buscador(texto, { texto = it }, Modifier.weight(1f), "Buscar un ejercicio")
                Box(
                    Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(tema.solido)
                        .clickable { creando = true },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.Add,
                        "Crear un ejercicio propio",
                        tint = tema.sobreSolido,
                        modifier = Modifier.size(22.dp),
                    )
                }
            }

            LazyRow(
                Modifier.fillMaxWidth().padding(top = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(horizontal = 18.dp),
            ) {
                item {
                    Chip("Todos", region == null && !soloPropios) {
                        region = null
                        soloPropios = false
                    }
                }
                if (propios > 0) {
                    item { Chip("Tus ejercicios", soloPropios) { soloPropios = !soloPropios } }
                }
                items(MuscleRegion.entries) { opcion ->
                    Chip(opcion.label, region == opcion) {
                        region = if (region == opcion) null else opcion
                    }
                }
            }

            LazyColumn(Modifier.weight(1f)) {
                item { Spacer(Modifier.height(14.dp)) }
                if (resultados.isEmpty()) {
                    item {
                        Box(Modifier.padding(horizontal = 18.dp)) {
                            when {
                                data.catalog.isEmpty() && data.isLoading ->
                                    Vacio(texto = "Cargando ejercicios…")

                                catalogo.isEmpty() ->
                                    Vacio(texto = "No pudimos traer el catálogo de ejercicios.")

                                soloPropios ->
                                    Vacio(
                                        texto = "Todavía no cargaste ejercicios propios.",
                                        accionTitulo = "Crear uno",
                                        onAccion = { creando = true },
                                    )

                                else ->
                                    Vacio(
                                        texto = "Ningún ejercicio coincide.",
                                        accionTitulo = "Crearlo yo",
                                        onAccion = { creando = true },
                                    )
                            }
                        }
                    }
                } else {
                    item {
                        Box(Modifier.padding(horizontal = 18.dp)) {
                            PanelLista {
                                resultados.forEachIndexed { indice, ejercicio ->
                                    if (indice > 0) Separador()
                                    FilaElegible(
                                        ejercicio = ejercicio,
                                        yaAgregado = ejercicio.id in yaAgregados,
                                        marcado = ejercicio.id in elegidos,
                                        onClick = {
                                            elegidos =
                                                if (ejercicio.id in elegidos) elegidos - ejercicio.id
                                                else elegidos + ejercicio.id
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
                item {
                    CreditoGifs(Modifier.padding(top = 20.dp, bottom = 12.dp))
                }
            }

            Box(Modifier.padding(horizontal = 18.dp, vertical = 12.dp)) {
                SolidButton(
                    if (elegidos.isEmpty()) "Elegí al menos uno"
                    else
                        "Agregar ${elegidos.size} " +
                            if (elegidos.size == 1) "ejercicio" else "ejercicios",
                    enabled = elegidos.isNotEmpty(),
                    onClick = { onElegir(catalogo.filter { it.id in elegidos }) },
                )
            }
        }
    }

    if (creando) {
        HojaEjercicioPropio(
            nombreInicial = texto,
            onCerrar = { creando = false },
            onCrear = { draft ->
                // El ejercicio entra al catálogo con el id que le dio Firestore y
                // de paso queda marcado, que es lo que se quiere después de crearlo.
                val id = onCrearEjercicio(draft)
                elegidos = elegidos + id
                texto = ""
                region = null
                soloPropios = true
                creando = false
                id
            },
        )
    }
}

@Composable
private fun Chip(texto: String, activo: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(CircleShape)
            .background(if (activo) tema.solido else tema.vidrio(1))
            .then(if (activo) Modifier else Modifier.border(1.dp, tema.borde, CircleShape))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp)
            .heightIn(min = 36.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            texto,
            color = if (activo) tema.sobreSolido else tema.texto,
            fontSize = 13.sp,
        )
    }
}

/** Una fila del selector. Lo que ya está en la rutina no se puede volver a marcar. */
@Composable
private fun FilaElegible(
    ejercicio: Exercise,
    yaAgregado: Boolean,
    marcado: Boolean,
    onClick: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(enabled = !yaAgregado, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .then(if (yaAgregado) Modifier.alpha(0.45f) else Modifier),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Miniatura(ejercicio.thumbnailUrl, lado = 54.dp)
        Column(Modifier.weight(1f)) {
            Text(ejercicio.nameEs, color = tema.texto, fontSize = 14.sp, maxLines = 2)
            Text(
                subtitulo(ejercicio, yaAgregado),
                color = tema.texto2,
                fontSize = 11.sp,
            )
        }
        Box(
            Modifier
                .size(24.dp)
                .clip(CircleShape)
                .border(1.dp, tema.bordeFuerte, CircleShape)
                .then(if (marcado) Modifier.background(tema.solido) else Modifier),
            contentAlignment = Alignment.Center,
        ) {
            if (marcado) {
                Icon(
                    Icons.Filled.Check,
                    null,
                    tint = tema.sobreSolido,
                    modifier = Modifier.size(13.dp),
                )
            }
        }
    }
}

private fun subtitulo(ejercicio: Exercise, yaAgregado: Boolean): String =
    listOfNotNull(
        if (ejercicio.source == ExerciseSource.CUSTOM) "Tuyo" else null,
        ejercicio.primaryMuscle?.label,
        if (yaAgregado) "ya está en la rutina" else null,
    ).joinToString(" · ")
