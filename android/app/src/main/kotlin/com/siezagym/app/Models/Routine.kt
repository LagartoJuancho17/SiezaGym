package com.siezagym.app.Models

import com.siezagym.app.Services.FirestoreValue
import java.time.ZonedDateTime

/** Firestore devuelve `Map<String, Any>`, pero guardar datos como `Map<String, Any?>`
 *  facilita la lectura de campos opcionales. Convierte cualquier map de Firestore. */
fun Map<*, *>.firestoreMap(): Map<String, Any?> =
    entries.associate { (key, value) -> (key as? String ?: return@associate key.toString() to value) to value }

/** Una serie prescrita dentro de una rutina (lo que el plan dice que hay que hacer). */
data class PlannedSet(
    val setNumber: Int,
    val weight: Double?,
    val reps: Int,
    val rir: Int?,
)

/** Un ejercicio dentro de una rutina, con sus objetivos. */
data class RoutineExercise(
    val exerciseID: String,
    val source: Source,
    val order: Int,
    val targetSets: Int,
    val targetReps: Int,
    val targetRIR: Int?,
    val targetWeight: Double?,
    val techniqueNote: String,
    /** Series individuales cuando el coach las prescribió una por una. */
    val sets: List<PlannedSet>?,
) {
    val id: String get() = "$order-$exerciseID"

    enum class Source { CATALOG, CUSTOM }

    companion object {
        fun fromFirestore(order: Int, data: Map<String, Any?>): RoutineExercise {
            val source = if ((data["exerciseSource"] as? String) == "custom") Source.CUSTOM else Source.CATALOG
            val sets = (data["sets"] as? List<*>)?.mapIndexedNotNull { index, item ->
                (item as? Map<*, *>)?.let { set ->
                    PlannedSet(
                        setNumber = FirestoreValue.int(set["setNumber"]) ?: index + 1,
                        weight = FirestoreValue.double(set["weight"]),
                        reps = FirestoreValue.int(set["reps"]) ?: 10,
                        rir = FirestoreValue.int(set["rir"]),
                    )
                }
            }
            return RoutineExercise(
                exerciseID = data["exerciseId"] as? String ?: "",
                source = source,
                order = FirestoreValue.int(data["order"]) ?: order,
                targetSets = FirestoreValue.int(data["targetSets"]) ?: 3,
                targetReps = FirestoreValue.int(data["targetReps"]) ?: 10,
                targetRIR = FirestoreValue.int(data["targetRIR"]),
                targetWeight = FirestoreValue.double(data["targetWeight"]),
                techniqueNote = data["techniqueNote"] as? String ?: "",
                sets = sets,
            )
        }
    }
}

data class Routine(
    val id: String,
    val ownerID: String,
    val name: String,
    val note: String,
    val exercises: List<RoutineExercise>,
    val showOnHome: Boolean,
    val lastUsedAt: ZonedDateTime?,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    /** Las rutinas asignadas por un coach no se editan desde la app del alumno. */
    val isAssigned: Boolean,
) {
    val totalSets: Int get() = exercises.sumOf { it.targetSets }

    /** Fecha con la que la rutina se ubica en el calendario: primero cuando la
     *  asignaron, si no cuando se creó, si no el último uso. */
    val referenceDate: ZonedDateTime? get() = createdAt ?: lastUsedAt

    companion object {
        fun fromFirestore(id: String, data: Map<String, Any?>): Routine {
            val createdAt = FirestoreValue.date(data["assignedAt"]) ?: FirestoreValue.date(data["createdAt"])
            return Routine(
                id = id,
                isAssigned = false,
                ownerID = data["ownerId"] as? String ?: data["studentId"] as? String ?: "",
                name = data["name"] as? String ?: data["routineName"] as? String ?: "",
                note = data["note"] as? String ?: "",
                showOnHome = FirestoreValue.bool(data["showOnHome"]) ?: true,
                lastUsedAt = FirestoreValue.date(data["lastUsedAt"]),
                createdAt = createdAt,
                updatedAt = FirestoreValue.date(data["updatedAt"]),
                exercises = (data["exercises"] as? List<*> ?: emptyList())
                    .mapIndexed { index, item ->
                        RoutineExercise.fromFirestore(index, (item as? Map<*, *>)?.firestoreMap() ?: emptyMap())
                    }
                    .sortedBy { it.order },
            )
        }

        fun fromFirestore(id: String, data: Map<String, Any?>, isAssigned: Boolean): Routine =
            fromFirestore(id, data).copy(isAssigned = isAssigned)
    }
}