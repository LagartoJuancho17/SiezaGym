import Foundation

/// Resumen diario que llega desde Apple Salud/Fitness. Los valores son del día
/// actual y permanecen separados de las métricas de entrenamiento de SiezaGym.
nonisolated struct HealthMetrics: Equatable, Sendable {
    let activeEnergyKcal: Int
    let steps: Int
    let distanceKm: Double
    let hasData: Bool

    static let empty = HealthMetrics(activeEnergyKcal: 0, steps: 0, distanceKm: 0, hasData: false)

    var caloriesLabel: String { "\(activeEnergyKcal) kcal" }
    var stepsLabel: String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "es_AR")
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: steps)) ?? "\(steps)"
    }

    var distanceLabel: String {
        String(format: "%.2f km", locale: Locale(identifier: "es_AR"), distanceKm)
    }
}
