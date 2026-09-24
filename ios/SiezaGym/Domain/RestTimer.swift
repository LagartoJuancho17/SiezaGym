import Foundation

/// El descanso entre series.
///
/// Vive acá y no dentro de la vista porque son reglas, no dibujo: cuánto
/// arranca, cómo baja, dónde corta. Metido en `WorkoutView` no se podía probar
/// ninguna sin abrir la app y esperar un minuto y medio.
nonisolated struct RestTimer: Equatable, Sendable {
    /// Lo que arranca al marcar una serie.
    ///
    /// **No es `RoutineSummary.secondsPerRest` (75) a propósito.** Ese número
    /// es el de la web y solo sirve para estimar cuánto dura una rutina; los
    /// dos clientes tienen que decir lo mismo. Este es el descanso real que
    /// propone la app, y se puede cambiar sin tocar esa estimación.
    static let porDefecto = 90

    /// Cuánto suma y resta cada botón.
    static let paso = (menos: 15, mas: 30)

    /// Segundos que faltan. `nil` es que no hay descanso en curso.
    private(set) var restantes: Int?

    init(restantes: Int? = nil) {
        self.restantes = restantes
    }

    var corriendo: Bool { (restantes ?? 0) > 0 }

    /// Texto del reloj, "01:30".
    var texto: String {
        let segundos = max(0, restantes ?? 0)
        return String(format: "%02d:%02d", segundos / 60, segundos % 60)
    }

    mutating func arrancar(_ segundos: Int = porDefecto) {
        restantes = max(1, segundos)
    }

    mutating func saltar() {
        restantes = nil
    }

    /// Restar nunca lleva a cero: si quedan 10 segundos y tocás −15, el
    /// descanso no se termina solo, se termina cuando vos lo saltás.
    mutating func restar(_ segundos: Int = paso.menos) {
        guard let actual = restantes else { return }
        restantes = max(1, actual - segundos)
    }

    mutating func sumar(_ segundos: Int = paso.mas) {
        guard let actual = restantes else { return }
        restantes = actual + segundos
    }

    /// Un segundo menos. Devuelve `true` solo en el segundo en que el descanso
    /// se termina, que es cuando hay que sonar el aviso: si devolviera `true`
    /// mientras está en cero, sonaría en loop.
    @discardableResult
    mutating func tick() -> Bool {
        guard let actual = restantes, actual > 0 else { return false }
        if actual <= 1 {
            restantes = nil
            return true
        }
        restantes = actual - 1
        return false
    }
}
