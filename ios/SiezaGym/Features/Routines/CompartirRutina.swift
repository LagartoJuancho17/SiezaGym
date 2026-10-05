import Observation
import SwiftUI
import UIKit

/// El link de rutina que abrió la app (siezagym://r/<id>), esperando a que haya
/// sesión para mostrarlo. Si el link llega con la app en el login, queda acá
/// hasta que `MainTabView` aparece.
@Observable
@MainActor
final class EnlacesEntrantes {
    static let compartido = EnlacesEntrantes()
    var rutina: RutinaPendiente?

    struct RutinaPendiente: Identifiable, Equatable {
        let id: String
    }

    /// Devuelve true si la URL era un link de rutina.
    func abrir(_ url: URL) -> Bool {
        guard let id = EnlaceCompartido.id(de: url) else { return false }
        rutina = RutinaPendiente(id: id)
        return true
    }
}

/// Carga la rutina de un link y muestra la hoja para copiarla.
struct RutinaCompartidaSheet: View {
    @Environment(\.tema) private var tema
    let id: String
    let store: GymStore
    var api = WebAPI()

    @State private var rutina: RutinaParaCopiar?
    @State private var error: String?

    var body: some View {
        Group {
            if let rutina {
                CopiarRutinaSheet(store: store, rutina: rutina)
            } else {
                ZStack {
                    Backdrop()
                    if let error {
                        Vacio(texto: error, accion: ("Reintentar", { Task { await cargar() } }))
                            .padding(24)
                    } else {
                        ProgressView().tint(tema.texto)
                    }
                }
            }
        }
        .task { await cargar() }
    }

    private func cargar() async {
        error = nil
        do {
            rutina = try await api.rutinaCompartida(id: id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// La hoja de compartir del sistema (WhatsApp, Mensajes, copiar...).
struct HojaCompartir: UIViewControllerRepresentable {
    let elementos: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: elementos, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

/// El link listo para pasar a la hoja de compartir.
struct LinkCompartido: Identifiable {
    let url: URL
    let nombre: String
    var id: String { url.absoluteString }
}
