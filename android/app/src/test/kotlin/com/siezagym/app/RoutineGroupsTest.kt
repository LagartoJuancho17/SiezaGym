package com.siezagym.app

import com.siezagym.app.Domain.GroupColor
import com.siezagym.app.Domain.RoutineGrouping
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * El agrupamiento consecutivo de la web. Fixtures mínimos para probar el algoritmo sin depender de
 * un ejercicio de rutina entero.
 */
class RoutineGroupsTest {
    private data class Item(val nombre: String, val group: String = "", val groupColor: String = "")

    private fun seccionar(items: List<Item>) =
        RoutineGrouping.seccionar(items, grupo = Item::group, colorID = Item::groupColor)

    /**
     * Igual que la web: dos ejercicios sueltos seguidos son "" y "" en nombre y color, así que se
     * funden en una sola tanda sin agrupar.
     */
    @Test
    fun ejerciciosSueltosSeguidosSeFundenEnUnaSolaTanda() {
        val secciones = seccionar(listOf(Item("A"), Item("B")))
        assertEquals(1, secciones.size)
        assertEquals(false, secciones[0].agrupada)
        assertNull(secciones[0].color)
        assertEquals(listOf("A", "B"), secciones[0].items.map { it.nombre })
    }

    @Test
    fun consecutivosConElMismoGrupoFormanUnaSolaTanda() {
        val secciones =
            seccionar(
                listOf(
                    Item("A", "Fuerza", "amber"),
                    Item("B", "Fuerza", "amber"),
                    Item("C", "Fuerza", "amber"),
                )
            )
        assertEquals(1, secciones.size)
        assertEquals("Fuerza", secciones[0].nombreGrupo)
        assertEquals(GroupColor.AMBER, secciones[0].color)
        assertEquals(listOf("A", "B", "C"), secciones[0].items.map { it.nombre })
    }

    /** El caso del pedido: "Entrada en calor" (2), "Fuerza" (1), "Potencia" (2). */
    @Test
    fun tresBloquesSeguidosQuedanEnTresTandasEnOrden() {
        val secciones =
            seccionar(
                listOf(
                    Item("1", "Entrada en calor", "teal"),
                    Item("2", "Entrada en calor", "teal"),
                    Item("3", "Fuerza", "amber"),
                    Item("4", "Potencia", "rose"),
                    Item("5", "Potencia", "rose"),
                )
            )
        assertEquals(
            listOf("Entrada en calor", "Fuerza", "Potencia"),
            secciones.map { it.nombreGrupo },
        )
        assertEquals(listOf(2, 1, 2), secciones.map { it.items.size })
    }

    /** Agrupar no reordena: si "Fuerza" vuelve después de "Cardio", son dos tandas, no una. */
    @Test
    fun elMismoGrupoSeparadoNoSeJunta() {
        val secciones =
            seccionar(
                listOf(
                    Item("A", "Fuerza", "amber"),
                    Item("B", "Cardio", "rose"),
                    Item("C", "Fuerza", "amber"),
                )
            )
        assertEquals(3, secciones.size)
        assertEquals(listOf("Fuerza", "Cardio", "Fuerza"), secciones.map { it.nombreGrupo })
    }

    /**
     * Con nombre pero sin color explícito, la web cae en `teal`. Es una regla fácil de romper por
     * accidente y difícil de ver a ojo.
     */
    @Test
    fun unGrupoSinColorCaeEnTeal() {
        val secciones = seccionar(listOf(Item("A", "Fuerza", "")))
        assertEquals(GroupColor.TEAL, secciones[0].color)
    }

    /**
     * La regla de la web es `groupColor || (groupName ? "teal" : "")`: un color explícito gana
     * aunque no haya nombre, así que la tanda queda sin encabezado pero con color guardado.
     */
    @Test
    fun unColorExplicitoSinNombreSeConservaPeroNoAgrupa() {
        val secciones = seccionar(listOf(Item("A", "", "amber")))
        assertEquals(GroupColor.AMBER, secciones[0].color)
        assertEquals(false, secciones[0].agrupada)
    }

    /** Un espacio de más no cuenta como un grupo distinto: es el mismo `.trim()` de la web. */
    @Test
    fun losEspaciosDeMasNoRompenLaFusion() {
        val secciones =
            seccionar(
                listOf(
                    Item("A", "Fuerza", "amber"),
                    Item("B", "  Fuerza  ", "amber"),
                )
            )
        assertEquals(1, secciones.size)
    }

    @Test
    fun distintoColorConElMismoNombreCortaLaTanda() {
        val secciones =
            seccionar(
                listOf(
                    Item("A", "Fuerza", "amber"),
                    Item("B", "Fuerza", "blue"),
                )
            )
        assertEquals(2, secciones.size)
    }

    /** Un id de color desconocido en los datos no rompe nada: cae en el mismo teal por defecto. */
    @Test
    fun unColorDesconocidoCaeEnTeal() {
        val secciones = seccionar(listOf(Item("A", "Fuerza", "fucsia-inventado")))
        assertEquals(GroupColor.TEAL, secciones[0].color)
    }

    @Test
    fun listaVaciaNoTieneTandas() {
        assertEquals(0, seccionar(emptyList()).size)
    }

    @Test
    fun dosTandasDistintasNoCompartenId() {
        val secciones = seccionar(listOf(Item("A", "Fuerza", "amber"), Item("B", "Cardio", "rose")))
        assertEquals(2, secciones.map { it.id }.distinct().size)
    }
}
