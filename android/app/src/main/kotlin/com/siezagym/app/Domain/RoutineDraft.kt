package com.siezagym.app.Domain

import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.PlannedSet
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.RoutineExercise
import kotlin.math.roundToInt

/**
 * Un ejercicio mientras se arma la rutina, antes de guardarla.
 *
 * Guarda las dos formas de prescribir que acepta el modelo, igual que la web: pareja (todas las
 * series iguales, en `targetSets`/`targetReps`) y detallada (una fila por serie, en `sets`).
 * `sets` en null es la forma pareja.
 */
data class RoutineDraftExercise(
    val exerciseID: String,
    val source: ExerciseSource,
    var targetSets: Int = 3,
    var targetReps: Int = 10,
    var targetWeight: Double? = null,
    var targetRIR: Int? = null,
    var techniqueNote: String = "",
    var sets: List<PlannedSet>? = null,
    /** Bloque al que pertenece ("Entrada en calor", "Fuerza"...). Vacío es sin grupo. */
    var group: String = "",
    var groupColor: String = "",
) {
    val id: String get() = exerciseID

    /** Un ejercicio del catálogo o propio, para empezar de cero. */
    constructor(exercise: Exercise) : this(
        // Un ejercicio propio se guarda con `exerciseSource: "custom"`: la web los busca en otra
        // colección y con el origen mal no los encuentra.
        exerciseID = exercise.id,
        source = exercise.source,
        targetSets = 3,
        // En los ejercicios de tiempo, targetReps son segundos y no repeticiones.
        targetReps = if (exercise.registrationType.isTimeBased) 30 else 10,
    )

    /**
     * Una rutina que ya existe, para editarla.
     *
     * Sin pérdida: si la rampa que cargó el coach se aplastara a "4 × 10" al abrir el editor, guardar
     * sin tocar nada rompería la rutina.
     */
    constructor(item: RoutineExercise) : this(
        exerciseID = item.exerciseID,
        source =
            if (item.source == RoutineExercise.Source.CUSTOM) ExerciseSource.CUSTOM
            else ExerciseSource.CATALOG,
        targetSets = item.targetSets,
        targetReps = item.targetReps,
        targetWeight = item.targetWeight,
        targetRIR = item.targetRIR,
        techniqueNote = item.techniqueNote,
        sets = if (item.sets.isNullOrEmpty()) null else item.sets,
        group = item.group,
        groupColor = item.groupColor,
    )

    val esDetallada: Boolean get() = !sets.isNullOrEmpty()

    /**
     * Cuántas series prescribe, sea cual sea la forma. Sin tope: 0 es un estado transitorio válido
     * (el campo recién borrado, todavía escribiendo el número nuevo), no se fuerza a 1 acá — eso
     * pasa recién al guardar, en [firestoreValue].
     */
    val cantidadSeries: Int get() = if (esDetallada) sets!!.size else maxOf(0, targetSets)

    /**
     * Las repeticiones que vale una serie nueva. Vacío cuenta como 10, igual que
     * `Number(item?.targetReps) || 10` en lib/routines/prescription.js.
     */
    private val repsOEsperado: Int get() = if (targetReps > 0) targetReps else 10

    /**
     * Pasa de pareja a detallada: arranca con todas las series iguales. Es una acción a propósito y
     * no tipeo en curso, así que acá sí se garantiza al menos una fila aunque el campo haya quedado
     * en blanco.
     */
    fun detallar() {
        sets =
            (0 until maxOf(1, cantidadSeries)).map {
                PlannedSet(it + 1, targetWeight, repsOEsperado, targetRIR)
            }
    }

    /** Vuelve a pareja tomando la primera serie como referencia. */
    fun emparejar() {
        sets?.firstOrNull()?.let { primera ->
            targetSets = sets!!.size
            targetReps = primera.reps
            targetWeight = primera.weight
            targetRIR = primera.rir
        }
        sets = null
    }

    /**
     * Ajusta la cantidad de series. Las nuevas copian a la última cargada: en el gimnasio una serie
     * nueva repite o sube desde la anterior, nunca arranca vacía.
     *
     * Sin tope de arriba (no hay motivo para no poder cargar 20 series) y sin piso de 1 acá: borrar
     * el campo para escribir un número nuevo tiene que poder dejarlo en blanco un instante sin que
     * salte a "1" solo. El piso real está en [firestoreValue], al guardar.
     */
    fun cambiarCantidad(nueva: Int) {
        val total = maxOf(0, nueva)
        targetSets = total
        if (!esDetallada) return

        val filas = mutableListOf<PlannedSet>()
        sets!!.take(total).forEach { filas += it }
        while (filas.size < total) {
            val ultima = filas.lastOrNull()
            filas +=
                PlannedSet(
                    setNumber = filas.size + 1,
                    weight = ultima?.weight ?: targetWeight,
                    reps = ultima?.reps ?: targetReps,
                    rir = ultima?.rir ?: targetRIR,
                )
        }
        sets = filas.mapIndexed { indice, fila -> PlannedSet(indice + 1, fila.weight, fila.reps, fila.rir) }
    }

    /**
     * Resumen corto para la fila cerrada. Con una rampa muestra los valores uno por uno, que es
     * justo lo que se pierde al resumir como "4 × 10".
     */
    fun resumen(esDeTiempo: Boolean): String {
        val unidad = if (esDeTiempo) "s" else ""
        if (!esDetallada) return "$cantidadSeries × $targetReps$unidad"
        val reps = sets!!.map { it.reps }
        return if (reps.distinct().size == 1) "${reps.size} × ${reps[0]}$unidad"
        else reps.joinToString(" · ") + unidad
    }

    /**
     * El documento que espera Firestore, igual al que escribe la web.
     *
     * Acá sí se pisa en 1: guardar con el campo de Series en blanco no puede mandar una rutina con
     * 0 series.
     */
    fun firestoreValue(order: Int): Map<String, Any?> {
        val valor =
            mutableMapOf<String, Any?>(
                "exerciseId" to exerciseID,
                "exerciseSource" to source.raw,
                "order" to order,
                "targetSets" to maxOf(1, cantidadSeries),
                "targetReps" to repsOEsperado,
                "targetRIR" to targetRIR,
                "targetWeight" to targetWeight,
                "techniqueNote" to techniqueNote.trim(),
                "group" to group.trim(),
                "groupColor" to groupColor,
            )
        valor["sets"] =
            if (esDetallada)
                sets!!.mapIndexed { indice, serie ->
                    mapOf(
                        "setNumber" to indice + 1,
                        "weight" to serie.weight,
                        "reps" to if (serie.reps > 0) serie.reps else 10,
                        "rir" to serie.rir,
                    )
                }
            else null
        return valor
    }
}

