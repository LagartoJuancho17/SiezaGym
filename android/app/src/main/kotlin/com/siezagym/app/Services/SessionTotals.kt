package com.siezagym.app.Services

import com.siezagym.app.Models.LoggedExercise
import kotlin.math.roundToLong

/** Firestore stores kilograms, rounded once to two decimal places. */
object SessionTotals {
    fun documentId(uid: String, startedAt: java.time.Instant): String =
        java.util.UUID.nameUUIDFromBytes("$uid:$startedAt".toByteArray(Charsets.UTF_8)).toString()

    fun volumeKg(exercises: List<LoggedExercise>): Double =
        (exercises.sumOf { it.volumeKg } * 100).roundToLong() / 100.0
}
