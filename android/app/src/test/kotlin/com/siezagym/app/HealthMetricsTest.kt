package com.siezagym.app

import com.siezagym.app.Domain.HealthMetrics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

/** El resumen diario de Health Connect, separado de las métricas de entrenamiento de SiezaGym. */
class HealthMetricsTest {
    @Test
    fun elVacioNoTieneDatos() {
        assertFalse(HealthMetrics.empty.hasData)
        assertEquals("0 kcal", HealthMetrics.empty.caloriesLabel)
    }

    @Test
    fun losPasosSeMuestranConSeparadorDeMiles() {
        val metricas = HealthMetrics(0, steps = 12345, distanceKm = 0.0, hasData = true)
        assertEquals("12.345", metricas.stepsLabel)
    }

    @Test
    fun laDistanciaSeMuestraConDosDecimalesYEnKilometros() {
        val metricas = HealthMetrics(0, steps = 0, distanceKm = 5.5, hasData = true)
        assertEquals("5,50 km", metricas.distanceLabel)
    }

    @Test
    fun lasCaloriasSeMuestranEnKcal() {
        val metricas = HealthMetrics(activeEnergyKcal = 420, steps = 0, distanceKm = 0.0, hasData = true)
        assertEquals("420 kcal", metricas.caloriesLabel)
    }
}
