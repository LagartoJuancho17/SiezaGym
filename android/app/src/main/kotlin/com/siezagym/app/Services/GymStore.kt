package com.siezagym.app.Services

import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Models.WorkoutSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZonedDateTime

/** Estado compartido de la app: una sola carga de Firestore alimenta las cinco
 *  pantallas. Si cada tab consultara por su cuenta pagaríamos las mismas
 *  lecturas cinco veces y podrían mostrar números distintos entre sí. */
class GymStore(val uid: String) {
    private val repository = GymRepository()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _profile = MutableStateFlow<UserProfile?>(null)
    private val _routines = MutableStateFlow<List<Routine>>(emptyList())
    private val _sessions = MutableStateFlow<List<WorkoutSession>>(emptyList())
    private val _catalog = MutableStateFlow<Map<String, Exercise>>(emptyMap())
    private val _isLoading = MutableStateFlow(false)
    private val _loadError = MutableStateFlow<String?>(null)
    /** Null hasta la primera carga: sirve para no mostrar "no hay nada" mientras carga. */
    private val _lastLoadedAt = MutableStateFlow<ZonedDateTime?>(null)

    val profile: StateFlow<UserProfile?> = _profile.asStateFlow()
    val routines: StateFlow<List<Routine>> = _routines.asStateFlow()
    val sessions: StateFlow<List<WorkoutSession>> = _sessions.asStateFlow()
    val catalog: StateFlow<Map<String, Exercise>> = _catalog.asStateFlow()
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    val loadError: StateFlow<String?> = _loadError.asStateFlow()
    val lastLoadedAt: StateFlow<ZonedDateTime?> = _lastLoadedAt.asStateFlow()

    val hasLoaded: Boolean
        get() = _lastLoadedAt.value != null

    fun load() {
        scope.launch { refresh() }
    }

    private suspend fun refresh() {
        if (_isLoading.value) return
        _isLoading.value = true
        try {
            // Las cuatro consultas son independientes: van en paralelo.
            coroutineScope {
                val catalog = async { repository.exercises(uid) }
                val profile = async { repository.profile(uid) }
                val routines = async { repository.routines(uid) }
                val sessions = async { repository.sessions(uid) }

                _catalog.value = catalog.await()
                _profile.value = profile.await()
                _routines.value = routines.await()
                _sessions.value = sessions.await()
            }
            _loadError.value = null
            _lastLoadedAt.value = ZonedDateTime.now(TrainingCalendar.zone)
        } catch (e: Exception) {
            _loadError.value = "No pudimos traer tus datos. Volvé a intentar."
        } finally {
            _isLoading.value = false
        }
    }

    fun exercise(id: String): Exercise? = _catalog.value[id]

    fun name(of exerciseID: String): String = _catalog.value[exerciseID]?.nameEs ?: exerciseID

    fun rutina(id: String): Routine? = _routines.value.firstOrNull { it.id == id }

    // MARK: - Derivados de la Home

    val trainedDayKeys: Set<String>
        get() = HomeMetrics.trainedDayKeys(_sessions.value)

    val streak: Int
        get() = TrainingCalendar.streak(trainedDayKeys)

    /** La rutina que la Home propone: la última usada que se muestre en Home. */
    val featuredRoutine: Routine?
        get() = _routines.value.firstOrNull { it.showOnHome } ?: _routines.value.firstOrNull()

    val weekSessions: List<WorkoutSession>
        get() = HomeMetrics.sessionsInLastDays(_sessions.value, days = 7)

    val weeklyVolumeKg: Double
        get() = weekSessions.sumOf { it.totalVolumeKg }

    val muscleVolume: HomeMetrics.MuscleVolume
        get() = HomeMetrics.volumeByMuscleGroup(_sessions.value, _catalog.value)

    val pushPull: HomeMetrics.PushPull
        get() = HomeMetrics.pushPullBalance(_sessions.value, _catalog.value)

    val completion: HomeMetrics.Completion
        get() = HomeMetrics.setCompletionRate(_sessions.value)

    val weekdayVolume: List<HomeMetrics.WeekdayVolume>
        get() = HomeMetrics.volumeByWeekday(_sessions.value)

    val intensity: HomeMetrics.Intensity
        get() = HomeMetrics.relativeIntensity(_sessions.value)

    val volumeTrend: HomeMetrics.VolumeTrend
        get() = HomeMetrics.volumePerSession(_sessions.value)

    val zones: HomeMetrics.Zones
        get() = HomeMetrics.intensityZones(_sessions.value)

    val calories: HomeMetrics.CalorieGoal
        get() = HomeMetrics.weeklyCalories(
            weekSessions,
            bodyWeightKg = _profile.value?.bodyWeightKg,
            goal = _profile.value?.weeklyCalorieGoalKcal,
        )

    // MARK: - Escrituras

    suspend fun saveSession(routine: Routine?, startedAt: Instant, exercises: List<LoggedExercise>) {
        repository.saveSession(uid = uid, routine = routine, startedAt = startedAt, exercises = exercises)
        refresh()
    }

    suspend fun createRoutine(name: String, note: String, exercises: List<RoutineDraftExercise>) {
        repository.createRoutine(uid = uid, name = name, note = note, exercises = exercises)
        refresh()
    }

    suspend fun updateProfile(fields: Map<String, Any?>) {
        try {
            repository.updateProfile(uid, fields)
            _profile.value = repository.profile(uid)
        } catch (e: Exception) {
            _loadError.value = "No se pudo guardar el perfil."
        }
    }
}