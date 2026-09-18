package com.siezagym.app.Features.Shared

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.FitnessCenter
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.AutoGraph
import androidx.compose.ui.graphics.vector.ImageVector

/** Las cinco secciones de la app, idénticas a la web. */
enum class AppTab(
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
) {
    HOME("Inicio", Icons.Filled.Home, Icons.Outlined.Home),
    ROUTINES("Rutinas", Icons.Filled.FitnessCenter, Icons.Outlined.FitnessCenter),
    HISTORY("Historial", Icons.Filled.DateRange, Icons.Outlined.DateRange),
    PROGRESS("Progreso", Icons.Filled.AutoGraph, Icons.Outlined.AutoGraph),
    PROFILE("Perfil", Icons.Filled.Person, Icons.Outlined.Person),
}

/** Rutas de navegación, espejo de las pantallas de iOS. */
object Routes {
    const val HOME = "home"
    const val ROUTINES = "routines"
    const val HISTORY = "history"
    const val PROGRESS = "progress"
    const val PROFILE = "profile"
    const val ROUTINE_DETAIL = "routine/{routineId}"
    const val ROUTINE_COMPOSER = "routine_composer"
    const val WORKOUT = "workout/{routineId}"
    const val LOGIN = "login"

    fun routineDetail(id: String) = "routine/$id"
    fun workout(routineId: String) = "workout/$routineId"
}