enum class RoutineDraftValidationError(val mensaje: String) {
    // Los mismos textos que tira `createRoutine` en la web.
    MISSING_NAME("Ponele un nombre a la rutina."),
    MISSING_EXERCISES("Agregá al menos un ejercicio."),
}

class RoutineDraftException(val error: RoutineDraftValidationError) :
    Exception(error.mensaje)

/**
 * Se valida acá y no en la pantalla para que el repositorio no pueda escribir una rutina sin nombre
 * ni ejercicios aunque la llamen de otro lado.
 */
object RoutineDraftValidation {
    fun validate(name: String, exercises: List<RoutineDraftExercise>) {
        if (name.isBlank()) throw RoutineDraftException(RoutineDraftValidationError.MISSING_NAME)
        if (exercises.isEmpty())
            throw RoutineDraftException(RoutineDraftValidationError.MISSING_EXERCISES)
    }
}

/**
 * Las seis regiones musculares del filtro, iguales a las de la web: dieciséis botones no entran en
 * una fila de teléfono.
 */
enum class MuscleRegion(val label: String, val muscles: List<MuscleGroup>) {
    PECHO("Pecho", listOf(MuscleGroup.PECHO)),
    ESPALDA("Espalda", listOf(MuscleGroup.DORSAL, MuscleGroup.ESPALDA_ALTA_TRAPECIO)),
    HOMBROS(
        "Hombros",
        listOf(MuscleGroup.DELTOIDE_ANTERIOR, MuscleGroup.DELTOIDE_LATERAL, MuscleGroup.DELTOIDE_POSTERIOR),
    ),
    BRAZOS("Brazos", listOf(MuscleGroup.BICEPS, MuscleGroup.TRICEPS, MuscleGroup.ANTEBRAZO)),
    PIERNAS(
        "Piernas",
        listOf(
            MuscleGroup.CUADRICEPS,
            MuscleGroup.ISQUIOTIBIALES,
            MuscleGroup.GLUTEO,
            MuscleGroup.ADUCTORES,
            MuscleGroup.GEMELO,
        ),
    ),
    CORE("Core", listOf(MuscleGroup.ABDOMEN, MuscleGroup.LUMBAR)),
    ;

