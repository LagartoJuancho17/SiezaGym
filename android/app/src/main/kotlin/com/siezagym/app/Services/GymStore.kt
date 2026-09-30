package com.siezagym.app.Services

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.siezagym.app.DesignSystem.ThemeStore
import com.siezagym.app.Domain.*
import com.siezagym.app.Features.Workout.WorkoutDraft
import com.siezagym.app.Models.*
import java.time.Instant
import java.time.ZonedDateTime
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** One immutable snapshot, shared by all tabs and published only after a complete load. */
data class GymData(
    val profile: UserProfile? = null,
    val routines: List<Routine> = emptyList(),
    val sessions: List<WorkoutSession> = emptyList(),
    val catalog: Map<String, Exercise> = emptyMap(),
    val isLoading: Boolean = false,
    val hasLoaded: Boolean = false,
    val loadError: String? = null,
) {
    fun name(id: String) = catalog[id]?.nameEs ?: id

    val trainedDayKeys
        get() = HomeMetrics.trainedDayKeys(sessions)

    val streak
        get() = TrainingCalendar.streak(trainedDayKeys)

    val featuredRoutine
        get() = routines.firstOrNull { it.showOnHome } ?: routines.firstOrNull()

    val muscleVolume
        get() = HomeMetrics.volumeByMuscleGroup(sessions, catalog)

    val pushPull
        get() = HomeMetrics.pushPullBalance(sessions, catalog)

    val completion
        get() = HomeMetrics.setCompletionRate(sessions)

    val weekdayVolume
        get() = HomeMetrics.volumeByWeekday(sessions)

    val intensity
        get() = HomeMetrics.relativeIntensity(sessions)

    val volumeTrend
        get() = HomeMetrics.volumePerSession(sessions)

    val zones
        get() = HomeMetrics.intensityZones(sessions)

    /** Volumen de la semana en curso, el número que abre la grilla de progreso. */
    val weeklyVolumeKg
        get() = sessions.sumOf { it.totalVolumeKg }

    /** La semana en curso, en el calendario de Argentina, no en el del teléfono. */
    val currentWeek
        get() = TrainingCalendar.semana(ZonedDateTime.now(TrainingCalendar.zone))

    /** Las rutinas que el usuario asignó a esta semana, como pide la portada. */
    val routinesThisWeek
        get() = TrainingCalendar.delaSemana(routines, currentWeek.clave) { it.weekKey }

    val calories
        get() =
            HomeMetrics.weeklyCalories(
                HomeMetrics.sessionsInLastDays(sessions),
                profile?.bodyWeightKg,
                profile?.weeklyCalorieGoalKcal,
            )
}

class GymStore(val uid: String, private val context: Context? = null) : ViewModel() {
    private val repository = GymRepository()
    private val mutableData = MutableStateFlow(GymData())
    val data = mutableData.asStateFlow()

    /**
     * El entrenamiento que quedó a medias. Vive acá y no en la pantalla para que volver atrás no
     * tire lo hecho: la barra de la pantalla principal ofrece "seguir" con el tiempo y las series
     * que faltan. Es lo mismo que el `activeWorkout` de iOS.
     */
    var activeWorkout by mutableStateOf<WorkoutDraft?>(null)

    init {
        load()
    }

    fun load() {
        viewModelScope.launch { refresh() }
    }

    private suspend fun refresh() {
        if (mutableData.value.isLoading) return
        mutableData.update { it.copy(isLoading = true, loadError = null) }
        try {
            coroutineScope {
                val catalog = async { repository.exercises() }
                val profile = async { repository.profile(uid) }
                val routines = async { repository.routines(uid) }
                val sessions = async { repository.sessions(uid) }
                mutableData.value =
                    GymData(
                        profile.await(),
                        routines.await(),
                        sessions.await(),
                        catalog.await(),
                        hasLoaded = true,
                    )
            }
            publicarWidget()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            mutableData.update {
                it.copy(loadError = "No pudimos traer tus datos. Deslizá para reintentar.")
            }
        } finally {
            mutableData.update { it.copy(isLoading = false) }
        }
    }

    suspend fun saveSession(
        routine: Routine?,
        startedAt: Instant,
        exercises: List<LoggedExercise>,
    ) {
        repository.saveSession(uid, routine, startedAt, exercises)
        refresh()
    }

    suspend fun updateProfile(fields: Map<String, Any?>) {
        repository.updateProfile(uid, fields)
        val profile = repository.profile(uid)
        mutableData.update { it.copy(profile = profile) }
        // El peso y la meta de calorías cambian los números del widget.
        publicarWidget()
    }

    /**
     * Deja el resumen del widget al día. El widget no puede leer Firestore: la app le pasa los
     * mismos números que muestra la portada, ya resueltos.
     */
    private fun publicarWidget() {
        val app = context?.applicationContext ?: return
        val datos = mutableData.value
        WidgetBridge.publicar(
            app,
            WidgetSnapshotBuilder.build(
                themeID = ThemeStore.temaGuardado(app),
                sessions = datos.sessions,
                routine = datos.featuredRoutine,
                catalog = datos.catalog,
                profile = datos.profile,
            ),
        )
    }

    // MARK: - Rutinas
    //
    // Cada escritura devuelve apenas el store está al día: las pantallas no
    // necesitan saber el id nuevo, sólo recargar y cerrar.

    suspend fun createRoutine(
        name: String,
        note: String,
        exercises: List<RoutineDraftExercise>,
    ): String {
        val id = repository.createRoutine(uid, name, note, exercises)
        refresh()
        return id
    }

    suspend fun updateRoutine(
        routineId: String,
        name: String,
        note: String,
        exercises: List<RoutineDraftExercise>,
    ) {
        repository.updateRoutine(uid, routineId, name, note, exercises)
        refresh()
    }

    suspend fun deleteRoutine(routineId: String) {
        repository.deleteRoutine(uid, routineId)
        refresh()
    }

    suspend fun duplicateRoutine(routineId: String) {
        repository.duplicateRoutine(uid, routineId)
        refresh()
    }

    suspend fun setRoutineShowOnHome(routineId: String, showOnHome: Boolean) {
        repository.setRoutineShowOnHome(uid, routineId, showOnHome)
        refresh()
    }

    suspend fun setRoutineWeek(routineId: String, weekKey: String?) {
        repository.setRoutineWeek(uid, routineId, weekKey)
        refresh()
    }

    // MARK: - Ejercicios propios

    suspend fun createCustomExercise(draft: CustomExerciseDraft): String {
        val id = repository.createCustomExercise(uid, draft)
        // Los ejercicios propios entran al mismo mapa que el catálogo, con el
        // origen en custom: el selector y el reparto por músculo los leen los dos.
        val propios = repository.customExercises(uid)
        mutableData.update { it.copy(catalog = it.catalog + propios.associateBy(Exercise::id)) }
        return id
    }

    suspend fun deleteCustomExercise(exerciseId: String) {
        repository.deleteCustomExercise(uid, exerciseId)
        mutableData.update { it.copy(catalog = it.catalog - exerciseId) }
    }
}
