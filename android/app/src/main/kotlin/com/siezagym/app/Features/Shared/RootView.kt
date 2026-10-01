package com.siezagym.app.Features.Shared

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.compose.LifecycleEventEffect
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
import com.siezagym.app.Features.Onboarding.OnboardingScreen
import com.siezagym.app.Features.Onboarding.OnboardingStore
import com.siezagym.app.Features.Profile.*
import com.siezagym.app.Features.Routines.*
import com.siezagym.app.Features.Workout.WorkoutScreen
import com.siezagym.app.Models.Routine
import com.siezagym.app.Services.*
import kotlinx.coroutines.launch

@Composable
fun RootView(auth: AuthService) {
    val state by auth.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    // El recorrido va antes del login y sólo la primera vez en cada teléfono.
    val recorrido = remember { OnboardingStore(context) }
    var mostrarRecorrido by remember { mutableStateOf(recorrido.pendiente) }
    SessionGate(
        state,
        signedOut = {
            if (mostrarRecorrido) {
                OnboardingScreen(
                    onComplete = {
                        recorrido.marcarCompletado()
                        mostrarRecorrido = false
                    }
                )
            } else {
                LoginScreen(auth)
            }
        },
        signedIn = { current ->
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
                                    GymStore(current.uid, context.applicationContext) as T
                            },
                    )
                MainTabs(auth, store)
            }
        },
    )
}

/** Sólo una sesión Firebase autenticada puede montar los datos y las pestañas. */
@Composable
internal fun SessionGate(
    state: AuthService.State,
    signedOut: @Composable () -> Unit,
    signedIn: @Composable (AuthService.State.SignedIn) -> Unit,
) {
    when (state) {
        AuthService.State.Loading -> Cargando("Abriendo la cuenta…")
        AuthService.State.SignedOut -> signedOut()
        is AuthService.State.SignedIn -> key(state.uid) { signedIn(state) }
    }
}

@Composable
private fun MainTabs(auth: AuthService, store: GymStore) {
    val data by store.data.collectAsStateWithLifecycle()
    val nav = rememberNavController()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    // Health Connect no concede el permiso con una llamada: hay que lanzar el contrato del sistema
    // desde la activity y recibir el resultado acá.
    val health = remember(context) { HealthConnectService(context.applicationContext) }
    val healthState by health.state.collectAsStateWithLifecycle()
    val pedirSalud =
        rememberLauncherForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { concedidos ->
            health.onPermissionResult(concedidos)
        }
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { scope.launch { health.refreshIfConnected() } }
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
                        PullToRefreshBox(data.isLoading, { store.load() }) {
                            HomeScreen(
                                data = data,
                                health = healthState,
                                healthAvailable = health.isAvailable,
                                onConnectHealth = { pedirSalud.launch(health.permissions) },
                                onOpenHistory = { nav.navigate(AppTab.HISTORY.name) },
                                onStart = ::start,
                            )
                        }
                    }
                }

                navigation(startDestination = "routines", route = AppTab.ROUTINES.name) {
                    composable("routines") {
                        PullToRefreshBox(data.isLoading, { store.load() }) {
                            RoutinesScreen(
                                data = data,
                                onCreate = { nav.navigate("composer") },
                                onEdit = {
                                    nav.navigate("composer/${Uri.encode(it.id)}/${it.isAssigned}")
                                },
                                onOpen = {
                                    nav.navigate("routine/${Uri.encode(it.id)}/${it.isAssigned}")
                                },
                                onStart = ::start,
                                onDelete = { scope.launch { store.deleteRoutine(it.id) } },
                                onDuplicate = { scope.launch { store.duplicateRoutine(it.id) } },
                                onToggleHome = {
                                    scope.launch {
                                        store.setRoutineShowOnHome(it.id, !it.showOnHome)
                                    }
                                },
                            )
                        }
                    }
                    composable("composer") {
                        RoutineComposerScreen(
                            data = data,
                            onVolver = { nav.popBackStack() },
                            onGuardar = { nombre, nota, ejercicios ->
                                store.createRoutine(nombre, nota, ejercicios)
                            },
                            onCrearEjercicio = { draft -> store.createCustomExercise(draft) },
                        )
                    }
                    composable("composer/{id}/{assigned}") { editando ->
                        val original =
                            data.routines.firstOrNull {
                                it.id == editando.arguments?.getString("id") &&
                                    it.isAssigned ==
                                        (editando.arguments?.getString("assigned") == "true")
                            }
                        if (original != null && !original.isAssigned) {
                            RoutineComposerScreen(
                                data = data,
                                routine = original,
                                onVolver = { nav.popBackStack() },
                                onGuardar = { nombre, nota, ejercicios ->
                                    store.updateRoutine(original.id, nombre, nota, ejercicios)
                                },
                                onCrearEjercicio = { draft -> store.createCustomExercise(draft) },
                            )
                        } else {
                            Pantalla(
                                titulo = "Editar rutina",
                                volver = true,
                                onVolver = { nav.popBackStack() },
                            ) {
                                NoEncontrado(data)
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
                        val week = data.currentWeek
                        if (routine != null) {
                            RoutineDetailScreen(
                                routine = routine,
                                data = data,
                                onStart = { start(routine) },
                                onVolver = { nav.popBackStack() },
                                onEdit = {
                                    nav.navigate(
                                        "composer/${Uri.encode(routine.id)}/${routine.isAssigned}"
                                    )
                                },
                                onToggleWeek = {
                                    scope.launch {
                                        store.setRoutineWeek(
                                            routine.id,
                                            if (routine.weekKey == week.clave) null else week.clave,
                                        )
                                    }
                                },
                            )
                        } else {
                            Pantalla(
                                titulo = "Rutina",
                                volver = true,
                                onVolver = { nav.popBackStack() },
                            ) {
                                NoEncontrado(data)
                            }
                        }
                    }
                }

                accountDestinations(
                    nav,
                    data,
                    { store.load() },
                    store::updateProfile,
                    auth::signOut,
                )

                composable("workout/{id}/{assigned}") { detail ->
                    val id = detail.arguments?.getString("id")
                    val routine =
                        data.routines.firstOrNull {
                            it.id == id &&
                                it.isAssigned == (detail.arguments?.getString("assigned") == "true")
                        }
                            // La rutina pudo borrarse mientras el entrenamiento estaba en standby.
                            // Las
                            // series ya cargadas están en el borrador, así que se sigue con ésas.
                            ?: store.activeWorkout?.routine?.takeIf { it.id == id }
                    if (data.hasLoaded && (id == "free" || routine != null))
                        WorkoutScreen(routine, data, store) { nav.popBackStack() }
                    else
                        Pantalla(
                            titulo = "Entrenamiento",
                            volver = true,
                            onVolver = { nav.popBackStack() },
                        ) {
                            NoEncontrado(data)
                        }
                }
            }
        }

        if (!workout)
            Column(
                Modifier.align(Alignment.BottomCenter).padding(bottom = bottomNavGap),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // Volver de un entrenamiento no lo tira: la barra de acá ofrece seguir con el
                // tiempo y las series que faltan.
                store.activeWorkout?.let { pendiente ->
                    MiniBarraEntrenamiento(
                        draft = pendiente,
                        onSeguir = { start(pendiente.routine) },
                        onDescartar = { store.activeWorkout = null },
                    )
                }
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
                )
            }
    }
}

