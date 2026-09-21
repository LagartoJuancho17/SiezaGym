import Foundation
import Testing
@testable import SiezaGym

@Suite("Configuración de HealthKit")
struct HealthKitConfigurationTests {
    @Test("el bundle de la app declara el motivo de lectura")
    func usageDescriptionExists() {
        let description = Bundle(identifier: "com.siezagym.app")?
            .object(forInfoDictionaryKey: "NSHealthShareUsageDescription") as? String

        #expect(description?.isEmpty == false)
    }
}
