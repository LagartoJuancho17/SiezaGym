import Testing
@testable import SiezaGym

@Suite("Métricas de Apple Salud")
struct HealthMetricsTests {
    @Test("formatea los tres datos del día")
    func labels() {
        let metrics = HealthMetrics(activeEnergyKcal: 428, steps: 9_531, distanceKm: 6.25, hasData: true)

        #expect(metrics.caloriesLabel == "428 kcal")
        #expect(metrics.stepsLabel == "9.531")
        #expect(metrics.distanceLabel == "6,25 km")
    }

    @Test("el resumen vacío no inventa actividad")
    func empty() {
        #expect(!HealthMetrics.empty.hasData)
        #expect(HealthMetrics.empty.activeEnergyKcal == 0)
        #expect(HealthMetrics.empty.steps == 0)
        #expect(HealthMetrics.empty.distanceKm == 0)
    }
}
