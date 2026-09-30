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
