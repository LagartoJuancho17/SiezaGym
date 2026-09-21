// `Activity` es una clase no-Sendable y sus métodos son `nonisolated async`:
// ActivityKit todavía no está migrado al modelo de Swift 6.2, así que el
// compilador ve un cruce de dominio donde no lo hay (la actividad se crea y se
// toca siempre en el main actor). `@preconcurrency` es el mecanismo previsto
// para eso: los avisos vuelven solos cuando Apple migre el módulo.
@preconcurrency import ActivityKit
import Foundation
import os

private let log = Logger(subsystem: "com.siezagym.app", category: "actividad")

/// Arranca, actualiza y termina la actividad del entrenamiento.
///
/// Una sola actividad por vez: si quedó una colgada de un entrenamiento que se
/// cortó mal, se cierra antes de abrir la nueva.
@Observable
final class LiveActivityController {
    private var activity: Activity<WorkoutActivityAttributes>?

    /// `false` cuando el usuario apagó las Live Activities en Ajustes, o en el
    /// simulador viejo. No es un error: la app sigue igual, solo sin actividad.
    var estanHabilitadas: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    func comenzar(routineName: String, startedAt: Date, themeID: String, estado: WorkoutActivityAttributes.ContentState) {
        guard estanHabilitadas else {
            log.notice("las actividades en vivo están apagadas en Ajustes")
            return
        }
        guard activity == nil else { return }
        terminarHuerfanas()

        do {
            activity = try Activity.request(
                attributes: WorkoutActivityAttributes(
                    routineName: routineName,
                    startedAt: startedAt,
                    themeID: themeID
                ),
                content: .init(state: estado, staleDate: nil),
                pushType: nil
            )
            log.notice("actividad abierta: \(routineName, privacy: .public)")
        } catch {
            // Que no se pueda mostrar la actividad no puede romper el
            // entrenamiento: se registra y se sigue.
            log.error("no se pudo abrir la actividad: \(error.localizedDescription, privacy: .public)")
        }
    }

    func actualizar(_ estado: WorkoutActivityAttributes.ContentState) {
        guard let activity else { return }
        Task { await activity.update(.init(state: estado, staleDate: nil)) }
    }

    /// Al terminar o al salir. `.immediate` porque la actividad ya no dice nada
    /// útil: el entrenamiento se guardó o se descartó.
    func terminar(_ estado: WorkoutActivityAttributes.ContentState? = nil) {
        guard let activity else { return }
        self.activity = nil
        Task {
            let contenido = estado.map { ActivityContent(state: $0, staleDate: nil) }
            await activity.end(contenido, dismissalPolicy: .immediate)
        }
    }

    /// Una actividad sobrevive a que la app se cierre. Si el entrenamiento se
    /// cortó por un crash, la anterior sigue viva en la pantalla bloqueada.
    private func terminarHuerfanas() {
        for vieja in Activity<WorkoutActivityAttributes>.activities {
            Task { await vieja.end(nil, dismissalPolicy: .immediate) }
        }
    }
}
