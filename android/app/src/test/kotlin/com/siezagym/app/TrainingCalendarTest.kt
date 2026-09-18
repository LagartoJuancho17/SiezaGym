package com.siezagym.app

import com.siezagym.app.Domain.TrainingCalendar
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Test

class TrainingCalendarTest {
    /** Mediodía en Argentina, para que ningún corrimiento de zona cambie el día. */
    private fun at(year: Int, month: Int, day: Int, hour: Int = 12): ZonedDateTime =
        ZonedDateTime.of(year, month, day, hour, 0, 0, 0, TrainingCalendar.zone)

    @Test
    fun laClaveDelDiaEsLaDelHorarioArgentino() {
        assertEquals("2026-09-06", TrainingCalendar.dayKey(at(2026, 9, 6)))
    }

    @Test
    fun las22DeBuenosAiresSiguenSiendoElMismoDia() {
        assertEquals("2026-09-06", TrainingCalendar.dayKey(at(2026, 9, 6, hour = 22)))
    }

    @Test
    fun elLunesEsElIndice0YElDomingoEl6() {
        // 2026-09-07 es lunes.
        assertEquals(0, TrainingCalendar.weekdayIndex(at(2026, 9, 7)))
        assertEquals(6, TrainingCalendar.weekdayIndex(at(2026, 9, 13)))
    }

    @Test
    fun laSemanaDelMesCortaDeASieteDias() {
        assertEquals(1, TrainingCalendar.weekOfMonth(1))
        assertEquals(1, TrainingCalendar.weekOfMonth(7))
        assertEquals(2, TrainingCalendar.weekOfMonth(8))
        assertEquals(2, TrainingCalendar.weekOfMonth(14))
        assertEquals(4, TrainingCalendar.weekOfMonth(28))
        assertEquals(5, TrainingCalendar.weekOfMonth(31))
    }

    @Test
    fun elMesSeEscribeEnEspanol() {
        assertEquals("Septiembre 2026", TrainingCalendar.monthLabel(2026, 9))
    }

    @Test
    fun diasConsecutivosSumanRacha() {
        val hoy = at(2026, 9, 6)
        val claves = setOf("2026-09-06", "2026-09-05", "2026-09-04")
        assertEquals(3, TrainingCalendar.streak(claves, now = hoy))
    }

    @Test
    fun laRachaSobreviveElDiaQueTodaviaNoEntrenaste() {
        // Hoy no hay entrenamiento, pero ayer y anteayer sí: la racha vive
        // hasta la medianoche siguiente.
        val hoy = at(2026, 9, 6)
        val claves = setOf("2026-09-05", "2026-09-04")
        assertEquals(2, TrainingCalendar.streak(claves, now = hoy))
    }

    @Test
    fun unHuecoCortaLaRacha() {
        val hoy = at(2026, 9, 6)
        val claves = setOf("2026-09-06", "2026-09-04", "2026-09-03")
        assertEquals(1, TrainingCalendar.streak(claves, now = hoy))
    }

    @Test
    fun sinEntrenamientosLaRachaEsCero() {
        assertEquals(0, TrainingCalendar.streak(emptySet(), now = at(2026, 9, 6)))
    }
}