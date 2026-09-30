package com.siezagym.app

import androidx.compose.ui.graphics.Color
import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.DesignSystem.temasDesign2
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** El tema de marca SIEZA y la compatibilidad con los temas viejos. Puerto de `BrandThemeTests`. */
class BrandThemeTest {
    private fun rgba(r: Int, g: Int, b: Int, a: Float = 1f) = Color(r / 255f, g / 255f, b / 255f, a)

    @Test
    fun siezaEsElTemaInicialYMantieneLasOpcionesAnteriores() {
        assertEquals("sieza", Theme.porDefecto.id)
        assertEquals(6, temasDesign2.size)
        assertEquals("plata", Theme.conId("plata").id)
        assertEquals("noche", Theme.conId("noche").id)
    }

    @Test
    fun lasTresCapasDelTemaSonOpacasYElFondoEsPlano() {
        val tema = Theme.conId("sieza")

        assertTrue(tema.plano)
        assertNull(tema.obra)
        assertEquals(1, tema.fondo.size)
        assertEquals(rgba(11, 12, 14), tema.fondoPlano)
        assertEquals(tema.superficie1, tema.vidrio(1))
        assertEquals(tema.superficie2, tema.vidrio(2))
        assertEquals(tema.superficie3, tema.vidrio(3))
        assertEquals(rgba(255, 87, 51), tema.solido)
        assertEquals(rgba(11, 12, 14), tema.sobreSolido)
    }

    @Test
    fun losTemasAntiguosSiguenUsandoVidrio() {
        val plata = Theme.conId("plata")

        assertFalse(plata.plano)
        assertNull(plata.superficie1)
        assertEquals(Color.White.copy(alpha = plata.glass1.toFloat()), plata.vidrio(1))
    }
}
