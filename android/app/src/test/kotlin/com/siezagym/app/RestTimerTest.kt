package com.siezagym.app

import com.siezagym.app.Domain.RestTimer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * El descanso entre series. Son reglas, no dibujo: por eso viven fuera de la pantalla y se pueden
 * probar sin esperar un minuto y medio.
 */
class RestTimerTest {
    @Test
    fun arrancaEnNoventaSegundosYNoEnLosSetentaYCincoDeLaWeb() {
        val timer = RestTimer().arrancar()
        assertEquals(90, timer.restantes)
        assertTrue(timer.corriendo)
        assertEquals("01:30", timer.texto)
    }

    @Test
    fun arrancarNuncaDejaCero() {
        assertEquals(1, RestTimer().arrancar(0).restantes)
    }

    @Test
    fun restarBajaDeAQuincePeroNoLlegaACero() {
        val timer = RestTimer(restantes = 20).restar()
        assertEquals(5, timer.restantes)
        val piso = RestTimer(restantes = 10).restar()
        assertEquals(1, piso.restantes)
        assertTrue(piso.corriendo)
    }

    @Test
    fun sumarSubeElPasoPorDefecto() {
        assertEquals(120, RestTimer(restantes = 90).sumar().restantes)
        assertEquals(170, RestTimer(restantes = 90).sumar(80).restantes)
    }

    @Test
    fun restarYSumarEnUnDescansoApagadoNoHacenNada() {
        val apagado = RestTimer(restantes = null)
        assertNull(apagado.restar().restantes)
        assertNull(apagado.sumar().restantes)
    }

    @Test
    fun saltarApagaElDescanso() {
        assertNull(RestTimer(restantes = 45).saltar().restantes)
    }

    @Test
    fun elTickAvisaUnaSolaVezCuandoTermina() {
        val (ultimo, sono) = RestTimer(restantes = 1).tick()
        assertTrue(sono)
        assertNull(ultimo.restantes)

        val (quieto, deNuevo) = ultimo.tick()
        assertFalse(deNuevo)
        assertNull(quieto.restantes)
    }

    @Test
    fun elTickBajaDeAUnoSinSonarHastaElFinal() {
        val (siguiente, sono) = RestTimer(restantes = 90).tick()
        assertEquals(89, siguiente.restantes)
        assertFalse(sono)
    }

    @Test
    fun unDescansoApagadoMuestraCeroCero() {
        assertEquals("00:00", RestTimer(restantes = null).texto)
    }
}