    fun incluye(ejercicio: Exercise): Boolean = muscles.any { (ejercicio.muscleWeights[it] ?: 0.0) > 0.0 }
}

object ExerciseSearch {
    /** Busca por nombre en castellano y en inglés, sin tildes ni mayúsculas. */
    fun filtrar(
        ejercicios: List<Exercise>,
        texto: String,
        region: MuscleRegion?,
    ): List<Exercise> {
        val termino = texto.trim().lowercase().normalize()
        return ejercicios.filter { ejercicio ->
            if (region != null && !region.incluye(ejercicio)) return@filter false
            if (termino.isEmpty()) return@filter true
            val heno = "${ejercicio.nameEs} ${ejercicio.nameEn}".lowercase().normalize()
            heno.contains(termino)
        }
    }
}

private fun String.normalize(): String =
    java.text.Normalizer.normalize(this, java.text.Normalizer.Form.NFD)
        .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")
        .replace("ñ", "n")

/** Una fila del reparto muscular. */
data class RepartoMuscular(val muscle: MuscleGroup, val pct: Double) {
    val orden: Int get() = MuscleGroup.entries.indexOf(muscle)
}

/**
 * Las cuentas del armador de rutinas. Viven acá y no en la vista para poder probarlas: son las
 * mismas de lib/routines/compose.js y lib/routines/summary.js en la web.
 */
object RoutineCompose {
    /**
     * Mueve un ejercicio sin tocar su prescripción ni perder las series cargadas. Un índice fuera de
     * rango devuelve la lista igual.
     */
    fun mover(
        items: List<RoutineDraftExercise>,
        origen: Int,
        destino: Int,
    ): List<RoutineDraftExercise> {
        if (origen !in items.indices || destino !in items.indices) return items
        val copia = items.toMutableList()
        val movido = copia.removeAt(origen)
        copia.add(destino, movido)
        return copia
    }

    /**
     * Reparto del esfuerzo entre músculos: series × peso de cada músculo, normalizado. Sale de
     * `muscleWeights` del catálogo, no de una estimación.
     *
     * El desempate sigue el orden de `MuscleGroup.entries` porque el sort no es estable: sin esto
     * dos pantallas con los mismos datos podrían ordenar distinto dos músculos empatados.
     */
    fun reparto(
        items: List<RoutineDraftExercise>,
        catalogo: Map<String, Exercise>,
    ): List<RepartoMuscular> {
        val crudo = LinkedHashMap<MuscleGroup, Double>()
        var total = 0.0

        for (item in items) {
            val ejercicio = catalogo[item.exerciseID] ?: continue
            val series = item.cantidadSeries.toDouble()
            for ((musculo, peso) in ejercicio.muscleWeights) {
                if (peso > 0.0) {
                    crudo[musculo] = (crudo[musculo] ?: 0.0) + series * peso
                    total += series * peso
                }
            }
        }

        if (total <= 0.0) return emptyList()
        return MuscleGroup.entries
            .mapNotNull { musculo ->
                val parte = crudo[musculo] ?: return@mapNotNull null
                if (parte <= 0.0) return@mapNotNull null
                RepartoMuscular(musculo, parte / total)
            }
            .sortedWith(
                compareByDescending<RepartoMuscular> { it.pct }.thenBy { it.orden }
            )
    }
}

/** Los ejercicios de una rutina, en el orden en que se prescriben. */
fun Routine.ejerciciosOrdenados(): List<RoutineExercise> = exercises.sortedBy { it.order }
