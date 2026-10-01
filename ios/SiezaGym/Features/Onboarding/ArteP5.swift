import SwiftUI
import UIKit
import WebKit

/// El arte del onboarding dibujado con p5.js: un shader que calcula cada píxel
/// real de la pantalla (3x en iPhone), así la mancha, el vidrio acanalado y el
/// grano se ven nítidos. Antes era un `Canvas` de SwiftUI con grano de 1 punto
/// (3x3 píxeles) y se veía pixelado.
///
/// El boceto vive en `Resources/ArteOnboarding/` junto con p5 (LGPL-2.1, licencia
/// en `p5-license.txt`), todo dentro de la app: no necesita conexión. La
/// posición de la mancha de cada pantalla la decide Swift
/// (`ArteOnboarding.mancha`) y se la manda al boceto con `ArteP5.comando`.
///
/// Hasta que p5 dibuja el primer cuadro, la vista es transparente y se ve el
/// brillo nativo de abajo (`BrilloNativo`), en el mismo lugar; después aparece
/// con un fundido corto. Si WebGL fallara, queda ese brillo.
struct ArteP5: UIViewRepresentable {
    let pagina: Int
    let sinMovimiento: Bool

    /// La llamada de JavaScript que mueve la mancha. Pura, para poder probarla.
    nonisolated static func comando(pagina: Int, sinMovimiento: Bool) -> String {
        let mancha = ArteOnboarding.mancha(pagina: pagina)
        return "window.sieza && window.sieza.mostrar({x: \(mancha.centro.x), y: \(mancha.centro.y), "
            + "ancho: \(mancha.ancho), alto: \(mancha.alto), quieto: \(sinMovimiento)})"
    }

    /// El HTML del boceto dentro de la app, o nil si faltara en el bundle.
    nonisolated static func urlBoceto(en bundle: Bundle = .main) -> URL? {
        bundle.url(forResource: "onboarding-arte", withExtension: "html")
    }

    func makeCoordinator() -> Coordinador { Coordinador() }

    func makeUIView(context: Context) -> WKWebView {
        let configuracion = WKWebViewConfiguration()
        configuracion.userContentController.add(MensajeroDebil(context.coordinator), name: "sieza")

        let vista = WKWebView(frame: .zero, configuration: configuracion)
        vista.isOpaque = false
        vista.backgroundColor = .clear
        vista.scrollView.backgroundColor = .clear
        vista.scrollView.isScrollEnabled = false
        vista.scrollView.contentInsetAdjustmentBehavior = .never
        // Los gestos (deslizar entre pantallas) los maneja SwiftUI.
        vista.isUserInteractionEnabled = false
        // Casi invisible y no 0: con alpha 0 WebKit da la vista por oculta,
        // pausa requestAnimationFrame y p5 nunca dibuja su primer cuadro.
        vista.alpha = 0.02
        #if DEBUG
        vista.isInspectable = true
        #endif

        context.coordinator.vista = vista
        context.coordinator.comando = Self.comando(pagina: pagina, sinMovimiento: sinMovimiento)
        if let url = Self.urlBoceto() {
            vista.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return vista
    }

    func updateUIView(_ vista: WKWebView, context: Context) {
        context.coordinator.enviar(Self.comando(pagina: pagina, sinMovimiento: sinMovimiento))
    }

    static func dismantleUIView(_ vista: WKWebView, coordinator: Coordinador) {
        vista.configuration.userContentController.removeScriptMessageHandler(forName: "sieza")
    }

    final class Coordinador: NSObject, WKScriptMessageHandler {
        weak var vista: WKWebView?
        var comando = ""
        private(set) var listo = false

        /// Manda la posición si cambió. Antes de que p5 avise que está listo
        /// solo se guarda: se envía al llegar el aviso.
        func enviar(_ nuevo: String) {
            guard nuevo != comando || !listo else { return }
            comando = nuevo
            if listo { vista?.evaluateJavaScript(nuevo) }
        }

        func userContentController(_ controller: WKUserContentController, didReceive mensaje: WKScriptMessage) {
            guard (mensaje.body as? String) == "listo", !listo else { return }
            listo = true
            vista?.evaluateJavaScript(comando)
            UIView.animate(withDuration: 0.35) { self.vista?.alpha = 1 }
        }
    }

    /// `WKUserContentController` retiene a su manejador; este intermediario
    /// evita el ciclo vista → configuración → coordinador → vista.
    private final class MensajeroDebil: NSObject, WKScriptMessageHandler {
        weak var destino: WKScriptMessageHandler?
        init(_ destino: WKScriptMessageHandler) { self.destino = destino }

        func userContentController(_ controller: WKUserContentController, didReceive mensaje: WKScriptMessage) {
            destino?.userContentController(controller, didReceive: mensaje)
        }
    }
}
