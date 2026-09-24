import ImageIO
import SwiftUI
import UIKit

/// El marco de una pantalla: rótulo opcional arriba, título, y una acción a la
/// derecha. Es el `PageShell` de la web.
struct Pantalla<Contenido: View, Accion: View>: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss

    let titulo: String
    var rotulo: String?
    /// Con `volver` aparece la flecha a la izquierda.
    var volver = false
    @ViewBuilder var accion: Accion
    @ViewBuilder var contenido: Contenido

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .center, spacing: 12) {
                    if volver {
                        Button { dismiss() } label: {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundStyle(tema.texto)
                                .frame(width: 44, height: 44)
                        }
                        .accessibilityLabel("Volver")
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        if let rotulo {
                            Text(rotulo)
                                .font(.system(size: 13))
                                .foregroundStyle(tema.texto2)
                        }
                        Text(titulo)
                            .font(.system(size: volver ? 24 : 30, weight: tema.plano ? .bold : .heavy))
                            .tracking(-0.7)
                            .foregroundStyle(tema.texto)
                            .lineLimit(2)
                            .minimumScaleFactor(0.7)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    accion
                }
                .padding(.bottom, 4)

                contenido
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background { Backdrop() }
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.interactively)
        .tecladoConBotonListo()
        .navigationBarBackButtonHidden(volver)
        .toolbar(.hidden, for: .navigationBar)
    }
}

extension Pantalla where Accion == EmptyView {
    init(titulo: String, rotulo: String? = nil, volver: Bool = false, @ViewBuilder contenido: () -> Contenido) {
        self.init(titulo: titulo, rotulo: rotulo, volver: volver, accion: { EmptyView() }, contenido: contenido)
    }
}

/// Tres números en una tarjeta, separados por líneas. El `d2-stats` de la web.
struct StatsCard: View {
    @Environment(\.tema) private var tema
    let datos: [(valor: String, rotulo: String)]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(datos.enumerated()), id: \.offset) { indice, dato in
                if indice > 0 {
                    Rectangle().fill(tema.borde).frame(width: 1, height: 34)
                }
                VStack(spacing: 4) {
                    Text(dato.valor)
                        .font(.system(size: 22, weight: .semibold))
                        .monospacedDigit()
                        .tracking(-0.7)
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text(dato.rotulo)
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 10)
        .background(tema.vidrio(1), in: .rect(cornerRadius: tema.plano ? 18 : 26))
        .overlay {
            RoundedRectangle(cornerRadius: tema.plano ? 18 : 26)
                .strokeBorder(tema.borde, lineWidth: 1)
        }
    }
}

/// Panel de vidrio con filas separadas por una línea fina, como
/// `.d2-routine-list`: la lista se lee como un objeto y no como una pila.
struct PanelLista<Contenido: View>: View {
    @Environment(\.tema) private var tema
    @ViewBuilder var contenido: Contenido

    var body: some View {
        VStack(spacing: 0) { contenido }
            .background(tema.vidrio(1), in: .rect(cornerRadius: tema.plano ? 18 : 24))
            .overlay {
                RoundedRectangle(cornerRadius: tema.plano ? 18 : 24)
                    .strokeBorder(tema.borde, lineWidth: 1)
            }
    }
}

/// Una fila de lista: nombre, detalle abajo, y un valor opcional a la derecha.
struct FilaLista: View {
    @Environment(\.tema) private var tema
    let nombre: String
    let detalle: String
    var etiqueta: String?
    var valor: String?
    var unidad: String?
    var miniatura: URL?
    var chevron = true

    var body: some View {
        HStack(spacing: 12) {
            if let miniatura {
                Miniatura(url: miniatura, lado: 40)
            }

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(nombre)
                        .font(.system(size: 15, weight: .medium))
                        .tracking(-0.2)
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    if let etiqueta {
                        Text(etiqueta)
                            .font(.system(size: 10))
                            .foregroundStyle(tema.texto2)
                    }
                }
                Text(detalle)
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if let valor {
                VStack(alignment: .trailing, spacing: 3) {
                    Text(valor)
                        .font(.system(size: 13))
                        .foregroundStyle(tema.texto)
                    if let unidad {
                        Text(unidad)
                            .font(.system(size: 9))
                            .foregroundStyle(tema.texto3)
                    }
                }
            }

            if chevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto3)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 13)
        .contentShape(.rect)
    }
}

/// La animación del ejercicio. Fondo claro siempre: son trazos negros sobre
/// blanco y sobre el vidrio de un tema oscuro no se ven.
struct Miniatura: View {
    @Environment(\.tema) private var tema
    let url: URL?
    var lado: CGFloat = 54

    var body: some View {
        ZStack {
            Color(white: 0.95)
            if let url {
                if url.pathExtension.lowercased() == "gif" {
                    GIFMiniatura(url: url)
                } else {
                    AsyncImage(url: url) { imagen in
                        imagen.resizable().aspectRatio(contentMode: .fill)
                    } placeholder: {
                        PlaceholderMiniatura(lado: lado)
                    }
                }
            } else {
                PlaceholderMiniatura(lado: lado)
            }
        }
        .frame(width: lado, height: lado)
        .clipShape(.rect(cornerRadius: lado * 0.3))
    }
}

