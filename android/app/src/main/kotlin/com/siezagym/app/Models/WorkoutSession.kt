package com.siezagym.app.Models

import com.siezagym.app.Services.FirestoreValue
import java.time.ZonedDateTime

/** Una serie efectivamente ejecutada y registrada. */
data class LoggedSet(
    val setNumber: Int,
    val weight: Double,
    val reps: Int,
    val rir: Int?,
    /** Serie fallada: no suma volumen ni cuenta para intensidad. */
    val failed: Boolean,
) {
    val volumeKg: Double get() = if (failed) 0.0 else weight * reps

    fun firestoreValue(): Map<String, Any?> {
        val payload = mutableMapOf(
            "setNumber" to setNumber,
            "weight" to weight,
            "reps" to reps,
            "failed" to failed,
        )
        if (rir != null) payload["rir"] = rir
        return payload
    }

    companion object {
        fun fromFirestore(index: Int, data: Map<String, Any?>): LoggedSet = LoggedSet(
            setNumber = FirestoreValue.int(data["setNumber"]) ?: index + 1,
            weight = FirestoreValue.double(data["weight"]) ?: 0.0,
            reps = FirestoreValue.int(data["reps"]) ?: 0,
            rir = FirestoreValue.int(data["rir"]),
            failed = FirestoreValue.bool(data["failed"]) ?: false,
        )
    }
}

data class LoggedExercise(
    val exerciseID: String,
    val sets: List<LoggedSet>,
) {
    val volumeKg: Double get() = sets.sumOf { it.volumeKg }
}

data class WorkoutSession(
    val id: String,
    val userID: String,
    val routineName: String?,
    val routineID: String?,
    val startedAt: ZonedDateTime?,
    val finishedAt: ZonedDateTime?,
    val durationSeconds: Int,
    val exercises: List<LoggedExercise>,
    val totalVolumeKg: Double,
    val totalSetsCompleted: Int,
) {
    companion object {
        fun fromFirestore(id: String, data: Map<String, Any?>): WorkoutSession = WorkoutSession(
            id = id,
            userID = data["userId"] as? String ?: "",
            routineName = data["routineName"] as? String,
            routineID = (data["source"] as? Map<*, *>)?.get("routineId") as? String,
            startedAt = FirestoreValue.date(data["startedAt"]),
            finishedAt = FirestoreValue.date(data["finishedAt"]),
            durationSeconds = FirestoreValue.int(data["durationSeconds"]) ?: 0,
            totalVolumeKg = FirestoreValue.double(data["totalVolumeKg"]) ?: 0.0,
            totalSetsCompleted = FirestoreValue.int(data["totalSetsCompleted"]) ?: 0,
            exercises = (data["exercises"] as? List<*> ?: emptyList()).map { item ->
                val itemMap = (item as? Map<*, *>)?.firestoreMap() ?: return@map LoggedExercise("", emptyList())
                LoggedExercise(
                    exerciseID = itemMap["exerciseId"] as? String ?: "",
                    sets = (itemMap["sets"] as? List<*> ?: emptyList()).mapIndexed { index, set ->
                        LoggedSet.fromFirestore(index, (set as? Map<*, *>)?.firestoreMap() ?: emptyMap())
                    },
                )
            },
        )
    }
}