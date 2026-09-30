package com.siezagym.app.Domain

import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.math.ceil

/**
 * El día del usuario es el día en Argentina, no el del dispositivo ni el UTC. Un entrenamiento a
 * las 22:00 en Buenos Aires es del mismo día aunque el teléfono esté en otra zona horaria.
 */
object TrainingCalendar {
    val zone: ZoneId = ZoneId.of("America/Argentina/Buenos_Aires")

    val dayLabels = listOf("LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM")

    /** "YYYY-MM-DD" en hora Argentina. */
    fun dayKey(date: ZonedDateTime): String {
        val p = date.withZoneSameInstant(zone).toLocalDate()
        return "%04d-%02d-%02d".format(java.util.Locale.ROOT, p.year, p.monthValue, p.dayOfMonth)
    }

    fun dayKey(date: java.time.LocalDate): String =
        "%04d-%02d-%02d".format(java.util.Locale.ROOT, date.year, date.monthValue, date.dayOfMonth)

    /** Índice 0 = lunes ... 6 = domingo. */
    fun weekdayIndex(date: ZonedDateTime): Int = date.withZoneSameInstant(zone).dayOfWeek.value - 1

    fun weekdayIndex(date: java.time.LocalDate): Int = date.dayOfWeek.value - 1

    /**
     * Racha de días consecutivos con al menos una sesión terminada. No se corta hasta la medianoche
     * siguiente: si hoy todavía no entrenaste pero ayer sí, la racha sigue viva.
     */
    fun streak(trainedDayKeys: Set<String>, now: ZonedDateTime = ZonedDateTime.now(zone)): Int {
        var cursor = now.withZoneSameInstant(zone).toLocalDate()
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
        val names =
            listOf(
                "Enero",
                "Febrero",
                "Marzo",
                "Abril",
                "Mayo",
                "Junio",
                "Julio",
                "Agosto",
                "Septiembre",
                "Octubre",
                "Noviembre",
                "Diciembre",
            )
        if (month !in 1..12) return "$year"
        return "${names[month - 1]} $year"
    }

    private fun soloMes(month: Int): String =
        if (month in 1..12)
            listOf(
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre",
                )
                .getOrElse(month - 1) { "" }
        else ""

    /**
     * La semana a la que pertenece una fecha, para asignarle rutinas: "en qué semana de qué mes de
     * qué año". Año y mes en el resultado son los de Argentina, iguales a los de [dayKey], no los
     * del huso del teléfono.
     */
    data class Semana(val anio: Int, val mes: Int, val numero: Int) {
        /** Para guardar y comparar: "2026-09-4". No es para mostrar. */
        val clave: String get() = "%04d-%02d-%d".format(java.util.Locale.ROOT, anio, mes, numero)

        /** Para mostrar: "Septiembre · Semana 4". */
        val texto: String get() = "${TrainingCalendar.soloMes(mes)} · Semana $numero"
    }

    fun semana(fecha: ZonedDateTime): Semana {
        val local = fecha.withZoneSameInstant(zone).toLocalDate()
        return Semana(local.year, local.monthValue, weekOfMonth(local.dayOfMonth))
    }

    fun semana(fecha: java.time.LocalDate): Semana =
        Semana(fecha.year, fecha.monthValue, weekOfMonth(fecha.dayOfMonth))

    /**
     * Las rutinas propias asignadas a esa semana. Función aparte y no un filtro escrito en el store
     * para que se pueda probar sin Firebase, igual que el resto de `Domain/`.
     */
    fun <T> delaSemana(items: List<T>, objetivo: String, claveDe: (T) -> String?): List<T> =
        items.filter { claveDe(it) == objetivo }

    /**
     * Una tanda de items que caen en la misma semana, para la pantalla de Rutinas. Puerto de
     * `groupByMonthAndWeek` + `weekSections` en `lib/routines/schedule.js` y `lib/routines/filter.js`.
     */
    data class SeccionSemana<T>(val id: String, val texto: String, val items: List<T>)

    /**
     * Agrupa por semana del mes usando la fecha de cada item. Los meses van del más nuevo al más
     * viejo; dentro de un mes, las semanas de la 1 en adelante — mismo orden que la web. Los que
     * no tienen fecha quedan en una sola tanda al final, en vez de desaparecer.
     */
    fun <T> seccionesPorSemana(
        items: List<T>,
        fechaDe: (T) -> ZonedDateTime?,
    ): List<SeccionSemana<T>> {
        val porClave = linkedMapOf<String, Pair<Semana, MutableList<T>>>()
        val sinFecha = mutableListOf<T>()

        for (item in items) {
            val fecha = fechaDe(item)
            if (fecha == null) {
                sinFecha += item
                continue
            }
            val sem = semana(fecha)
            porClave.getOrPut(sem.clave) { sem to mutableListOf() }.second += item
        }

        val conFecha =
            porClave.entries
                .sortedWith(
                    compareByDescending<Map.Entry<String, Pair<Semana, MutableList<T>>>> { it.value.first.anio }
                        .thenByDescending { it.value.first.mes }
                        .thenBy { it.value.first.numero }
                )
                .map { SeccionSemana(it.key, it.value.first.texto, it.value.second.toList()) }

        if (sinFecha.isEmpty()) return conFecha
        return conFecha + SeccionSemana("sin-fecha", "Sin fecha", sinFecha.toList())
    }
}
