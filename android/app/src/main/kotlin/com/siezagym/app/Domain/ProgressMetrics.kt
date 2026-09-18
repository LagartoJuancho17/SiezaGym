package com.siezagym.app.Domain

import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import java.util.Locale
import kotlin.math.roundToInt

/** Lo que dibuja la pantalla de progreso. Son las mismas cuentas que
 *  `lib/progress/` en la web, para que los dos clientes muestren lo mismo. */
object ProgressMetrics {
    // MARK: - Volumen por semana

    data class WeekBar(val weekStartKey: String, val kg: Double, val height: Double) {
        val isEmpty: Boolean get() = kg == 0.0
    }

    /** Las últimas `weeks` semanas hasta la actual.
     *
     *  Las alturas van relativas entre sí y no contra un objetivo. La semana en
     *  cero conserva una línea mínima, porque una barra de altura cero se lee
     *  como "no hay dato" y no como "no entrenaste". */
    fun volumeByWeek(sessions: List<WorkoutSession>, weeks: Int = 12, now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone)): List<WeekBar> {
        val porSemana = mutableMapOf<String, Double>()
        for (sesion in sessions) {
            val fecha = sesion.finishedAt ?: continue
            porSemana[lunesKey(fecha)] = (porSemana[lunesKey(fecha)] ?: 0.0) + sesion.totalVolumeKg
        }

        val lunesActual = lunes(now)
        val filas = mutableListOf<Pair<String, Double>>()
        for (atras in weeks - 1 downTo 0) {
            val inicio = lunesActual.minusDays(atras * 7L)
            val key = TrainingCalendar.dayKey(inicio)
            filas.add(key to (porSemana[key] ?: 0.0))
        }

        val maximo = filas.map { it.second }.maxOrNull() ?: 0.0
        return filas.map { (key, kg) ->
            WeekBar(weekStartKey = key, kg = kg, height = if (maximo > 0) maxOf(0.04, kg / maximo) else 0.04)
        }
    }

    // MARK: - Días entrenados

    data class GridDay(val key: String, val trained: Boolean, val isFuture: Boolean)

    data class Grid(val columns: List<List<GridDay>>, val total: Int)

    /** Una columna por semana, de lunes a domingo. Los días que todavía no
     *  pasaron van aparte: no haber entrenado mañana no es lo mismo que
     *  haberte salteado ayer. */
    fun trainedGrid(trainedDayKeys: Set<String>, weeks: Int = 26, now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone)): Grid {
        val hoyKey = TrainingCalendar.dayKey(now)
        val lunesActual = lunes(now)
        val primero = lunesActual.minusDays((weeks - 1) * 7L)

        val columnas = mutableListOf<List<GridDay>>()
        for (semana in 0 until weeks) {
            val inicio = primero.plusDays(semana * 7L)
            val dias = mutableListOf<GridDay>()
            for (offset in 0 until 7) {
                val fecha = inicio.plusDays(offset.toLong())
                val key = TrainingCalendar.dayKey(fecha)
                dias.add(GridDay(key = key, trained = trainedDayKeys.contains(key), isFuture = key > hoyKey))
            }
            columnas.add(dias)
        }

        val total = columnas.flatten().count { it.trained }
        return Grid(columnas, total)
    }

    // MARK: - Por ejercicio

    data class ExerciseRow(
        val exerciseID: String,
        val sessions: Int,
        /** Epley sobre la mejor serie real. Es una estimación y se rotula. */
        val bestOneRepMax: Double,
        val lastAt: ZonedDateTime?,
    )

    /** Ordena por lo último entrenado y no por la mejor marca: la pregunta al
     *  abrir progreso es "cómo vengo". */
    fun byExercise(sessions: List<WorkoutSession>, limit: Int = 12): List<ExerciseRow> {
        data class Acumulado(var sesiones: Int, var mejor: Double, var ultima: ZonedDateTime?)

        val acumulado = mutableMapOf<String, Acumulado>()
        for (sesion in sessions) {
            for (ejercicio in sesion.exercises) {
                val fila = acumulado.getOrPut(ejercicio.exerciseID) { Acumulado(0, 0.0, null) }
                fila.sesiones++
                val fecha = sesion.finishedAt
                if (fecha != null && (fila.ultima == null || fecha > fila.ultima!!)) fila.ultima = fecha
                for (serie in ejercicio.sets.filter { !it.failed }) {
                    fila.mejor = maxOf(fila.mejor, Epley.estimatedOneRepMax(weight = serie.weight, reps = serie.reps))
                }
            }
        }

        return acumulado.entries
            .map { (id, fila) ->
                ExerciseRow(
                    exerciseID = id,
                    sessions = fila.sesiones,
                    bestOneRepMax = (fila.mejor * 10).roundToInt() / 10.0,
                    lastAt = fila.ultima,
                )
            }
            .sortedWith(compareByDescending<ExerciseRow> { it.lastAt ?: java.time.LocalDateTime.MIN.atZone(TrainingCalendar.zone) })
            .take(limit)
    }

    // MARK: - Formato

    /** Kilos en una unidad que se lea de un vistazo: arriba de una tonelada el
     *  número entero deja de decir algo útil. */
    fun formatKg(kg: Double): String {
        if (kg <= 0) return "0"
        if (kg < 1000) return "${kg.roundToInt()} kg"
        val toneladas = kg / 1000
        val texto = if (toneladas >= 10) {
            String.format(Locale.ROOT, "%.0f", toneladas)
        } else {
            String.format(Locale.ROOT, "%.1f", toneladas).replace(".", ",")
        }
        return "$texto t"
    }

    /** "+20%" / "−5%" / "—". El signo menos es el de verdad, no un guion. */
    fun trendLabel(pct: Int?): String {
        if (pct == null) return "—"
        if (pct == 0) return "0%"
        return if (pct > 0) "+$pct%" else "−${absOf(pct)}%"
    }

    private fun absOf(value: Int): Int = if (value < 0) -value else value

    // MARK: - Ayudas

    private fun lunes(fecha: ZonedDateTime): ZonedDateTime =
        fecha.minusDays(TrainingCalendar.weekdayIndex(fecha).toLong())

    private fun lunesKey(fecha: ZonedDateTime): String = TrainingCalendar.dayKey(lunes(fecha))
}