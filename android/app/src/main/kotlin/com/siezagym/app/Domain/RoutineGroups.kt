package com.siezagym.app.Domain

import androidx.compose.ui.graphics.Color
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.MuscleGroup

/**
 * Agrupar ejercicios consecutivos de una rutina en bloques con nombre y color: "Entrada en calor",
 * "Fuerza", "Potencia". Es el `group`/`groupColor` de `lib/routines/routines.js` y el agrupamiento
 * de `RoutineComposer.js` y `RoutineScreen.js` en la web, puerto exacto.
 */
enum class GroupColor {
    TEAL,
    AMBER,
    BLUE,
    PURPLE,
    ROSE,
    EMERALD,
    INDIGO;

    val color: Color
        get() =
            when (this) {
                TEAL -> Color(0xFF10B981.toInt())
                AMBER -> Color(0xFFF59E0B.toInt())
                BLUE -> Color(0xFF38BDF8.toInt())
                PURPLE -> Color(0xFFC084FC.toInt())
                ROSE -> Color(0xFFFB7185.toInt())
                EMERALD -> Color(0xFF34D399.toInt())
                INDIGO -> Color(0xFF818CF8.toInt())
            }

    /** El mismo texto que `GROUP_COLORS` en la web, para el selector. */
    val label: String
        get() =
            when (this) {
                TEAL -> "Verde azulado"
                AMBER -> "Ámbar / Naranja"
                BLUE -> "Celeste / Azul"
                PURPLE -> "Violeta"
                ROSE -> "Rosa / Carmín"
                EMERALD -> "Verde esmeralda"
                INDIGO -> "Índigo"
            }

    val id: String
        get() = name.lowercase()

    companion object {
        fun porId(id: String): GroupColor? = entries.firstOrNull { it.id == id }

        /**
         * `groupColor` guarda `""` sin grupo y el id del color con grupo. Con nombre pero sin color
         * explícito, la web cae en `teal` (`item.groupColor || (groupName ? "teal" : "")`): el
         * mismo criterio acá.
         */
        fun resuelto(id: String, nombre: String): GroupColor? {
            porId(id)?.let {
                return it
            }
            return if (nombre.isEmpty()) null else TEAL
        }
    }
}

/** Los seis atajos de `PRESET_GROUPS` en `RoutineComposer.js`. */
data class GroupPreset(val name: String, val color: GroupColor)

val groupPresets =
    listOf(
        GroupPreset("Movilidad", GroupColor.TEAL),
        GroupPreset("Fuerza", GroupColor.AMBER),
        GroupPreset("Descanso", GroupColor.BLUE),
        GroupPreset("Calentamiento", GroupColor.EMERALD),
        GroupPreset("Core", GroupColor.PURPLE),
        GroupPreset("Cardio", GroupColor.ROSE),
    )

/**
 * Una tanda de ejercicios consecutivos con el mismo grupo. `color == null` es "sin grupo": esas
 * tandas se muestran lisas, sin encabezado ni borde.
 */
data class RoutineSection<T>(
    val id: String,
    val nombreGrupo: String,
    val color: GroupColor?,
    val items: List<T>,
) {
    val agrupada: Boolean get() = nombreGrupo.isNotEmpty()
}

/**
 * El agrupamiento consecutivo de `RoutineComposer.js` (`sections` useMemo) y `RoutineScreen.js`:
 * recorre la lista y corta una tanda nueva cada vez que cambia el par (nombre, color). Dos bloques
 * "Fuerza" separados por un "Descanso" son dos tandas, no una: agrupar no reordena, sólo junta lo que
 * ya está consecutivo.
 */
object RoutineGrouping {
    fun <T> seccionar(
        items: List<T>,
        grupo: (T) -> String,
        colorID: (T) -> String,
    ): List<RoutineSection<T>> {
        if (items.isEmpty()) return emptyList()

        val resultado = mutableListOf<RoutineSection<T>>()
        var actuales = mutableListOf<T>()
        var nombreActual = ""
        var colorActual: GroupColor? = null

        fun cerrarTanda(indice: Int) {
            if (actuales.isEmpty()) return
            val base = indice - actuales.size
            resultado +=
                RoutineSection(
                    id = "${if (nombreActual.isEmpty()) "sin-grupo" else nombreActual}-$base",
                    nombreGrupo = nombreActual,
                    color = colorActual,
                    items = actuales.toList(),
                )
            actuales = mutableListOf()
        }

        items.forEachIndexed { indice, item ->
            val nombre = grupo(item).trim()
            val color = GroupColor.resuelto(colorID(item), nombre)

            if (actuales.isEmpty() || nombreActual != nombre || colorActual != color) {
                cerrarTanda(indice)
                nombreActual = nombre
                colorActual = color
            }
            actuales += item
        }
        cerrarTanda(items.size)

        return resultado
    }
}
