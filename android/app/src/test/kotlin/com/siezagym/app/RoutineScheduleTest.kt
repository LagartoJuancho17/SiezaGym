package com.siezagym.app

import com.siezagym.app.Domain.RoutineSchedule
import com.siezagym.app.Domain.TrainingCalendar
import com.siezagym.app.Models.Routine
import java.time.Instant
import java.time.ZonedDateTime
import java.util.Locale
import org.junit.Assert.*
import org.junit.Test

class RoutineScheduleTest {
    @Test
    fun groupsAssignmentsByAssignedDateAndWeeksInSevenDayBlocks() {
        val first =
            Routine.fromFirestore(
                "one",
                mapOf("createdAt" to Instant.parse("2026-08-01T12:00:00Z")),
            )
        val assigned =
            Routine.fromFirestore(
                "two",
                mapOf(
                    "createdAt" to Instant.parse("2026-08-01T12:00:00Z"),
                    "assignedAt" to Instant.parse("2026-09-08T12:00:00Z"),
                ),
                true,
            )
        val groups = RoutineSchedule.group(listOf(first, assigned))
        assertEquals(listOf("2026-09", "2026-08"), groups.map { it.id })
        assertEquals("Septiembre 2026", groups.first().label)
        assertEquals(assigned, groups.first().weeks[2]?.single())
        assertTrue(groups.first().weeks[2]!!.single().isAssigned)
    }

    @Test
    fun datesAndWeekdaysUseArgentinaEvenWhenInputIsUTC() {
        val utc = ZonedDateTime.parse("2026-09-07T01:00:00Z")
        assertEquals("2026-09-06", TrainingCalendar.dayKey(utc))
        assertEquals(6, TrainingCalendar.weekdayIndex(utc))
        assertEquals(2, TrainingCalendar.streak(setOf("2026-09-06", "2026-09-05"), utc))
    }

    @Test
    fun dateKeysRemainAsciiInOtherDeviceLocales() {
        val previous = Locale.getDefault()
        try {
            Locale.setDefault(Locale.forLanguageTag("ar"))
            assertEquals(
                "2026-09-06",
                TrainingCalendar.dayKey(ZonedDateTime.parse("2026-09-06T12:00:00Z")),
            )
        } finally {
            Locale.setDefault(previous)
        }
    }
}
