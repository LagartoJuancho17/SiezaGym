package com.siezagym.app

import com.siezagym.app.Domain.HealthMetrics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
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

    @Test
    fun losAgregadosDeHealthConnectSeTraducenAMetricas() {
        val metricas = HealthMetrics.fromDailyTotals(steps = 8123, distanceMeters = 6100.0, activeCaloriesKcal = 512.4)
        assertEquals(8123, metricas.steps)
        assertEquals(512, metricas.activeEnergyKcal)
        assertEquals("6,10 km", metricas.distanceLabel)
        assertTrue(metricas.hasData)
    }

    @Test
    fun unDiaSinActividadNoTieneDatos() {
        val metricas = HealthMetrics.fromDailyTotals(steps = 0, distanceMeters = 0.0, activeCaloriesKcal = 0.0)
        assertFalse(metricas.hasData)
        assertEquals("0 kcal", metricas.caloriesLabel)
    }

    @Test
    fun losMetrosSeConviertenAKilometros() {
        val metricas = HealthMetrics.fromDailyTotals(steps = 1, distanceMeters = 2500.0, activeCaloriesKcal = 0.0)
        assertEquals(2.5, metricas.distanceKm, 0.0001)
    }
}
