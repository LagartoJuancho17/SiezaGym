package com.siezagym.app

import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Domain.WidgetSnapshotBuilder
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.LoggedSet
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.RoutineExercise
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** 21 de septiembre de 2026, un lunes, 15:00 en Buenos Aires. */
private val lunes = ZonedDateTime.of(2026, 9, 21, 15, 0, 0, 0, TrainingCalendar.zone)

private fun dia(offset: Int, desde: ZonedDateTime = lunes): ZonedDateTime = desde.plusDays(offset.toLong())

private fun session(
    id: String = "s1",
    finishedAt: ZonedDateTime?,
    volume: Double = 0.0,
    sets: Int = 0,
    exercises: List<LoggedExercise> = emptyList(),
) =
    WorkoutSession(
        id = id,
        userID = "u1",
        routineName = "Test",
        routineID = null,
        startedAt = null,
        finishedAt = finishedAt,
        durationSeconds = 0,
        exercises = exercises,
        totalVolumeKg = volume,
        totalSetsCompleted = sets,
    )

private fun loggedSet(weight: Double, reps: Int, failed: Boolean = false) =
    LoggedSet(setNumber = 1, weight = weight, reps = reps, rir = null, failed = failed)

private fun catalogExercise(id: String, muscles: Map<MuscleGroup, Double> = emptyMap()) =
    Exercise(
        id = id,
        nameEs = id,
        nameEn = id,
        equipment = null,
        pattern = null,
        muscleWeights = muscles,
        registrationType = RegistrationType.PESO_REPS,
        unilateral = false,
        descriptionEs = "",
        mediaUrl = null,
        source = ExerciseSource.CATALOG,
    )

private fun routine(ejercicios: List<Pair<String, Int>>) =
    Routine(
        id = "r1",
        ownerID = "u1",
        name = "Empuje A",
        note = "",
        exercises =
            ejercicios.mapIndexed { orden, par ->
                RoutineExercise(
                    exerciseID = par.first,
                    source = RoutineExercise.Source.CATALOG,
                    order = orden,
                    targetSets = par.second,
                    targetReps = 10,
                    targetRIR = null,
                    targetWeight = null,
                    techniqueNote = "",
                    sets = null,
                )
            },
        showOnHome = true,
        lastUsedAt = null,
        createdAt = null,
        updatedAt = null,
        isAssigned = false,
    )

/**
 * El snapshot que deja la app para el widget. Son las mismas cuentas que la portada, así que el
 * widget y la Home no pueden decir números distintos. Puerto de `WidgetTests.swift`.
 */
class WidgetSnapshotTest {
    @Test
    fun sinDatosElWidgetQuedaVacioYNoEnCeroInventado() {
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = emptyList(),
                routine = null,
                catalog = emptyMap(),
                now = lunes,
            )

        assertTrue(snapshot.isEmpty)
        assertEquals(0, snapshot.streak)
        assertEquals(List(7) { false }, snapshot.week)
        assertNull(snapshot.routineName)
    }

    @Test
    fun laSemanaMarcaElDiaEntrenadoEnSuCasilla() {
        val sesiones =
            listOf(
                session(id = "a", finishedAt = lunes),
                session(id = "b", finishedAt = dia(2)),
            )
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = sesiones,
                routine = null,
                catalog = emptyMap(),
                now = dia(2),
            )

        assertEquals(listOf(true, false, true, false, false, false, false), snapshot.week)
        assertEquals(2, snapshot.trainedThisWeek)
    }

    /**
     * El miércoles la semana va de lunes a domingo, no de hoy a hoy+6: si el índice se calculara
     * desde hoy, el lunes entrenado caería en la casilla del miércoles.
     */
    @Test
    fun laTiraArrancaElLunesAunqueHoySeaJueves() {
        val jueves = dia(3)
        val banderas =
            WidgetSnapshotBuilder.weekFlags(
                trainedDayKeys = setOf(TrainingCalendar.dayKey(lunes)),
                now = jueves,
            )

        assertEquals(listOf(true, false, false, false, false, false, false), banderas)
    }

    @Test
    fun elVolumenDeLaSemanaSumaSoloLosUltimosSieteDias() {
        val sesiones =
            listOf(
                session(id = "hoy", finishedAt = lunes, volume = 1200.0),
                session(id = "vieja", finishedAt = dia(-20), volume = 9999.0),
            )
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = sesiones,
                routine = null,
                catalog = emptyMap(),
                now = lunes,
            )

        assertEquals(1200.0, snapshot.weeklyVolumeKg, 0.001)
        assertEquals(1, snapshot.weeklySessions)
    }

    @Test
    fun laRutinaViajaResueltaPorqueElWidgetNoTieneElCatalogo() {
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "brasa",
                sessions = emptyList(),
                routine = routine(listOf("press" to 4, "remo" to 3)),
                catalog = emptyMap(),
                now = lunes,
            )

        assertEquals("Empuje A", snapshot.routineName)
        assertEquals(2, snapshot.routineExercises)
        assertEquals(7, snapshot.routineSets)
        assertTrue(snapshot.routineMinutes > 0)
        assertEquals("brasa", snapshot.themeID)
    }

    @Test
    fun lasCaloriasDeLaSemanaUsanElPesoYLaMetaDelPerfil() {
        val perfil =
            UserProfile(
                id = "u1",
                email = null,
                displayName = null,
                photoUrl = null,
                isCoach = false,
                sex = null,
                bodyWeightKg = 80.0,
                heightCm = null,
                weeklyCalorieGoalKcal = 1500.0,
                experienceLevel = null,
            )
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = emptyList(),
                routine = null,
                catalog = emptyMap(),
                profile = perfil,
                now = lunes,
            )

        assertEquals(1500, snapshot.calorias.meta)
        assertEquals(false, snapshot.calorias.pesoPorDefecto)
    }

    @Test
    fun sinPerfilLasCaloriasUsanElPesoYLaMetaPorDefecto() {
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = emptyList(),
                routine = null,
                catalog = emptyMap(),
                now = lunes,
            )

        assertEquals(HomeMetrics.defaultWeeklyCalorieGoal.toInt(), snapshot.calorias.meta)
        assertTrue(snapshot.calorias.pesoPorDefecto)
    }

    @Test
    fun lasSeriesYMusculosSalenDeLasSesionesReales() {
        val sesiones =
            listOf(
                session(
                    finishedAt = lunes,
                    exercises =
                        listOf(
                            LoggedExercise(
                                exerciseID = "press",
                                sets = listOf(loggedSet(100.0, 10), loggedSet(100.0, 10, failed = true)),
                            )
                        ),
                )
            )
        val catalogo = mapOf("press" to catalogExercise("press", mapOf(MuscleGroup.PECHO to 1.0)))
        val snapshot =
            WidgetSnapshotBuilder.build(
                themeID = "noche",
                sessions = sesiones,
                routine = null,
                catalog = catalogo,
                now = lunes,
            )

        assertEquals(1, snapshot.series.completadas)
        assertEquals(2, snapshot.series.totales)
        assertEquals("Pecho", snapshot.musculos.filas.first().musculo)
        assertTrue(snapshot.musculos.hasData)
    }

    @Test
    fun unTemaDesconocidoCaeEnElDePorDefectoYNoRompeElWidget() {
        assertEquals("sieza", Theme.conId("inventado").id)
    }
}
