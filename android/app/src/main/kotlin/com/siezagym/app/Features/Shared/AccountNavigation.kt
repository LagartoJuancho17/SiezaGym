package com.siezagym.app.Features.Shared

import android.net.Uri
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import com.siezagym.app.DesignSystem.tema
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import androidx.navigation.navigation
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.Features.History.*
import com.siezagym.app.Features.Profile.*
import com.siezagym.app.Services.GymData

/** El mismo grafo se prueba entrando desde la barra inferior, con y sin sesiones. */
internal fun NavGraphBuilder.accountDestinations(
    nav: NavHostController,
    data: GymData,
    onRefresh: () -> Unit,
    onSaveProfile: suspend (Map<String, Any?>) -> Unit,
    onSignOut: () -> Unit,
) {
    navigation(startDestination = "history", route = AppTab.HISTORY.name) {
        composable("history") {
            PullToRefreshBox(data.isLoading, onRefresh) {
                Pantalla(titulo = "Historial", rotulo = "Tu actividad") {
                    HistoryScreen(data) { nav.navigate("session/${Uri.encode(it.id)}") }
                }
            }
        }
        composable("session/{id}") { detail ->
            val session = data.sessions.firstOrNull { it.id == detail.arguments?.getString("id") }
            Pantalla(
                titulo = session?.routineName?.ifBlank { null } ?: "Sesión libre",
                rotulo = session?.let(::sessionDate),
                volver = true,
                onVolver = { nav.popBackStack() },
            ) {
                if (session != null) SessionDetailScreen(session, data)
                else com.siezagym.app.DesignSystem.Vacio("La sesión no está disponible.")
            }
        }
    }

    // Perfil muestra el progreso y mantiene edición, temas y ejercicios en rutas propias.
    navigation(startDestination = "profile", route = AppTab.PROFILE.name) {
        composable("profile") {
            Pantalla(titulo = "Perfil", accion = {
                IconButton(onClick = { nav.navigate("perfil/configuracion") }) {
                    Icon(Icons.Filled.Settings, "Configuración", tint = tema.texto)
                }
            }) {
                ProfileScreen(data, onSignOut) { destino -> nav.navigate(destino) }
            }
        }
        composable("perfil/editar") {
            Pantalla(titulo = "Editar perfil", volver = true, onVolver = { nav.popBackStack() }) {
                ProfileEditScreen(data, onSaveProfile)
            }
        }
        composable("perfil/configuracion") {
            Pantalla(titulo = "Configuración", volver = true, onVolver = { nav.popBackStack() }) {
                ProfileSettingsScreen()
            }
        }
        composable("progreso/volume") {
            Pantalla(titulo = "Volumen", volver = true, onVolver = { nav.popBackStack() }) {
                Spacer(Modifier.height(20.dp))
                VolumeScreen(data)
            }
        }
        composable("progreso/dias") {
            Pantalla(titulo = "Días entrenados", volver = true, onVolver = { nav.popBackStack() }) {
                Spacer(Modifier.height(20.dp))
                TrainedDaysScreen(data)
            }
        }
        composable("progreso/musculos") {
            Pantalla(
                titulo = "Volumen por músculo",
                volver = true,
                onVolver = { nav.popBackStack() },
            ) {
                Spacer(Modifier.height(20.dp))
                MuscleVolumeScreen(data)
            }
        }
        composable("progreso/empuje-traccion") {
            Pantalla(
                titulo = "Empuje y tracción",
                volver = true,
                onVolver = { nav.popBackStack() },
            ) {
                Spacer(Modifier.height(20.dp))
                PushPullScreen(data)
            }
        }
        composable("progreso/ejercicio") {
            Pantalla(titulo = "Por ejercicio", volver = true, onVolver = { nav.popBackStack() }) {
                ExerciseHistoryScreen(data)
            }
        }
    }
}
