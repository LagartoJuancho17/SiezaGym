package com.siezagym.app

import com.siezagym.app.Domain.Epley
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.LoggedSet
import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Las cuentas de progreso, las mismas que `lib/progress/` de la web. Se prueban sin pantalla: una
 * barra que mide mal se ve creíble en una captura y equivocada en la semana 11.
 */
class ProgressMetricsTest {
    private val bogota = TrainingCalendar.zone

    private fun sesion(
        id: String,
        fin: ZonedDateTime?,
        volumen: Double,
        ejercicios: List<LoggedExercise> = emptyList(),
    ) =
        WorkoutSession(
            id = id,
            userID = "u1",
            routineName = "Full body",
            routineID = "r1",
            startedAt = fin?.minusMinutes(60),
            finishedAt = fin,
            durationSeconds = 3600,
            exercises = ejercicios,
            totalVolumeKg = volumen,
            totalSetsCompleted = ejercicios.sumOf { it.sets.size },
        )

    private fun series(vararg pares: Pair<Double, Int>, failed: Boolean = false) =
        pares.mapIndexed { i, (peso, reps) ->
            LoggedSet(setNumber = i + 1, weight = peso, reps = reps, rir = null, failed = failed)
        }

    private fun lunesDe(ahora: ZonedDateTime) = ahora.minusDays(TrainingCalendar.weekdayIndex(ahora).toLong())

    // MARK: - Volumen por semana

    @Test
    fun volumenPorSemanaDevuelveUnaBarraPorSemana() {
        val ahora = ZonedDateTime.now(bogota)
        val barras = ProgressMetrics.volumeByWeek(emptyList(), weeks = 12, now = ahora)
        assertEquals(12, barras.size)
        // La última barra es la semana actual.
        assertEquals(TrainingCalendar.dayKey(lunesDe(ahora)), barras.last().weekStartKey)
    }

    @Test
    fun elVolumenCaeEnLaSemanaDeLaSesion() {
        val ahora = ZonedDateTime.now(bogota)
        val deEstaSemana = lunesDe(ahora).plusDays(1).withHour(19)
        val barras = ProgressMetrics.volumeByWeek(listOf(sesion("s1", deEstaSemana, 1200.0)), 4, ahora)
        assertEquals(1200.0, barras.last().kg, 0.001)
        assertTrue(barras.dropLast(1).all { it.isEmpty })
    }

    @Test
    fun dosSesionesDeLaMismaSemanaSeSuman() {
        val ahora = ZonedDateTime.now(bogota)
        val lunes = lunesDe(ahora)
        val barras =
            ProgressMetrics.volumeByWeek(
                listOf(
                    sesion("s1", lunes.plusDays(0).withHour(10), 500.0),
                    sesion("s2", lunes.plusDays(2).withHour(10), 700.0),
                ),
                4,
                ahora,
            )
        assertEquals(1200.0, barras.last().kg, 0.001)
    }

    /**
     * La semana en cero conserva una línea mínima: una barra de altura cero se lee como "no hay
     * dato" y no como "no entrenaste".
     */
    @Test
    fun laSemanaVaciaConservaUnaLineaMinima() {
        val ahora = ZonedDateTime.now(bogota)
        val barras = ProgressMetrics.volumeByWeek(emptyList(), 4, ahora)
        assertTrue(barras.all { it.height > 0.0 })
    }

    @Test
    fun laBarraMasAltaLlegaAlTope() {
        val ahora = ZonedDateTime.now(bogota)
        val lunes = lunesDe(ahora)
        val barras =
            ProgressMetrics.volumeByWeek(
                listOf(
                    sesion("s1", lunes.withHour(10), 1000.0),
                    sesion("s2", lunes.minusWeeks(1).withHour(10), 500.0),
                ),
                4,
                ahora,
            )
        assertEquals(1.0, barras.last().height, 0.0001)
        assertEquals(0.5, barras[barras.size - 2].height, 0.0001)
    }

    @Test
    fun unaSesionSinTerminarNoCuenta() {
        val ahora = ZonedDateTime.now(bogota)
        val barras = ProgressMetrics.volumeByWeek(listOf(sesion("s1", null, 999.0)), 4, ahora)
        assertTrue(barras.all { it.isEmpty })
    }

    // MARK: - Grilla de días entrenados

    @Test
    fun laGrillaTieneSemanasDeSieteDias() {
        val ahora = ZonedDateTime.now(bogota)
        val grilla = ProgressMetrics.trainedGrid(emptySet(), weeks = 4, now = ahora)
        assertEquals(4, grilla.columns.size)
        assertTrue(grilla.columns.all { it.size == 7 })
        assertEquals(0, grilla.total)
    }