private struct PlaceholderMiniatura: View {
    let lado: CGFloat

    var body: some View {
        Image(systemName: "dumbbell.fill")
            .font(.system(size: lado * 0.34))
            .foregroundStyle(Color(white: 0.6))
    }
}

/// `AsyncImage` no reproduce GIFs remotos de forma fiable en iOS. Este camino
/// decodifica sus frames con ImageIO y los entrega a UIImageView, que sí los
/// anima. La caché evita descargar el mismo ejercicio en cada fila/pantalla.
private struct GIFMiniatura: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> UIImageView {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        context.coordinator.load(url: url, into: imageView)
        return imageView
    }

    func updateUIView(_ imageView: UIImageView, context: Context) {
        context.coordinator.load(url: url, into: imageView)
    }

    static func dismantleUIView(_ imageView: UIImageView, coordinator: Coordinator) {
        coordinator.cancel()
    }

    @MainActor
    final class Coordinator {
        private var task: Task<Void, Never>?
        private var loadedURL: URL?

        func load(url: URL, into imageView: UIImageView) {
            guard loadedURL != url else { return }
            loadedURL = url
            task?.cancel()
            imageView.stopAnimating()
            imageView.animationImages = nil
            imageView.image = UIImage(systemName: "dumbbell.fill")

            task = Task { @MainActor [weak self, weak imageView] in
                guard let decoded = try? await GIFImageLoader.load(url: url),
                      !Task.isCancelled,
                      let self,
                      let imageView else { return }

                imageView.animationImages = decoded.frames
                imageView.animationDuration = decoded.duration
                imageView.animationRepeatCount = 0
                imageView.startAnimating()
                self.task = nil
            }
        }

        func cancel() {
            task?.cancel()
            task = nil
        }
    }
}

@MainActor
private enum GIFImageLoader {
    struct DecodedImage {
        let frames: [UIImage]
        let duration: TimeInterval
    }

    static let cache = NSCache<NSURL, UIImage>()

    static func load(url: URL) async throws -> DecodedImage {
        if let cached = cache.object(forKey: url as NSURL),
           let frames = cached.images,
           !frames.isEmpty {
            return DecodedImage(frames: frames, duration: max(cached.duration, 0.1))
        }

        let (data, _) = try await URLSession.shared.data(from: url)
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
            throw GIFImageError.invalidData
        }

        let count = CGImageSourceGetCount(source)
        guard count > 0 else { throw GIFImageError.invalidData }

        var frames: [UIImage] = []
        var duration: TimeInterval = 0
        for index in 0..<count {
            guard let image = CGImageSourceCreateImageAtIndex(source, index, nil) else { continue }
            frames.append(UIImage(cgImage: image))
            duration += frameDuration(source: source, index: index)
        }

        guard !frames.isEmpty else { throw GIFImageError.invalidData }
        let totalDuration = max(duration, Double(frames.count) * 0.1)
        let animated = UIImage.animatedImage(with: frames, duration: totalDuration) ?? frames[0]
        cache.setObject(animated, forKey: url as NSURL)
        return DecodedImage(frames: animated.images ?? frames, duration: totalDuration)
    }

    private static func frameDuration(source: CGImageSource, index: Int) -> TimeInterval {
        let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any]
        let gif = properties?[kCGImagePropertyGIFDictionary] as? [CFString: Any]
        let unclamped = gif?[kCGImagePropertyGIFUnclampedDelayTime] as? Double
        let clamped = gif?[kCGImagePropertyGIFDelayTime] as? Double
        return max(unclamped ?? clamped ?? 0.1, 0.02)
    }

    private enum GIFImageError: Error {
        case invalidData
    }
}

/// Estado vacío: qué falta y cómo salir de ahí.
struct Vacio: View {
    @Environment(\.tema) private var tema
    let texto: String
    var accion: (titulo: String, hacer: () -> Void)?

    var body: some View {
        VStack(spacing: 16) {
            Text(texto)
                .font(.system(size: 14))
                .foregroundStyle(tema.texto2)
                .multilineTextAlignment(.center)
            if let accion {
                Button(accion.titulo, action: accion.hacer)
                    .buttonStyle(SolidButtonStyle(expands: false))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .background(tema.vidrio(1), in: .rect(cornerRadius: 24))
        .overlay { RoundedRectangle(cornerRadius: 24).strokeBorder(tema.borde, lineWidth: 1) }
    }
}

/// La atribución de los gifs. Es condición de la licencia: donde se ven las
/// animaciones tiene que estar el crédito.
struct CreditoGifs: View {
    @Environment(\.tema) private var tema

    var body: some View {
        Link(destination: URL(string: "https://gymvisual.com/")!) {
            Text("Animaciones de ejercicios © Gym visual")
                .font(.system(size: 10))
                .underline()
                .foregroundStyle(tema.texto3)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 14)
    }
}
