import Foundation
import WidgetKit

/// Lo que la app le deja escrito al widget.
///
/// El widget no puede leer Firestore, así que cada vez que la app trae datos
/// deja acá el resumen ya calculado. Si esto no se llama, el widget muestra lo
/// último que vio.
enum WidgetBridge {
    static func publicar(_ snapshot: WidgetSnapshot) {
        guard SnapshotStore.escribir(snapshot) else { return }
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Cambiar de tema tiene que repintar el widget en el momento, sin esperar
    /// a la próxima carga de datos.
    static func actualizarTema(_ id: String) {
        guard var snapshot = SnapshotStore.leer(), snapshot.themeID != id else { return }
        snapshot.themeID = id
        publicar(snapshot)
    }

    /// Al cerrar sesión: el widget no puede seguir mostrando la racha del
    /// usuario anterior en la pantalla bloqueada.
    static func limpiar() {
        SnapshotStore.borrar()
        WidgetCenter.shared.reloadAllTimelines()
    }
}
