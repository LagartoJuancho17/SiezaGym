package com.siezagym.app.Features.Shared

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.siezagym.app.Features.Profile.ProfileScreen
import com.siezagym.app.Features.Progress.ProgressScreen
import com.siezagym.app.Features.Routines.*
import com.siezagym.app.Features.Workout.WorkoutScreen
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.*

@Composable
fun RootView(auth: AuthService) {
    val state by auth.state.collectAsStateWithLifecycle()
    when (val current = state) {
        AuthService.State.Loading ->
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Theme.accent)
            }
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

@OptIn(ExperimentalMaterial3Api::class)
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
            if (!workout && data.isLoading)
                LinearProgressIndicator(Modifier.fillMaxWidth(), color = Theme.accent)
            if (!workout)
                data.loadError?.let { error ->
                    Row(
                        Modifier.padding(horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            error,
                            Modifier.weight(1f),
                            color = Theme.accentLight,
                            fontSize = 12.sp,
                        )
                        TextButton(onClick = { store.load() }) {
                            Text("Reintentar", color = Theme.accentLight)
                        }
                    }
                }
            NavHost(nav, startDestination = AppTab.HOME.name, modifier = Modifier.weight(1f)) {
                navigation(startDestination = "home", route = AppTab.HOME.name) {
                    composable("home") {
                        PullToRefreshBox(data.isLoading, { store.load() }) {
                            HomeScreen(data, ::start)
                        }
                    }
                }
                navigation(startDestination = "routines", route = AppTab.ROUTINES.name) {
                    composable("routines") {
                        PullToRefreshBox(data.isLoading, { store.load() }) {
                            RoutinesScreen(data) {
                                nav.navigate("routine/${Uri.encode(it.id)}/${it.isAssigned}")
                            }
                        }
                    }
                    composable("routine/{id}/{assigned}") { detail ->
                        val routine =
                            data.routines.firstOrNull {
                                it.id == detail.arguments?.getString("id") &&
                                    it.isAssigned ==
                                        (detail.arguments?.getString("assigned") == "true")
                            }
                        Page(routine?.name ?: "Rutina", { nav.popBackStack() }) {
                            if (routine != null)
                                RoutineDetailScreen(routine, data) { start(routine) }
                            else Unavailable(data)
                        }
                    }
                }
                navigation(startDestination = "history", route = AppTab.HISTORY.name) {
                    composable("history") {
                        Page("Historial") {
                            PullToRefreshBox(data.isLoading, { store.load() }) {
                                HistoryScreen(data) { nav.navigate("session/${Uri.encode(it.id)}") }
                            }
                        }
                    }
                    composable("session/{id}") { detail ->
                        val session =
                            data.sessions.firstOrNull { it.id == detail.arguments?.getString("id") }
                        Page(session?.let(::sessionDate) ?: "Sesión", { nav.popBackStack() }) {
                            if (session != null) SessionDetailScreen(session, data)
                            else Unavailable(data)
                        }
                    }
                }
                navigation(startDestination = "progress", route = AppTab.PROGRESS.name) {
                    composable("progress") {
                        Page("Progreso") {
                            PullToRefreshBox(data.isLoading, { store.load() }) {
                                ProgressScreen(data)
                            }
                        }
                    }
                }
                navigation(startDestination = "profile", route = AppTab.PROFILE.name) {
                    composable("profile") { Page("Perfil") { ProfileScreen(data, store, auth) } }
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
                    else Page("Entrenamiento", { nav.popBackStack() }) { Unavailable(data) }
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
                Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp),
            )
    }
}

@Composable
private fun Page(title: String, onBack: (() -> Unit)? = null, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth()
                .heightIn(min = if (onBack == null) 68.dp else 52.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onBack != null)
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver", tint = Theme.onDark)
                }
            Text(
                title,
                color = Theme.onDark,
                fontSize = if (onBack == null) 34.sp else 18.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
            )
        }
        Box(Modifier.weight(1f)) { content() }
    }
}

@Composable
private fun Unavailable(data: GymData) {
    Text(
        if (data.isLoading) "Cargando…"
        else "No pudimos encontrar este contenido. Volvé e intentá actualizar.",
        Modifier.padding(24.dp),
        color = Theme.onDarkMuted,
    )
}
