package com.siezagym.app.Features.Shared

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import androidx.navigation.navigation
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Features.Auth.LoginScreen
import com.siezagym.app.Features.History.*
import com.siezagym.app.Features.Home.HomeScreen
import com.siezagym.app.Features.Profile.*
import com.siezagym.app.Features.Routines.*
import com.siezagym.app.Features.Workout.WorkoutScreen
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.*

@Composable
fun RootView(auth: AuthService) {
    val state by auth.state.collectAsStateWithLifecycle()
    when (val current = state) {
        AuthService.State.Loading -> Cargando("Abriendo la cuenta…")
        AuthService.State.SignedOut -> LoginScreen(auth)
        is AuthService.State.SignedIn ->
            key(current.uid) {
                // The account owns all ViewModels. Sign-out cancels loads and removes private
                // state.
                val owner = remember {
                    object : ViewModelStoreOwner {
                        override val viewModelStore = ViewModelStore()
                    }
                }
                DisposableEffect(owner) { onDispose { owner.viewModelStore.clear() } }
                val store: GymStore =
                    viewModel(
                        viewModelStoreOwner = owner,
                        factory =
                            object : ViewModelProvider.Factory {
                                @Suppress("UNCHECKED_CAST")
                                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                                    GymStore(current.uid) as T
                            },
                    )
                MainTabs(auth, store)
            }
    }
}

@Composable
private fun MainTabs(auth: AuthService, store: GymStore) {
    val data by store.data.collectAsStateWithLifecycle()
    val nav = rememberNavController()
    val entry by nav.currentBackStackEntryAsState()
    val route = entry?.destination?.route.orEmpty()
    val active =
        AppTab.entries.firstOrNull { tab ->
            entry?.destination?.hierarchy?.any { it.route == tab.name } == true
        } ?: AppTab.HOME
    // El entrenamiento ocupa la pantalla sola: la barra se oculta.
    val workout = route.startsWith("workout")
    fun start(routine: Routine?) {
        nav.navigate(
            "workout/${routine?.id?.let(Uri::encode) ?: "free"}/${routine?.isAssigned ?: false}"
        ) {
            launchSingleTop = true
        }
    }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            if (!workout && data.isLoading) LinearProgressIndicator(Modifier.fillMaxWidth())
            if (!workout) data.loadError?.let { error -> BannerError(error) { store.load() } }

            NavHost(nav, startDestination = AppTab.HOME.name, modifier = Modifier.weight(1f)) {
                navigation(startDestination = "home", route = AppTab.HOME.name) {
                    composable("home") {
                        PullToRefreshBox(data.isLoading, { store.load() }) { HomeScreen(data, ::start) }
                    }
                }

                navigation(startDestination = "routines", route = AppTab.ROUTINES.name) {
                    composable("routines") {
                        PullToRefreshBox(data.isLoading, { store.load() }) {
                            RoutinesScreen(data) { nav.navigate("routine/${Uri.encode(it.id)}/${it.isAssigned}") }
                        }
                    }
                    composable("routine/{id}/{assigned}") { detail ->
                        val routine =
                            data.routines.firstOrNull {
                                it.id == detail.arguments?.getString("id") &&
                                    it.isAssigned == (detail.arguments?.getString("assigned") == "true")
                            }
                        Pantalla(
                            titulo = routine?.name ?: "Rutina",
                            volver = true,
                            onVolver = { nav.popBackStack() },
                        ) {
                            if (routine != null) RoutineDetailScreen(routine, data) { start(routine) }
                            else NoEncontrado(data)
                        }
                    }
                }

                navigation(startDestination = "history", route = AppTab.HISTORY.name) {
                    composable("history") {
                        Pantalla(titulo = "Historial") {
                            PullToRefreshBox(data.isLoading, { store.load() }) {
                                HistoryScreen(data) { nav.navigate("session/${Uri.encode(it.id)}") }
                            }
                        }
                    }
                    composable("session/{id}") { detail ->
                        val session = data.sessions.firstOrNull { it.id == detail.arguments?.getString("id") }
                        Pantalla(
                            titulo = session?.let(::sessionDate) ?: "Sesión",
                            volver = true,
                            onVolver = { nav.popBackStack() },
                        ) {
                            if (session != null) SessionDetailScreen(session, data) else NoEncontrado(data)
                        }
                    }
                }

                // Progreso ya no es una pestaña: son cinco pantallas dentro de
                // Perfil, con su propio título y vuelta atrás.
                navigation(startDestination = "profile", route = AppTab.PROFILE.name) {
                    composable("profile") {
                        Pantalla(titulo = "Perfil") {
                            ProfileScreen(data, store, auth) { destino -> nav.navigate(destino) }
                        }
                    }
                    composable("progreso/volume") {
                        Pantalla(titulo = "Volumen", volver = true, onVolver = { nav.popBackStack() }) {
                            VolumeScreen(data)
                        }
                    }
                    composable("progreso/dias") {
                        Pantalla(titulo = "Días entrenados", volver = true, onVolver = { nav.popBackStack() }) {
                            TrainedDaysScreen(data)
                        }
                    }
                    composable("progreso/musculos") {
                        Pantalla(titulo = "Volumen por músculo", volver = true, onVolver = { nav.popBackStack() }) {
                            MuscleVolumeScreen(data)
                        }
                    }
                    composable("progreso/empuje-traccion") {
                        Pantalla(titulo = "Empuje y tracción", volver = true, onVolver = { nav.popBackStack() }) {
                            PushPullScreen(data)
                        }
                    }
                    composable("progreso/ejercicio/{id}") { detail ->
                        val id = detail.arguments?.getString("id").orEmpty()
                        Pantalla(
                            titulo = data.name(id),
                            volver = true,
                            onVolver = { nav.popBackStack() },
                        ) {
                            ExerciseHistoryScreen(id, data)
                        }
                    }
                }

                composable("workout/{id}/{assigned}") { detail ->
                    val id = detail.arguments?.getString("id")
                    val routine =
                        data.routines.firstOrNull {
                            it.id == id &&
                                it.isAssigned == (detail.arguments?.getString("assigned") == "true")
                        }
                    if (data.hasLoaded && (id == "free" || routine != null))
                        WorkoutScreen(routine, data, store) { nav.popBackStack() }
                    else Pantalla(titulo = "Entrenamiento", volver = true, onVolver = { nav.popBackStack() }) {
                        NoEncontrado(data)
                    }
                }
            }
        }

        if (!workout)
            BottomNav(
                active,
                { tab ->
                    if (tab != active)
                        nav.navigate(tab.name) {
                            popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                },
                Modifier.align(Alignment.BottomCenter).padding(bottom = bottomNavGap),
            )
    }
}

/** El error de carga: qué pasó y cómo reintentar. */
@Composable
private fun BannerError(error: String, onRetry: () -> Unit) {
    PanelLista {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(error, Modifier.weight(1f), color = tema.texto2, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
            GhostButton("Reintentar", onClick = onRetry)
        }
    }
}

@Composable
private fun Cargando(texto: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Vacio(texto) }
}

@Composable
private fun NoEncontrado(data: GymData) {
    Vacio(
        if (data.isLoading) "Cargando…"
        else "No pudimos encontrar este contenido. Volvé e intentá actualizar."
    )
}
