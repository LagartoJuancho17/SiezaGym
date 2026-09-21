import Foundation
import HealthKit
import Observation

/// Lee el resumen del día desde Apple Salud. Solo solicita permisos de lectura:
/// SiezaGym no escribe entrenamientos, pasos ni calorías en Salud.
@MainActor
@Observable
final class HealthKitService {
    private enum HealthKitError: LocalizedError {
        case unavailable
        case missingType

        var errorDescription: String? {
            switch self {
            case .unavailable:
                "Apple Salud no está disponible en este dispositivo."
            case .missingType:
                "Este iPhone no expone uno de los datos de actividad solicitados."
            }
        }
    }

    private let healthStore = HKHealthStore()
    private let connectedKey = "healthKit.connected"

    private(set) var summary = HealthMetrics.empty
    private(set) var isConnected: Bool
    private(set) var isRequestingPermission = false
    private(set) var errorMessage: String?

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    init() {
        isConnected = UserDefaults.standard.bool(forKey: connectedKey)
    }

    func connect() async {
        guard isAvailable else {
            errorMessage = HealthKitError.unavailable.localizedDescription
            return
        }

        isRequestingPermission = true
        errorMessage = nil
        defer { isRequestingPermission = false }

        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            isConnected = true
            UserDefaults.standard.set(true, forKey: connectedKey)
            await refresh()
        } catch {
            errorMessage = "No se pudo conectar con Apple Fitness. Revisá el permiso en Ajustes > Salud."
        }
    }

    func refreshIfConnected() async {
        guard isConnected else { return }
        await refresh()
    }

    private func refresh() async {
        guard isAvailable else {
            errorMessage = HealthKitError.unavailable.localizedDescription
            return
        }

        do {
            async let calories = total(
                for: .activeEnergyBurned,
                unit: .kilocalorie()
            )
            async let steps = total(
                for: .stepCount,
                unit: .count()
            )
            async let distance = total(
                for: .distanceWalkingRunning,
                unit: .meterUnit(with: .kilo)
            )

            let (caloriesValue, stepsValue, distanceValue) = try await (calories, steps, distance)
            summary = HealthMetrics(
                activeEnergyKcal: Int(caloriesValue.rounded()),
                steps: Int(stepsValue.rounded()),
                distanceKm: distanceValue,
                hasData: caloriesValue > 0 || stepsValue > 0 || distanceValue > 0
            )
            errorMessage = nil
        } catch {
            errorMessage = "No pudimos leer tus datos de Apple Fitness. Revisá los permisos en Ajustes > Salud > Apps > SiezaGym."
        }
    }

    private var readTypes: Set<HKObjectType> {
        Set([
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            HKObjectType.quantityType(forIdentifier: .stepCount),
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning),
        ].compactMap { $0 })
    }

    private func total(
        for identifier: HKQuantityTypeIdentifier,
        unit: HKUnit
    ) async throws -> Double {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else {
            throw HealthKitError.missingType
        }

        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(
            withStart: start,
            end: Date(),
            options: .strictStartDate
        )

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    let value = statistics?.sumQuantity()?.doubleValue(for: unit) ?? 0
                    continuation.resume(returning: value)
                }
            }
            healthStore.execute(query)
        }
    }
}
