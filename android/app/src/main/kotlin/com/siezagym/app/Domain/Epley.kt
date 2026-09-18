package com.siezagym.app.Domain

import com.siezagym.app.Models.LoggedSet

/** 1RM estimado por la fórmula de Epley: w * (1 + reps/30). Exacto en reps = 1. */
object Epley {
    fun estimatedOneRepMax(weight: Double, reps: Int): Double {
        if (weight <= 0 || reps <= 0) return 0.0
        if (reps == 1) return weight
        return weight * (1 + reps / 30.0)
    }

    fun estimatedOneRepMax(set: LoggedSet): Double =
        estimatedOneRepMax(weight = set.weight, reps = set.reps)

    /** Mejor serie de un conjunto por 1RM estimado. Ignora las falladas. */
    fun bestSet(sets: List<LoggedSet>): LoggedSet? =
        sets
            .filter { !it.failed && estimatedOneRepMax(it) > 0 }
            .maxByOrNull { estimatedOneRepMax(it) }

    /** Peso máximo real levantado, sin estimar nada. Ignora las falladas. */
    fun maxWeight(sets: List<LoggedSet>): Double =
        sets.filter { !it.failed }.maxOfOrNull { it.weight } ?: 0.0
}