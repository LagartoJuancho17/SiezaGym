package com.siezagym.app.Domain

import java.util.Locale

/**
 * Resumen diario que llega desde Health Connect, el equivalente de Apple Salud en Android. Los
 * valores son del día actual y permanecen separados de las métricas de entrenamiento de SiezaGym.
 */
data class HealthMetrics(
    val activeEnergyKcal: Int,
    val steps: Int,
    val distanceKm: Double,
    val hasData: Boolean,
) {
    val caloriesLabel: String get() = "$activeEnergyKcal kcal"

    val stepsLabel: String
        get() = String.format(Locale.forLanguageTag("es-AR"), "%,d", steps)

    val distanceLabel: String
        get() = String.format(Locale.forLanguageTag("es-AR"), "%.2f km", distanceKm)

    companion object {
        val empty = HealthMetrics(0, 0, 0.0, hasData = false)
    }
}
