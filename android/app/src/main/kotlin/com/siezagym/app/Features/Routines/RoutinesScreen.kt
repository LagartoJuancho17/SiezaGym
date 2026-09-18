package com.siezagym.app.Features.Routines

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.CapsuleShape
import com.siezagym.app.DesignSystem.FilaLista
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.DesignSystem.Vacio
import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Features.Shared.NavInset
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymStore
import java.text.Normalizer

/** Las rutinas, con la misma forma que `/rutinas` en la web: título con el
 *  botón de nueva, buscador, y un panel con una fila por rutina. En esta
 *  versión la navegación al detalle (y al armador) se resuelve con estado
 *  interno: las pantallas van encima, dentro de la misma estructura. */
@Composable
fun RoutinesScreen(store: GymStore, onEmpezar: (Routine) -> Unit) {
    val tema = LocalD2Theme.current
    val rutinas by store.routines.collectAsState()
    val catalogo by store.catalog.collectAsState()

    var busqueda by rememberSaveable { mutableStateOf("") }
    var detalle by remember { mutableStateOf<Routine?>(null) }
    var mostrandoComposer by remember { mutableStateOf(false) }

    val termino = normalizar(busqueda.trim())
    val visibles = if (termino.isEmpty()) rutinas else rutinas.filter { normalizar(it.name).contains(termino) }

    Box(Modifier.fillMaxSize()) {
        Pantalla(
            titulo = "Rutinas",
            accion = {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(tema.solido)
                        .clickable { mostrandoComposer = true },
                ) {
                    Icon(
                        Icons.Filled.Add,
                        contentDescription = "Crear rutina",
                        tint = tema.sobreSolido,
                        modifier = Modifier.size(18.dp),
                    )
                }
            },
        ) {
            Column {
                Buscador(valor = busqueda, onChange = { busqueda = it })

                when {
                    rutinas.isEmpty() -> Vacio(
                        texto = "Todavía no tenés rutinas.\nCreá la primera desde acá.",
                        modifier = Modifier.padding(top = 24.dp),
                    )
                    visibles.isEmpty() -> Vacio(
                        texto = "Ninguna rutina coincide.",
                        modifier = Modifier.padding(top = 24.dp),
                    )
                    else -> PanelLista(Modifier.padding(top = 24.dp)) {
                        visibles.forEachIndexed { indice, rutina ->
                            if (indice > 0) {
                                Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
                            }
                            FilaLista(
                                nombre = rutina.name,
                                detalle = detalle(rutina, catalogo),
                                etiqueta = if (rutina.isAssigned) "Del coach" else null,
                                onClick = { detalle = rutina },
                            )
                        }
                    }
                }

                Spacer(Modifier.height(NavInset.bottom.dp))
            }
        }

        detalle?.let { rutina ->
            RoutineDetailScreen(
                routine = rutina,
                store = store,
                volver = { detalle = null },
                onEmpezar = onEmpezar,
            )
        }

        if (mostrandoComposer) {
            RoutineComposerScreen(store = store, onCerrar = { mostrandoComposer = false })
        }
    }
}

/** El buscador en pastilla, con la lupa y el texto de la web. */
@Composable
private fun Buscador(valor: String, onChange: (String) -> Unit) {
    val tema = LocalD2Theme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp)
            .clip(CapsuleShape)
            .background(tema.vidrio(1))
            .border(1.dp, tema.borde, CapsuleShape)
            .padding(horizontal = 20.dp),
    ) {
        Icon(
            Icons.Filled.Search,
            contentDescription = null,
            tint = tema.texto,
            modifier = Modifier.size(17.dp),
        )
        Spacer(Modifier.width(9.dp))
        TextField(
            value = valor,
            onValueChange = onChange,
            singleLine = true,
            placeholder = { Text("Buscar", color = tema.texto2) },
            textStyle = TextStyle(color = tema.texto, fontSize = 15.sp),
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
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight(),
        )
    }
}

private fun detalle(rutina: Routine, catalogo: Map<String, Exercise>): String {
    val ejercicios = rutina.exercises.count()
    val series = rutina.totalSets
    val minutos = RoutineSummary.estimatedMinutes(rutina, catalogo)
    return "$ejercicios ${if (ejercicios == 1) "ejercicio" else "ejercicios"} · $series ${if (series == 1) "serie" else "series"} · $minutos min"
}

/** Búsqueda insensible a acentos y a mayúsculas, como el `folding` de Swift:
 *  se descompone a NFD y se descartan las marcas de combinación. */
private fun normalizar(texto: String): String =
    Normalizer.normalize(texto, Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .lowercase()