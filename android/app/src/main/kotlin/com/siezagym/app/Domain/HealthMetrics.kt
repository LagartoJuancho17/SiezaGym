package com.siezagym.app.Domain

import java.util.Locale
import kotlin.math.roundToInt

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

        /**
         * Traduce los agregados del día que devuelve Health Connect a lo que muestra la portada.
         * Puro, para poder testearlo sin un teléfono con Health Connect.
         */
        fun fromDailyTotals(
            steps: Long,
            distanceMeters: Double,
            activeCaloriesKcal: Double,
        ): HealthMetrics =
            HealthMetrics(
                activeEnergyKcal = activeCaloriesKcal.roundToInt(),
                steps = steps.toInt(),
                distanceKm = distanceMeters / 1000.0,
                hasData = steps > 0 || distanceMeters > 0 || activeCaloriesKcal > 0,
            )
    }
}
