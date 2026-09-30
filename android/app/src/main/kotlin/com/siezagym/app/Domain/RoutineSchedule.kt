package com.siezagym.app.Domain

import com.siezagym.app.Models.Routine

data class RoutineMonth(val id: String, val label: String, val weeks: Map<Int, List<Routine>>) {
    val total
        get() = weeks.values.sumOf { it.size }
}

object RoutineSchedule {
    fun group(routines: List<Routine>): List<RoutineMonth> =
        routines
            .filter { it.referenceDate != null }
            .groupBy {
                it.referenceDate!!
                    .withZoneSameInstant(TrainingCalendar.zone)
                    .toLocalDate()
                    .withDayOfMonth(1)
            }
            .toSortedMap(compareByDescending { it })
            .map { (date, items) ->
                RoutineMonth(
                    "%04d-%02d".format(java.util.Locale.ROOT, date.year, date.monthValue),
                    TrainingCalendar.monthLabel(date.year, date.monthValue),
                    items
                        .groupBy {
                            TrainingCalendar.weekOfMonth(
                                it.referenceDate!!
                                    .withZoneSameInstant(TrainingCalendar.zone)
                                    .dayOfMonth
                            )
                        }
                        .toSortedMap(),
                )
            }
}

/**
 * La búsqueda por nombre de la lista de rutinas. Sin acentos y sin mayúsculas,
 * como el `folding` de iOS: buscar "ptero" tiene que encontrar "Pectoral".
 */
object RoutineSearch {
    fun coincide(nombre: String, termino: String): Boolean {
        val buscado = SearchText.normalize(termino)
        if (buscado.isEmpty()) return true
        return SearchText.normalize(nombre).contains(buscado)
    }
}

private object SearchText {
    fun normalize(texto: String): String =
        java.text.Normalizer.normalize(texto.trim(), java.text.Normalizer.Form.NFD)
            .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")
            .replace("ñ", "n")
            .lowercase()
}
