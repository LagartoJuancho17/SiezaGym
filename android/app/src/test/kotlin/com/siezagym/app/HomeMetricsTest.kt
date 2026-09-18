package com.siezagym.app

import com.siezagym.app.Domain.Epley
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.LoggedSet
import com.siezagym.app.Models.MovementPattern
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeMetricsTest {
    private val now: ZonedDateTime = ZonedDateTime.of(2026, 9, 6, 12, 0, 0, 0, TrainingCalendar.zone)

    private fun set(weight: Number, reps: Int, failed: Boolean = false, number: Int = 1) =
        LoggedSet(setNumber = number, weight = weight.toDouble(), reps = reps, rir = null, failed = failed)

    private fun session(
        vararg exercises: LoggedExercise,
        id: String = "s1",
        finishedAt: ZonedDateTime? = now,
        volume: Double = 0.0,
        sets: Int = 0,
        duration: Int = 0,
    ): WorkoutSession = WorkoutSession(
        id = id,
        userID = "u1",
        routineName = "Test",
        routineID = null,
        startedAt = null,
        finishedAt = finishedAt,
        durationSeconds = duration,
        exercises = exercises.toList(),
        totalVolumeKg = volume,
        totalSetsCompleted = sets,
    )

    private fun exercise(
        id: String,
        muscles: Map<MuscleGroup, Double> = emptyMap(),
        pattern: MovementPattern? = null,
    ): Exercise = Exercise(
        id = id,
        nameEs = id,
        nameEn = id,
        equipment = null,
        pattern = pattern,
        muscleWeights = muscles,
        registrationType = RegistrationType.PESO_REPS,
        unilateral = false,
        descriptionEs = "",
        mediaUrl = null,
        source = ExerciseSource.CATALOG,
    )

    // MARK: - Epley

    @Test
    fun enUnaSolaRepeticionElRmEsElPesoLevantado() {
        assertEquals(100.0, Epley.estimatedOneRepMax(100.0, 1), 0.0)
    }

    @Test
    fun aplicaPesoTimes1MasRepsSobre30() {
        assertEquals(133.333, Epley.estimatedOneRepMax(100.0, 10), 0.01)
    }

    @Test
    fun sinPesoOSinRepsNoHayEstimacion() {
        assertEquals(0.0, Epley.estimatedOneRepMax(0.0, 10), 0.0)
        assertEquals(0.0, Epley.estimatedOneRepMax(100.0, 0), 0.0)
        assertEquals(0.0, Epley.estimatedOneRepMax(-5.0, 5), 0.0)
    }

    @Test
    fun laMejorSerieIgnoraLasFalladas() {
        val best = Epley.bestSet(listOf(set(80, 5), set(200, 5, failed = true), set(100, 5)))
        assertEquals(100.0, best?.weight ?: 0.0, 0.0)
    }

    @Test
    fun elMaximoRealNoEstimaNada() {
        assertEquals(120.0, Epley.maxWeight(listOf(set(80, 5), set(120, 1), set(300, 1, failed = true))), 0.0)
    }

    // MARK: - Volumen

    @Test
    fun unaSerieFalladaNoSumaVolumen() {
        assertEquals(0.0, set(100, 10, failed = true).volumeKg, 0.0)
        assertEquals(1000.0, set(100, 10).volumeKg, 0.0)
    }

    @Test
    fun reparteElVolumenSegunMuscleWeights() {
        val catalog = mapOf("press" to exercise("press", muscles = mapOf(MuscleGroup.PECHO to 0.6, MuscleGroup.TRICEPS to 0.4)))
        val result = HomeMetrics.volumeByMuscleGroup(
            listOf(session(LoggedExercise("press", listOf(set(100, 10))))),
            catalog,
        )

        assertEquals(1000, result.totalKg)
        assertEquals(MuscleGroup.PECHO, result.rows.first().muscle)
        assertEquals(600, result.rows.first().kg)
        assertEquals(0.6, result.rows.first().pct, 0.001)
    }

    @Test
    fun unEjercicioQueNoEstaEnElCatalogoNoRompeLaCuenta() {
        val result = HomeMetrics.volumeByMuscleGroup(
            listOf(session(LoggedExercise("fantasma", listOf(set(100, 10))))),
            emptyMap(),
        )
        assertEquals(0, result.totalKg)
    }

    @Test
    fun sinSesionesDevuelveCero() {
        val result = HomeMetrics.volumeByMuscleGroup(emptyList(), emptyMap())
        assertTrue(result.rows.isEmpty())
        assertFalse(result.hasData)
    }

    // MARK: - Empuje / tracción

    private val catalogConPatrones: Map<String, Exercise> = mapOf(
        "press" to exercise("press", pattern = MovementPattern.EMPUJE_HORIZONTAL),
        "remo" to exercise("remo", pattern = MovementPattern.TRACCION_HORIZONTAL),
        "curl" to exercise("curl", pattern = MovementPattern.AISLAMIENTO),
    )

    @Test
    fun mitadYMitadDaCincuentaYQuedaEquilibrado() {
        val sessions = listOf(session(
            LoggedExercise("press", listOf(set(100, 10))),
            LoggedExercise("remo", listOf(set(100, 10))),
        ))
        val result = HomeMetrics.pushPullBalance(sessions, catalogConPatrones)
        assertEquals(50, result.pct)
        assertEquals("Equilibrado", result.label)
    }

    @Test
    fun soloEmpujeAvisaQueFaltaEspalda() {
        val sessions = listOf(session(LoggedExercise("press", listOf(set(100, 10)))))
        val result = HomeMetrics.pushPullBalance(sessions, catalogConPatrones)
        assertEquals(100, result.pct)
        assertEquals("Falta espalda", result.label)
    }

    @Test
    fun soloTraccionAvisaQueFaltaPecho() {
        val sessions = listOf(session(LoggedExercise("remo", listOf(set(100, 10)))))
        assertEquals("Falta pecho", HomeMetrics.pushPullBalance(sessions, catalogConPatrones).label)
    }

    @Test
    fun elAislamientoNoEntraEnLaCuenta() {
        val sessions = listOf(session(LoggedExercise("curl", listOf(set(50, 10)))))
        val result = HomeMetrics.pushPullBalance(sessions, catalogConPatrones)
        assertFalse(result.hasData)
        assertEquals(50, result.pct)
    }

    // MARK: - Series completadas

    @Test
    fun cuentaLasHechasSobreElTotal() {
        val sessions = listOf(session(
            LoggedExercise("a", listOf(set(50, 10), set(50, 10), set(50, 10, failed = true))),
        ))
        val result = HomeMetrics.setCompletionRate(sessions)
        assertEquals(2, result.completed)
        assertEquals(3, result.total)
        assertEquals(67, result.pct)
        assertEquals("Regular", result.label)
    }

    @Test
    fun todoCompletoEsExcelente() {
        val sessions = listOf(session(LoggedExercise("a", listOf(set(50, 10)))))
        assertEquals("Excelente", HomeMetrics.setCompletionRate(sessions).label)
    }

    @Test
    fun sinSeriesNoInventaUnPorcentaje() {
        val result = HomeMetrics.setCompletionRate(emptyList())
        assertEquals(0, result.pct)
        assertFalse(result.hasData)
    }

    // MARK: - Intensidad

    @Test
    fun elMejorRmSeTomaDeTodoElHistorial() {
        val sessions = listOf(
            session(LoggedExercise("press", listOf(set(80, 5))), id = "nueva"),
            session(LoggedExercise("press", listOf(set(100, 5))), id = "vieja"),
        )
        val best = HomeMetrics.bestOneRepMaxByExercise(sessions)
        assertEquals(116.667, best["press"] ?: 0.0, 0.01)
    }

    @Test
    fun laIntensidadRelativaMiraSoloLaUltimaSesion() {
        val sessions = listOf(
            session(LoggedExercise("press", listOf(set(100, 1))), id = "nueva"),
            session(LoggedExercise("press", listOf(set(100, 1))), id = "vieja"),
        )
        val result = HomeMetrics.relativeIntensity(sessions)
        assertEquals(100, result.pct)
        assertEquals("Muy alta", result.label)
    }

    @Test
    fun sinSesionesNoHayIntensidad() {
        assertFalse(HomeMetrics.relativeIntensity(emptyList()).hasData)
    }

    @Test
    fun lasZonasSeCalculanContraElMejorRmDelMismoEjercicio() {
        val sessions = listOf(session(
            LoggedExercise("press", listOf(set(100, 1), set(50, 1))),
        ))
        val result = HomeMetrics.intensityZones(sessions)
        assertEquals(2, result.total)
        assertEquals(1, result.count(HomeMetrics.Zone.PEAK))
        assertEquals(1, result.count(HomeMetrics.Zone.LIGHT))
    }

    @Test
    fun laZonaSeEligePorPorcentajeDelMaximo() {
        assertEquals(HomeMetrics.Zone.PEAK, HomeMetrics.Zone.forPercentOfMax(95.0))
        assertEquals(HomeMetrics.Zone.HIGH, HomeMetrics.Zone.forPercentOfMax(85.0))
        assertEquals(HomeMetrics.Zone.MED, HomeMetrics.Zone.forPercentOfMax(70.0))
        assertEquals(HomeMetrics.Zone.LIGHT, HomeMetrics.Zone.forPercentOfMax(40.0))
    }

    // MARK: - Duración y calorías

    @Test
    fun unaDuracionFisicamenteImposibleSeEstimaPorSeries() {
        val rota = session(sets = 6, duration = 25)
        assertEquals(6 * HomeMetrics.secondsPerSet, HomeMetrics.sessionSeconds(rota))
    }

    @Test
    fun unaDuracionCreibleSeRespetaTalCual() {
        assertEquals(3600, HomeMetrics.sessionSeconds(session(sets = 6, duration = 3600)))
    }

    @Test
    fun lasCaloriasSalenDeMetPorPesoPorHoras() {
        val unaHora = session(sets = 6, duration = 3600)
        assertEquals(400, HomeMetrics.calories(unaHora, bodyWeightKg = 80.0))
    }

    @Test
    fun sinPesoEnElPerfilUsa75KgYLoDeclara() {
        val result = HomeMetrics.weeklyCalories(
            listOf(session(sets = 6, duration = 3600)),
            bodyWeightKg = null,
            goal = 2000.0,
        )
        assertTrue(result.usesDefaultWeight)
        assertEquals(375, result.kcal) // 5 × 75 × 1
    }

    @Test
    fun elPorcentajeDeLaMetaNoPasaDe100() {
        val result = HomeMetrics.weeklyCalories(
            listOf(session(sets = 100, duration = 36000)),
            bodyWeightKg = 80.0,
            goal = 100.0,
        )
        assertEquals(100, result.pct)
        assertEquals("Objetivo cumplido", result.label)
    }

    // MARK: - Ventanas de tiempo

    @Test
    fun soloEntranLasSesionesDentroDeLosUltimosDias() {
        val sessions = listOf(
            session(id = "hoy", finishedAt = now),
            session(id = "hace3", finishedAt = now.minusDays(3)),
            session(id = "hace30", finishedAt = now.minusDays(30)),
        )
        val result = HomeMetrics.sessionsInLastDays(sessions, days = 7, now = now)
        assertEquals(listOf("hoy", "hace3"), result.map { it.id })
    }

    @Test
    fun unaSesionSinFechaDeFinNoEntraEnLaVentana() {
        val sessions = listOf(session(id = "sinfecha", finishedAt = null))
        assertTrue(HomeMetrics.sessionsInLastDays(sessions, days = 7, now = now).isEmpty())
    }

    @Test
    fun laTendenciaVaDeLaMasViejaALaMasNueva() {
        val sessions = listOf(
            session(id = "nueva", volume = 300.0),
            session(id = "media", volume = 200.0),
            session(id = "vieja", volume = 100.0),
        )
        val trend = HomeMetrics.volumePerSession(sessions)
        assertEquals(listOf(100, 200, 300), trend.points)
        assertEquals(200, trend.averageKg)
    }
}