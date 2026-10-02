import SwiftUI
import UIKit
import WebKit

/// Un video de YouTube reproducido adentro de la app, sin abrir YouTube ni
/// Safari.
///
/// Es un `WKWebView` con el embed de youtube-nocookie. Dos detalles que no se
/// ven y lo hacen andar:
/// - `allowsInlineMediaPlayback`: sin esto, apretar play salta a pantalla
///   completa. Con esto el video se ve en la hoja, y el botón de pantalla
///   completa del reproductor sigue estando.
/// - El HTML se carga con un origen https (`YouTubeLink.origenReproductor`):
///   sin origen YouTube responde "Error 153" y no reproduce.
///
/// Cualquier link que el reproductor intente abrir en la página principal
/// ("Ver en YouTube", el logo) se manda a la app de YouTube o a Safari, en vez
/// de reemplazar el video adentro de la hoja.
struct ReproductorYouTube: View {
    @Environment(\.tema) private var tema
    let url: URL
    @State private var cargando = true

    private var id: String? { YouTubeLink.id(de: url.absoluteString) }

    var body: some View {
        Group {
            if let id, let html = YouTubeLink.embedHTML(paraID: id) {
                VistaWeb(html: html, cargando: $cargando)
                    .overlay {
                        if cargando {
                            ProgressView().tint(.white)
                        }
                    }
            } else {
                // Un link guardado que no es de YouTube: no hay qué embeber,
                // queda el link para abrirlo afuera.
                Link(destination: url) {
                    Label("Abrir el video", systemImage: "play.rectangle.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(tema.texto)
                }
            }
        }
        .aspectRatio(16 / 9, contentMode: .fit)
        .frame(maxWidth: .infinity)
        .background(Color.black, in: .rect(cornerRadius: 16))
        .clipShape(.rect(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(tema.borde, lineWidth: 1) }
        .accessibilityLabel("Video del ejercicio")
    }
}

private struct VistaWeb: UIViewRepresentable {
    let html: String
    @Binding var cargando: Bool

    func makeCoordinator() -> Coordinator { Coordinator(cargando: $cargando) }

    func makeUIView(context: Context) -> WKWebView {
        let configuracion = WKWebViewConfiguration()
        configuracion.allowsInlineMediaPlayback = true
        configuracion.allowsPictureInPictureMediaPlayback = true

        let vista = WKWebView(frame: .zero, configuration: configuracion)
        vista.isOpaque = false
        vista.backgroundColor = .black
        vista.scrollView.backgroundColor = .black
        vista.scrollView.isScrollEnabled = false
        vista.navigationDelegate = context.coordinator
        vista.uiDelegate = context.coordinator
        vista.loadHTMLString(html, baseURL: URL(string: YouTubeLink.origenReproductor))
        context.coordinator.htmlCargado = html
        return vista
    }

    func updateUIView(_ vista: WKWebView, context: Context) {
        // Solo se recarga si cambió el video: recargar en cada redibujo
        // cortaría la reproducción.
        guard context.coordinator.htmlCargado != html else { return }
        context.coordinator.htmlCargado = html
        vista.loadHTMLString(html, baseURL: URL(string: YouTubeLink.origenReproductor))
    }

    static func dismantleUIView(_ vista: WKWebView, coordinator: Coordinator) {
        // Cerrar la hoja tiene que cortar el audio, no dejarlo sonando.
        vista.stopLoading()
        vista.loadHTMLString("", baseURL: nil)
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        @Binding var cargando: Bool
        var htmlCargado: String?

        init(cargando: Binding<Bool>) {
            _cargando = cargando
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            cargando = false
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: any Error) {
            cargando = false
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void
        ) {
            // El iframe navega solo (es el reproductor): eso se deja. La
            // página principal solo carga nuestro HTML; un link que quiera
            // reemplazarla sale de la app.
            let esPaginaPrincipal = navigationAction.targetFrame?.isMainFrame ?? true
            let esNuestroHTML = navigationAction.request.url?.absoluteString.hasPrefix(YouTubeLink.origenReproductor) == true
                || navigationAction.request.url?.scheme == "about"
            if esPaginaPrincipal, !esNuestroHTML, let url = navigationAction.request.url {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        // Los links con target="_blank" llegan acá: también salen de la app.
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url { UIApplication.shared.open(url) }
            return nil
        }
    }
}

/// La técnica de un ejercicio: el video de YouTube (reproducido acá adentro)
/// o el GIF, y las instrucciones. La abren el entrenamiento y el detalle de
/// la rutina al tocar la miniatura.
struct TecnicaSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let nombre: String
    let gif: URL?
    let video: URL?
    let descripcion: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let video {
                        ReproductorYouTube(url: video)
                    }

                    if let gif, video == nil {
                        GIFAnimado(url: gif)
                            .aspectRatio(1, contentMode: .fit)
                            .frame(maxWidth: .infinity, maxHeight: 320)
                            .background(Color.white, in: .rect(cornerRadius: 16))
                            .clipShape(.rect(cornerRadius: 16))
                    }

                    if let descripcion, !descripcion.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Instrucciones")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(tema.texto2)
                                .textCase(.uppercase)
                            Text(descripcion)
                                .font(.system(size: 14))
                                .foregroundStyle(tema.texto)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(tema.vidrio(2), in: .rect(cornerRadius: 12))
                    }

                    if let video {
                        // Por si alguien prefiere la app de YouTube: queda
                        // como opción chica, no como el camino principal.
                        Link(destination: video) {
                            Label("Abrir en YouTube", systemImage: "arrow.up.right.square")
                                .font(.system(size: 13))
                                .foregroundStyle(tema.texto2)
                        }
                    }
                }
                .padding(16)
            }
            .background { Backdrop() }
            .navigationTitle(nombre)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(tema.texto)
                }
            }
        }
        .presentationDetents(video != nil ? [.large] : [.medium, .large])
    }
}
