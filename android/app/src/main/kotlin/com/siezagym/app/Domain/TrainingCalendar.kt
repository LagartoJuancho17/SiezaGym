package com.siezagym.app.Domain

import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.math.ceil

/** El día del usuario es el día en Argentina, no el del dispositivo ni el UTC.
 *  Un entrenamiento a las 22:00 en Buenos Aires es del mismo día aunque el
 *  teléfono esté en otra zona horaria. */
object TrainingCalendar {
    val zone: ZoneId = ZoneId.of("America/Argentina/Buenos_Aires")

    val dayLabels = listOf("LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM")

    /** "YYYY-MM-DD" en hora Argentina. */
    fun dayKey(date: ZonedDateTime): String {
        val p = date.toLocalDate()
        return "%04d-%02d-%02d".format(p.year, p.monthValue, p.dayOfMonth)
    }

    fun dayKey(date: java.time.LocalDate): String =
        "%04d-%02d-%02d".format(date.year, date.monthValue, date.dayOfMonth)

    /** Índice 0 = lunes ... 6 = domingo. */
    fun weekdayIndex(date: ZonedDateTime): Int = date.dayOfWeek.value - 1

    fun weekdayIndex(date: java.time.LocalDate): Int = date.dayOfWeek.value - 1

    /** Racha de días consecutivos con al menos una sesión terminada.
     *  No se corta hasta la medianoche siguiente: si hoy todavía no entrenaste
     *  pero ayer sí, la racha sigue viva. */
    fun streak(trainedDayKeys: Set<String>, now: ZonedDateTime = ZonedDateTime.now(zone)): Int {
        var cursor = now.toLocalDate()
        if (!trainedDayKeys.contains(dayKey(cursor))) {
            cursor = cursor.minusDays(1)
        }
        var streak = 0
        while (trainedDayKeys.contains(dayKey(cursor))) {
            streak += 1
            cursor = cursor.minusDays(1)
        }
        return streak
    }

    /** Semana del mes por bloques de 7 días: 1-7 -> 1, 8-14 -> 2, etc. */
    fun weekOfMonth(day: Int): Int = maxOf(1, ceil(day / 7.0).toInt())

    fun monthLabel(year: Int, month: Int): String {
        val names = listOf(
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        )
        if (month !in 1..12) return "$year"
        return "${names[month - 1]} $year"
    }
}