/**
 * El entrenamiento a medias, arriba de la barra de pestañas. Muestra el reloj y cuántas series
 * faltan, que es lo que uno necesita decidir si sigue o si lo deja para mañana.
 */
@Composable
private fun MiniBarraEntrenamiento(
    draft: com.siezagym.app.Features.Workout.WorkoutDraft,
    onSeguir: () -> Unit,
    onDescartar: () -> Unit,
) {
    val esquina = RoundedCornerShape(tema.esquina(Theme.radius))
    Row(
        Modifier.fillMaxWidth()
            .clip(esquina)
            .background(tema.vidrio(3))
            .border(BorderStroke(1.dp, tema.solido.copy(alpha = 0.35f)), esquina)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(tema.solido))
        Column(Modifier.weight(1f)) {
            Text(
                draft.routine?.name ?: "Entrenamiento en curso",
                color = tema.texto,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
            Text(
                "${MiniReloj(draft.startedAt)} • ${draft.completedSets}/${draft.totalSets} series",
                color = tema.texto2,
                fontSize = 11.sp,
            )
        }
        SolidButton("Reanudar", Modifier.heightIn(min = 32.dp), expands = false, onClick = onSeguir)
        IconButton(onClick = onDescartar, modifier = Modifier.size(34.dp)) {
            Icon(
                Icons.Filled.Close,
                "Descartar el entrenamiento",
                tint = tema.texto2,
                modifier = Modifier.size(11.dp),
            )
        }
    }
}

@Composable
private fun MiniReloj(startedAt: java.time.Instant): String {
    var now by remember { mutableStateOf(java.time.Instant.now()) }
    LaunchedEffect(startedAt) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            now = java.time.Instant.now()
        }
    }
    val segundos = (now.epochSecond - startedAt.epochSecond).coerceAtLeast(0)
    return String.format(java.util.Locale.ROOT, "%02d:%02d", segundos / 60, segundos % 60)
}

/** El error de carga: qué pasó y cómo reintentar. */
@Composable
private fun BannerError(error: String, onRetry: () -> Unit) {
    PanelLista {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                error,
                Modifier.weight(1f),
                color = tema.texto2,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            )
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
