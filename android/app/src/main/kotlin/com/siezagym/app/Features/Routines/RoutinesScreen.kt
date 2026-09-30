package com.siezagym.app.Features.Routines

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.RoutineSearch
import com.siezagym.app.Domain.RoutineSummary
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.GymData

/**
 * Las rutinas, agrupadas por semana de calendario. Buscando deja de agrupar:
 * el orden por fecha estorba cuando lo que se busca es un nombre.
 */
@Composable
fun RoutinesScreen(
    data: GymData,
    onOpen: (Routine) -> Unit,
    onStart: (Routine) -> Unit = {},
    onCreate: (() -> Unit)? = null,
    onEdit: ((Routine) -> Unit)? = null,
    onDelete: (Routine) -> Unit = {},
    onDuplicate: (Routine) -> Unit = {},
    onToggleHome: (Routine) -> Unit = {},
) {
    var busqueda by rememberSaveable { mutableStateOf("") }
    var porBorrar by remember { mutableStateOf<Routine?>(null) }
    var menuDe by remember { mutableStateOf<Routine?>(null) }

    val visibles = data.routines.filter { routine ->
        RoutineSearch.coincide(routine.name, busqueda)
    }
    val agrupar = busqueda.isBlank()
    val secciones = TrainingCalendar.seccionesPorSemana(visibles) { it.referenceDate }

    Pantalla(
        titulo = "Rutinas",
        accion = { onCreate?.let { BotonNuevaRutina(it) } },
    ) {
        Spacer(Modifier.height(20.dp))
        Buscador(busqueda, { busqueda = it })

        when {
            data.routines.isEmpty() -> {
                Spacer(Modifier.height(24.dp))
                Vacio(
                    texto = "Todavía no tenés rutinas.",
                    accionTitulo = "Crear la primera",
                    onAccion = onCreate,
                )
            }

            visibles.isEmpty() -> {
                Spacer(Modifier.height(24.dp))
                Vacio(texto = "Ninguna rutina coincide.")
            }

            agrupar ->
                secciones.forEach { seccion ->
                    SectionLabel(seccion.texto, Modifier.padding(top = 24.dp, bottom = 10.dp))
                    PanelRutinas(seccion.items, data, onOpen, onEdit, onToggleHome, onDuplicate,
                    menuDe, { menuDe = it }, { menuDe = null }, { porBorrar = it })
                }

            else -> {
                Spacer(Modifier.height(24.dp))
                PanelRutinas(visibles, data, onOpen, onEdit, onToggleHome, onDuplicate,
                    menuDe, { menuDe = it }, { menuDe = null }, { porBorrar = it })
            }
        }
    }

    // Las acciones llegan desde RootView, que es quien tiene el store y el workout.
    menuDe?.let { rutina ->
        AccionesRutina(
            rutina = rutina,
            onEdit = onEdit?.let { accion -> { menuDe = null; accion(rutina) } },
            onToggleHome = { menuDe = null; onToggleHome(rutina) },
            onDuplicate = { menuDe = null; onDuplicate(rutina) },
            onDelete = { menuDe = null; porBorrar = rutina },
        )
    }

    porBorrar?.let { rutina ->
        AlertDialog(
            onDismissRequest = { porBorrar = null },
            title = { Text("¿Eliminar ${rutina.name}?", color = tema.texto) },
            text = {
                Text(
                    "No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en el historial.",
                    color = tema.texto2,
                    fontSize = 14.sp,
                )
            },
            confirmButton = {
                TextButton(onClick = { porBorrar = null; onDelete(rutina) }) {
                    Text("Eliminar", color = tema.solido)
                }
            },
            dismissButton = {
                TextButton(onClick = { porBorrar = null }) {
                    Text("Cancelar", color = tema.texto2)
                }
            },
            containerColor = tema.vidrio(3),
        )
    }
}

@Composable
private fun PanelRutinas(
    rutinas: List<Routine>,
    data: GymData,
    onOpen: (Routine) -> Unit,
    onEdit: ((Routine) -> Unit)?,
    onToggleHome: (Routine) -> Unit,
    onDuplicate: (Routine) -> Unit,
    abierto: Routine?,
    onAbrir: (Routine?) -> Unit,
    onCerrar: () -> Unit,
    onPedirBorrado: (Routine) -> Unit,
) {
    PanelLista {
        rutinas.forEachIndexed { indice, rutina ->
            if (indice > 0) Separador()
            FilaRutina(
                rutina = rutina,
                data = data,
                onOpen = { onOpen(rutina) },
                onEdit = onEdit?.let { accion -> { accion(rutina) } },
                onToggleHome = { onToggleHome(rutina) },
                onDuplicate = { onDuplicate(rutina) },
                onDelete = { onPedirBorrado(rutina) },
                onLongPress = { onAbrir(rutina) },
            )
        }
    }
}

@Composable
private fun FilaRutina(
    rutina: Routine,
    data: GymData,
    onOpen: () -> Unit,
    onEdit: (() -> Unit)?,
    onToggleHome: () -> Unit,
    onDuplicate: () -> Unit,
    onDelete: () -> Unit,
    onLongPress: () -> Unit,
) {
    // Una rutina del coach se abre pero no se toca: el menú es de las propias.
    val propia = !rutina.isAssigned
    Box {
        FilaLista(
            nombre = rutina.name,
            detalle = detalleRutina(rutina, data),
            etiqueta = if (rutina.isAssigned) "Del coach" else null,
            modifier =
                if (propia) Modifier.combinedClickable(onClick = onOpen, onLongClick = onLongPress)
                else Modifier.clickable(onClick = onOpen),
        )
    }
}

@Composable
private fun BotonNuevaRutina(onCreate: () -> Unit) {
    IconButton(
        onClick = onCreate,
        modifier = Modifier.size(56.dp).clip(CircleShape).background(tema.solido),
    ) {
        Icon(
            Icons.Filled.Add,
            "Nueva rutina",
            tint = tema.sobreSolido,
            modifier = Modifier.size(24.dp),
        )
    }
}

/**
 * El menú de una rutina propia. Va en un diálogo porque no hay menú contextual
 * de sistema en Compose, pero mantiene los cuatro comandos de iOS.
 */
@Composable
private fun AccionesRutina(
    rutina: Routine,
    onEdit: (() -> Unit)?,
    onToggleHome: () -> Unit,
    onDuplicate: () -> Unit,
    onDelete: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = {},
        title = { Text(rutina.name, color = tema.texto) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (onEdit != null) AccionMenu("Editar") { onEdit() }
                AccionMenu(if (rutina.showOnHome) "Quitar de la portada" else "Mostrar en la portada") {
                    onToggleHome()
                }
                AccionMenu("Duplicar") { onDuplicate() }
                AccionMenu("Eliminar", destructivo = true) { onDelete() }
            }
        },
        confirmButton = {},
        containerColor = tema.vidrio(3),
    )
}

@Composable
private fun AccionMenu(texto: String, destructivo: Boolean = false, onClick: () -> Unit) {
    Text(
        texto,
        Modifier
            .fillMaxWidth()
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        color = if (destructivo) tema.solido else tema.texto,
        fontSize = 15.sp,
    )
}

/** "3 ejercicios · 12 series · 45 min" */
private fun detalleRutina(rutina: Routine, data: GymData): String {
    val ejercicios = rutina.exercises.size
    val series = rutina.totalSets
    return "$ejercicios ${if (ejercicios == 1) "ejercicio" else "ejercicios"} · " +
        "$series ${if (series == 1) "serie" else "series"} · " +
        "${RoutineSummary.estimatedMinutes(rutina, data.catalog)} min"
}
