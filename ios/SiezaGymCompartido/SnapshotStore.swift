import Foundation
import Security
import os

private nonisolated let log = Logger(subsystem: "com.siezagym.app", category: "widget")

/// El puente de datos entre la app y el widget.
///
/// Lo normal sería un App Group, pero **la cuenta de desarrollador es gratuita
/// y Apple no habilita App Groups en un equipo personal**: el provisioning
/// rechaza `com.apple.security.application-groups`. Lo que sí habilita, y está
/// en el perfil, es un grupo de llavero compartido. Así que el snapshot viaja
/// como un item genérico del llavero con `kSecAttrAccessGroup`.
///
/// Con una cuenta paga esto se reemplaza por `UserDefaults(suiteName:)` y se
/// borra el resto del archivo; el resto del widget no cambia.
nonisolated enum SnapshotStore {
    /// Tiene que coincidir con `keychain-access-groups` de los dos targets, sin
    /// el prefijo del equipo (que iOS agrega solo).
    static let accessGroup = "com.siezagym.compartido"
    private static let service = "com.siezagym.widget"
    private static let account = "snapshot"

    private static var query: [String: Any] {
        var consulta: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        // El simulador firma ad-hoc y no lleva el entitlement, así que pedir el
        // grupo devuelve -34018 (errSecMissingEntitlement) y no se guarda nada.
        // Ahí no hace falta: todas las apps del simulador comparten un llavero.
        #if !targetEnvironment(simulator)
        consulta[kSecAttrAccessGroup as String] = accessGroup
        #endif
        return consulta
    }

    static func leer() -> WidgetSnapshot? {
        var consulta = query
        consulta[kSecReturnData as String] = true
        consulta[kSecMatchLimit as String] = kSecMatchLimitOne

        var resultado: CFTypeRef?
        let estado = SecItemCopyMatching(consulta as CFDictionary, &resultado)
        guard estado == errSecSuccess, let datos = resultado as? Data else {
            if estado != errSecItemNotFound {
                log.error("llavero no devolvió el snapshot: \(estado, privacy: .public)")
            }
            return nil
        }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: datos)
    }

    @discardableResult
    static func escribir(_ snapshot: WidgetSnapshot) -> Bool {
        guard let datos = try? JSONEncoder().encode(snapshot) else { return false }

        // `AfterFirstUnlock` y no `WhenUnlocked`: el widget de la pantalla
        // bloqueada tiene que poder leerlo con el teléfono trabado.
        let atributos: [String: Any] = [
            kSecValueData as String: datos,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]

        let actualizado = SecItemUpdate(query as CFDictionary, atributos as CFDictionary)
        if actualizado == errSecSuccess { return true }

        guard actualizado == errSecItemNotFound else {
            log.error("no se pudo actualizar el snapshot: \(actualizado, privacy: .public)")
            return false
        }

        let creado = SecItemAdd(query.merging(atributos) { _, nuevo in nuevo } as CFDictionary, nil)
        if creado != errSecSuccess {
            log.error("no se pudo crear el snapshot: \(creado, privacy: .public)")
        }
        return creado == errSecSuccess
    }

    /// Al cerrar sesión: el widget no puede seguir mostrando los datos del
    /// usuario anterior.
    static func borrar() {
        SecItemDelete(query as CFDictionary)
    }
}