    @Test
    fun elTotalCuentaSoloLosDiasEntrenados() {
        val ahora = ZonedDateTime.now(bogota)
        val ayer = TrainingCalendar.dayKey(ahora.minusDays(1))
        val anteayer = TrainingCalendar.dayKey(ahora.minusDays(2))
        val grilla = ProgressMetrics.trainedGrid(setOf(ayer, anteayer), weeks = 4, now = ahora)
        assertEquals(2, grilla.total)
        assertTrue(grilla.columns.flatten().first { it.key == ayer }.trained)
    }

    /** No haber entrenado mañana no es lo mismo que haberte salteado ayer. */
    @Test
    fun losDiasQueNoPasaronSeMarcanComoFuturos() {
        val ahora = ZonedDateTime.now(bogota)
        val grilla = ProgressMetrics.trainedGrid(emptySet(), weeks = 4, now = ahora)
        val hoy = TrainingCalendar.dayKey(ahora)
        assertTrue(grilla.columns.flatten().first { it.key == hoy }.isFuture.not())
        assertTrue(grilla.columns.flatten().filter { it.key > hoy }.all { it.isFuture })
        assertTrue(grilla.columns.flatten().filter { it.key < hoy }.none { it.isFuture })
    }

    // MARK: - Por ejercicio

    @Test
    fun porEjercicioCuentaSesionesYMarcaLaMejor() {
        val ahora = ZonedDateTime.now(bogota)
        val sesiones =
            listOf(
                sesion("s1", ahora.minusDays(7), 0.0, listOf(LoggedExercise("press", series(100.0 to 5)))),
                sesion("s2", ahora.minusDays(1), 0.0, listOf(LoggedExercise("press", series(110.0 to 3)))),
            )
        val filas = ProgressMetrics.byExercise(sesiones)
        assertEquals(1, filas.size)
        assertEquals("press", filas[0].exerciseID)
        assertEquals(2, filas[0].sessions)
        // 110 x (1 + 3/30) = 121.0
        assertEquals(121.0, filas[0].bestOneRepMax, 0.001)
    }

    /** Ordena por lo último entrenado: la pregunta al abrir progreso es "cómo vengo". */
    @Test
    fun porEjercicioOrdenaPorLoUltimoEntrenado() {
        val ahora = ZonedDateTime.now(bogota)
        val sesiones =
            listOf(
                sesion("s1", ahora.minusDays(10), 0.0, listOf(LoggedExercise("viejo", series(80.0 to 5)))),
                sesion("s2", ahora.minusDays(1), 0.0, listOf(LoggedExercise("nuevo", series(60.0 to 5)))),
            )
        assertEquals(listOf("nuevo", "viejo"), ProgressMetrics.byExercise(sesiones).map { it.exerciseID })
    }

    @Test
    fun unaSerieFalladaNoCuentaParaLaMejorMarca() {
        val ahora = ZonedDateTime.now(bogota)
        val ejercicio =
            LoggedExercise(
                "press",
                listOf(
                    LoggedSet(1, 100.0, 5, null, failed = false),
                    LoggedSet(2, 200.0, 1, null, failed = true),
                ),
            )
        val fila = ProgressMetrics.byExercise(listOf(sesion("s1", ahora, 0.0, listOf(ejercicio)))).single()
        // La fila redondea a un decimal; se compara contra el 1RM real de la serie buena.
        val esperado = (Epley.estimatedOneRepMax(100.0, 5) * 10).roundToInt() / 10.0
        assertEquals(esperado, fila.bestOneRepMax, 0.001)
    }

    @Test
    fun porEjercicioRespetaElLimite() {
        val ahora = ZonedDateTime.now(bogota)
        val ejercicios = (0 until 20).map { LoggedExercise("e$it", series(50.0 to 5)) }
        val sesion = sesion("s1", ahora, 0.0, ejercicios)
        assertEquals(12, ProgressMetrics.byExercise(listOf(sesion)).size)
        assertEquals(5, ProgressMetrics.byExercise(listOf(sesion), limit = 5).size)
    }

    // MARK: - Formato

    @Test
    fun formatKgBajaDeMilEnKilos() {
        assertEquals("0", ProgressMetrics.formatKg(0.0))
        assertEquals("0", ProgressMetrics.formatKg(-5.0))
        assertEquals("850 kg", ProgressMetrics.formatKg(850.4))
    }

    @Test
    fun formatKgArribaDeMilEnToneladas() {
        assertEquals("1,5 t", ProgressMetrics.formatKg(1500.0))
        assertEquals("12 t", ProgressMetrics.formatKg(12000.0))
    }

    @Test
    fun laTendenciaUsaLosSignosDeVerdad() {
        assertEquals("—", ProgressMetrics.trendLabel(null))
        assertEquals("0%", ProgressMetrics.trendLabel(0))
        assertEquals("+20%", ProgressMetrics.trendLabel(20))
        // El menos es U+2212, no un guion.
        assertEquals("−5%", ProgressMetrics.trendLabel(-5))
        assertTrue(ProgressMetrics.trendLabel(-5).startsWith("−"))
    }
}
