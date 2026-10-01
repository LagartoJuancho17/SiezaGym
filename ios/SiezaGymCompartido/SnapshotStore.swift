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
    private static let service = "com.siezagym.widget"
    private static let account = "snapshot"

    /// Sin el grupo: sirve para encontrar y borrar un ítem viejo escrito antes
    /// de tener el grupo compartido bien armado (o por una versión anterior de
    /// la app), que si no un alta filtrada por grupo nunca lo ve.
    private static var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func leer() -> WidgetSnapshot? {
        var consulta = baseQuery
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

        // Borra cualquier ítem viejo primero, sin filtrar por grupo: un
        // `SecItemUpdate` filtrado por grupo no encuentra un ítem escrito antes
        // de tener el grupo compartido bien armado (o por una versión anterior
        // de la app), y el alta siguiente choca con errSecDuplicateItem contra
        // ese ítem fantasma — el widget se queda leyendo vacío para siempre.
        // Crear siempre de cero es a prueba de esa cola.
        SecItemDelete(baseQuery as CFDictionary)

        // Los dos targets firman con el mismo y único keychain-access-groups.
        // Sin kSecAttrAccessGroup, iOS usa ese primer grupo completo, incluido
        // el prefijo del equipo. Escribir el nombre sin prefijo da -34018.
        let creado = SecItemAdd(baseQuery.merging(atributos) { _, nuevo in nuevo } as CFDictionary, nil)
        if creado != errSecSuccess {
            log.error("no se pudo crear el snapshot: \(creado, privacy: .public)")
        }
        return creado == errSecSuccess
    }

    /// Al cerrar sesión: el widget no puede seguir mostrando los datos del
    /// usuario anterior. Sin filtrar por grupo, por la misma cola que
    /// `escribir`: tiene que borrar cualquier ítem que haya, esté en el grupo
    /// que esté.
    static func borrar() {
        SecItemDelete(baseQuery as CFDictionary)
    }
}
