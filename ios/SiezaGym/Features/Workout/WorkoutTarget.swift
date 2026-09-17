import Foundation

/// Lo que se va a entrenar: una rutina, o nada y es entrenamiento libre.
///
/// Es Identifiable para poder abrir la pantalla de entrenamiento con
/// `fullScreenCover(item:)`, que necesita una identidad estable.
struct WorkoutTarget: Hashable, Identifiable {
    let routine: Routine?
    var id: String { routine?.id ?? "libre" }
}
