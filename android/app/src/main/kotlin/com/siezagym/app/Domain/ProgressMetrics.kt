package com.siezagym.app.Domain

import com.siezagym.app.Models.WorkoutSession
import java.time.ZonedDateTime
import kotlin.math.roundToInt

/**
 * Lo que dibuja la pantalla de progreso. Son las mismas cuentas que `lib/progress/` en la web, para
 * que los dos clientes muestren lo mismo.
 */
object ProgressMetrics {
    // MARK: - Volumen por semana

    data class WeekBar(val weekStartKey: String, val kg: Double, val height: Double) {
        val isEmpty: Boolean get() = kg == 0.0
    }

    /**
     * Las últimas [weeks] semanas hasta la actual.
     *
     * Las alturas van relativas entre sí y no contra un objetivo: nadie fijó uno, y dibujar una meta
     * inventada haría que una buena semana parezca poca. La semana en cero conserva una línea
     * mínima, porque una barra de altura cero se lee como "no hay dato" y no como "no entrenaste".
     */
    fun volumeByWeek(
        sessions: List<WorkoutSession>,
        weeks: Int = 12,
        now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone),
    ): List<WeekBar> {
        val porSemana = HashMap<String, Double>()
        for (sesion in sessions) {
            val fecha = sesion.finishedAt ?: continue
            porSemana[lunesKey(fecha)] = (porSemana[lunesKey(fecha)] ?: 0.0) + sesion.totalVolumeKg
        }

        val lunesActual = lunes(now)
        val filas = mutableListOf<Pair<String, Double>>()
        for (atras in (weeks - 1) downTo 0) {
            val inicio = lunesActual.minusDays(atras * 7L)
            val key = TrainingCalendar.dayKey(inicio)
            filas += key to (porSemana[key] ?: 0.0)
        }

        val maximo = filas.maxOfOrNull { it.second } ?: 0.0
        return filas.map { (key, kg) ->
            WeekBar(key, kg, if (maximo > 0.0) maxOf(0.04, kg / maximo) else 0.04)
        }
    }

    // MARK: - Días entrenados

    data class GridDay(val key: String, val trained: Boolean, val isFuture: Boolean)

    data class Grid(val columns: List<List<GridDay>>, val total: Int)

    /**
     * Una columna por semana, de lunes a domingo. Los días que todavía no pasaron van aparte: no
     * haber entrenado mañana no es lo mismo que haberte salteado ayer.
     */
    fun trainedGrid(
        trainedDayKeys: Set<String>,
        weeks: Int = 26,
        now: ZonedDateTime = ZonedDateTime.now(TrainingCalendar.zone),
    ): Grid {
        val hoyKey = TrainingCalendar.dayKey(now)
        val primero = lunes(now).minusDays((weeks - 1) * 7L)

        val columnas = (0 until weeks).map { semana ->
            val inicio = primero.plusDays(semana * 7L)
            (0 until 7).map { offset ->
                val fecha = inicio.plusDays(offset.toLong())
                val key = TrainingCalendar.dayKey(fecha)
                GridDay(key, trainedDayKeys.contains(key), isFuture = key > hoyKey)
            }
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

    /**
     * Ordena por lo último entrenado y no por la mejor marca: la pregunta al abrir progreso es
     * "cómo vengo", y lo que estás entrenando ahora va primero.
     */
    fun byExercise(sessions: List<WorkoutSession>, limit: Int = 12): List<ExerciseRow> {
        class Acumulado(var sesiones: Int = 0, var mejor: Double = 0.0, var ultima: ZonedDateTime? = null)

        val acumulado = LinkedHashMap<String, Acumulado>()

        for (sesion in sessions) {
            for (ejercicio in sesion.exercises) {
                val fila = acumulado.getOrPut(ejercicio.exerciseID) { Acumulado() }
                fila.sesiones += 1
                val fecha = sesion.finishedAt
                if (fecha != null && (fila.ultima == null || fecha > fila.ultima!!)) fila.ultima = fecha
                for (serie in ejercicio.sets) {
                    if (serie.failed) continue
                    fila.mejor = maxOf(fila.mejor, Epley.estimatedOneRepMax(serie.weight, serie.reps))
                }
            }
        }

        return acumulado.entries
            .map {
                ExerciseRow(
                    it.key,
                    it.value.sesiones,
                    (it.value.mejor * 10).roundToInt() / 10.0,
                    it.value.ultima,
                )
            }
            .sortedByDescending { it.lastAt ?: ZonedDateTime.parse("1970-01-01T00:00:00Z[UTC]") }
            .take(limit)
    }

    // MARK: - Formato

    /**
     * Kilos en una unidad que se lea de un vistazo: arriba de una tonelada el número entero deja de
     * decir algo útil.
     */
    fun formatKg(kg: Double): String {
        if (kg <= 0.0) return "0"
        if (kg < 1000.0) return "${kg.roundToInt()} kg"
        val toneladas = kg / 1000.0
        val texto =
            if (toneladas >= 10.0) "${toneladas.roundToInt()}" else
                String.format(java.util.Locale.forLanguageTag("es-AR"), "%.1f", toneladas)
        return "$texto t"
    }

    /** "+20%" / "−5%" / "—". El signo menos es el de verdad, no un guion. */
    fun trendLabel(pct: Int?): String {
        if (pct == null) return "—"
        if (pct == 0) return "0%"
        return if (pct > 0) "+$pct%" else "−${kotlin.math.abs(pct)}%"
    }

    // MARK: - Ayudas

    private fun lunes(fecha: ZonedDateTime): ZonedDateTime =
        fecha.minusDays(TrainingCalendar.weekdayIndex(fecha).toLong())

    private fun lunesKey(fecha: ZonedDateTime): String = TrainingCalendar.dayKey(lunes(fecha))
}
