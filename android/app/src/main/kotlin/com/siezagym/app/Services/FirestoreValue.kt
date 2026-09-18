package com.siezagym.app.Services

import com.google.firebase.Timestamp
import com.siezagym.app.Domain.TrainingCalendar
import java.time.Instant
import java.time.ZonedDateTime

/** Firestore devuelve números como `Number` (a veces un `Double` 3.0) y fechas como
 *  `Timestamp`. Los casts directos (`Int` sobre un 3.0, `Double` sobre un 3) fallan de
 *  forma silenciosa y dejan ceros en la UI, así que todo pasa por acá. */
object FirestoreValue {
    fun double(value: Any?): Double? = when (value) {
        is Number -> value.toDouble()
        is String -> value.toDoubleOrNull()
        else -> null
    }

    fun int(value: Any?): Int? = when (value) {
        is Number -> value.toInt()
        is String -> value.toIntOrNull()
        else -> null
    }

    fun bool(value: Any?): Boolean? = value as? Boolean

    /** Las fechas siempre se interpretan en la zona de Argentina, igual que en la web. */
    fun date(value: Any?): ZonedDateTime? = when (value) {
        is Timestamp -> value.toDate().toInstant().atZone(TrainingCalendar.zone)
        is java.util.Date -> value.toInstant().atZone(TrainingCalendar.zone)
        is Instant -> value.atZone(TrainingCalendar.zone)
        is ZonedDateTime -> value.withZoneSameInstant(TrainingCalendar.zone)
        is String -> runCatching { Instant.parse(value).atZone(TrainingCalendar.zone) }.getOrNull()
        else -> null
    }
}