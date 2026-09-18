package com.siezagym.app.Features.Shared

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.siezagym.app.DesignSystem.Backdrop
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.Features.Auth.LoginScreen
import com.siezagym.app.Features.History.HistoryScreen
import com.siezagym.app.Features.Home.HomeScreen
import com.siezagym.app.Features.Profile.ProfileScreen
import com.siezagym.app.Features.Progress.ProgressScreen
import com.siezagym.app.Features.Routines.RoutineDetailScreen
import com.siezagym.app.Features.Routines.RoutinesScreen
import com.siezagym.app.Features.Workout.WorkoutScreen
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.AuthService
import com.siezagym.app.Services.GymStore
import kotlinx.coroutines.flow.collectAsState

/** La raíz: la sesión decide qué se ve, y el entrenamiento en curso va por
 *  encima de todo (como el `fullScreenCover` de iOS). */
@Composable
fun RootView(auth: AuthService) {
    val tema = LocalD2Theme.current
    val estado by auth.state.collectAsState()

    Box(
        Modifier
            .fillMaxSize()
            .background(tema.fondoPlano),
    ) {
        Backdrop()

        when (val e = estado) {
            AuthService.State.Loading -> {
                CircularProgressIndicator(color = tema.texto, modifier = Modifier.align(Alignment.Center))
            }
            AuthService.State.SignedOut -> {
                LoginScreen(auth = auth)
            }
            is AuthService.State.SignedIn -> {
                MainTabView(uid = e.uid, auth = auth)
            }
        }
    }
}

/** Las cinco secciones con la barra de abajo. Cada tab conserva su propia pila
 *  de navegación al ir y volver, como la TabView de iOS. */
@Composable
fun MainTabView(uid: String, auth: AuthService) {
    val store = remember(uid) { GymStore(uid) }
    LaunchedEffect(store) { store.load() }

    var tab by rememberSaveable { mutableStateOf(AppTab.HOME) }
    var entrenamiento by remember { mutableStateOf<Routine?>(null) }

    Box(Modifier.fillMaxSize()) {
        TabHost(activo = tab == AppTab.HOME) { nav ->
            NavHost(navController = nav, startDestination = Routes.HOME) {
                composable(Routes.HOME) {
                    HomeScreen(
                        store = store,
                        onEmpezar = { entrenamiento = it },
                        onIrATab = { tab = it },
                        onAbrirRutina = { id -> nav.navigate(Routes.routineDetail(id)) },
                    )
                }
                composable(Routes.ROUTINE_DETAIL) { entrada ->
                    val id = entrada.arguments?.getString("routineId").orEmpty()
                    val rutina = store.rutina(id)
                    if (rutina != null) {
                        RoutineDetailScreen(
                            routine = rutina,
                            store = store,
                            volver = { nav.popBackStack() },
                            onEmpezar = { entrenamiento = it },
                        )
                    }
                }
            }
        }

        TabHost(activo = tab == AppTab.ROUTINES) { nav ->
            NavHost(navController = nav, startDestination = Routes.ROUTINES) {
                composable(Routes.ROUTINES) {
                    RoutinesScreen(store = store, onEmpezar = { entrenamiento = it })
                }
                composable(Routes.ROUTINE_DETAIL) { entrada ->
                    val id = entrada.arguments?.getString("routineId").orEmpty()
                    val rutina = store.rutina(id)
                    if (rutina != null) {
                        RoutineDetailScreen(
                            routine = rutina,
                            store = store,
                            volver = { nav.popBackStack() },
                            onEmpezar = { entrenamiento = it },
                        )
                    }
                }
            }
        }

        TabHost(activo = tab == AppTab.HISTORY) { nav ->
            NavHost(navController = nav, startDestination = Routes.HISTORY) {
                composable(Routes.HISTORY) { HistoryScreen(store = store) }
            }
        }

        TabHost(activo = tab == AppTab.PROGRESS) { nav ->
            NavHost(navController = nav, startDestination = Routes.PROGRESS) {
                composable(Routes.PROGRESS) { ProgressScreen(store = store) }
            }
        }

        TabHost(activo = tab == AppTab.PROFILE) { nav ->
            NavHost(navController = nav, startDestination = Routes.PROFILE) {
                composable(Routes.PROFILE) { ProfileScreen(store = store, auth = auth) }
            }
        }

        BottomNav(
            seleccion = tab,
            onSeleccionar = { tab = it },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding(),
        )

        entrenamiento?.let { rutina ->
            WorkoutScreen(
                store = store,
                routine = rutina,
                onCerrar = { entrenamiento = null },
            )
        }
    }
}

/** Un host por tab: solo se ve el activo, pero el resto conserva su estado y su
 *  pila de navegación al volver. */
@Composable
private fun TabHost(
    activo: Boolean,
    contenido: @Composable (NavHostController) -> Unit,
) {
    val nav = rememberNavController()
    Box(
        Modifier
            .fillMaxSize()
            .graphicsLayer {
                visible = activo
            },
    ) {
        contenido(nav)
    }
}