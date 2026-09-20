import SwiftUI
import UIKit

/// Un tema del diseño: los mismos tokens que `.d2[data-d2-theme="..."]` en la
/// web. Los valores los genera `ios/scripts/sync-theme.mjs` desde el CSS, así
/// que no hay colores escritos a mano de este lado.
struct Theme: Identifiable, Equatable, Sendable {
    let id: String
    let nombre: String

    /// Opacidad de la tinta del vidrio, en tres niveles.
    let glass1: Double
    let glass2: Double
    let glass3: Double

    let borde: Color
    let bordeFuerte: Color

    let texto: Color
    let texto2: Color
    let texto3: Color

    /// El sólido del tema: el botón principal, el día entrenado, la serie
    /// confirmada. Y el color del texto que va encima.
    let solido: Color
    let sobreSolido: Color

    /// Las tres luces que se apoyan sobre el degradado de base.
    let luzA: Color
    let luzB: Color
    let luzC: Color

    let mancha1: Color
    let mancha2: Color
    let mancha3: Color

    let fondoInicio: UnitPoint
    let fondoFin: UnitPoint
    let fondo: [Gradient.Stop]

    /// Nombre de la imagen del catálogo para los temas que traen una obra de
    /// fondo en vez de un degradado. `nil` en los demás.
    let obra: String?

    static let porDefecto = Theme.todos.first { $0.id == "plata" } ?? Theme.todos[0]

    static func conId(_ id: String?) -> Theme {
        Theme.todos.first { $0.id == id } ?? .porDefecto
    }

    /// Un color plano del tema, para los pocos lugares que no pueden llevar el
    /// degradado entero (una barra de sistema, un relleno de respaldo).
    var fondoPlano: Color { fondo.last?.color ?? .black }

    /// El vidrio no tiene color propio: es blanco translúcido y el color se lo
    /// da el fondo que difumina.
    func vidrio(_ nivel: Int = 1) -> Color {
        let opacidad = nivel >= 3 ? glass3 : (nivel == 2 ? glass2 : glass1)
        return Color.white.opacity(opacidad)
    }
}

/// El tema elegido, guardado en el aparato igual que en la web.
///
/// `@AppStorage` es el equivalente de localStorage: es una preferencia del
/// teléfono, no de la cuenta, así que no viaja a Firestore.
@Observable
final class ThemeStore {
    var actual: Theme {
        didSet { UserDefaults.standard.set(actual.id, forKey: Self.clave) }
    }

    private static let clave = "d2-theme-v2"

    init() {
        actual = Theme.conId(UserDefaults.standard.string(forKey: Self.clave))
    }
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue = Theme.porDefecto
}

extension EnvironmentValues {
    var tema: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

// MARK: - Piezas

/// El fondo de la app: la obra del tema, o el degradado con sus tres luces y
/// las manchas desenfocadas encima.
///
/// Las manchas no son decoración: el vidrio de las tarjetas difumina lo que
/// tiene atrás, y sobre un color plano el desenfoque no se percibe.
struct Backdrop: View {
    @Environment(\.tema) private var tema

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let h = proxy.size.height

            ZStack {
                LinearGradient(stops: tema.fondo, startPoint: tema.fondoInicio, endPoint: tema.fondoFin)

                if let obra = tema.obra {
                    Image(obra)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: w, height: h)
                        .clipped()
                } else {
                    // Las tres luces, en las mismas posiciones que los
                    // radial-gradient de la web.
                    luz(tema.luzA, x: 0.18, y: 0.08, radio: w * 1.1)
                    luz(tema.luzB, x: 0.88, y: 0.22, radio: w * 0.9)
                    luz(tema.luzC, x: 0.50, y: 1.05, radio: w * 1.2)

                    mancha(tema.mancha1, x: -0.14, y: 0.06, lado: 460)
                    mancha(tema.mancha2, x: 0.86, y: 0.26, lado: 380)
                    mancha(tema.mancha3, x: 0.24, y: 1.12, lado: 520)
                }
            }
            .frame(width: w, height: h)
        }
        .ignoresSafeArea()
    }

    private func luz(_ color: Color, x: Double, y: Double, radio: Double) -> some View {
        RadialGradient(colors: [color, color.opacity(0)], center: UnitPoint(x: x, y: y), startRadius: 0, endRadius: radio)
    }

    private func mancha(_ color: Color, x: Double, y: Double, lado: Double) -> some View {
        Circle()
            .fill(color)
            .frame(width: lado, height: lado)
            .blur(radius: 70)
            .position(x: x * UIScreen.main.bounds.width, y: y * UIScreen.main.bounds.height)
    }
}

/// Tarjeta de vidrio: el contenedor de todo en este diseño.
struct GlassCard<Content: View>: View {
    @Environment(\.tema) private var tema
    var padding: CGFloat = 16
    var radius: CGFloat = 24
    var nivel: Int = 1
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial.opacity(0.6), in: .rect(cornerRadius: radius))
            .background(tema.vidrio(nivel), in: .rect(cornerRadius: radius))
            .overlay {
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(tema.borde, lineWidth: 1)
            }
    }
}

/// Rótulo de sección: el `d2-label` de la web.
struct SectionLabel: View {
    @Environment(\.tema) private var tema
    let texto: String

    init(_ texto: String) { self.texto = texto }

    var body: some View {
        Text(texto)
            .font(.system(size: 13))
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, 4)
    }
}

/// Título de pantalla.
struct PageTitle: View {
    @Environment(\.tema) private var tema
    let texto: String

    init(_ texto: String) { self.texto = texto }

    var body: some View {
        Text(texto)
            .font(.system(size: 30, weight: .heavy))
            .tracking(-0.7)
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// El botón principal: el sólido del tema, con el texto que le corresponde.
struct SolidButtonStyle: ButtonStyle {
    @Environment(\.tema) private var tema
    var expands = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(tema.sobreSolido)
            .padding(.horizontal, 22)
            .frame(maxWidth: expands ? .infinity : nil, minHeight: 52)
            .background(tema.solido, in: .capsule)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

/// Botón secundario: contorno de vidrio, sin relleno sólido.
struct GhostButtonStyle: ButtonStyle {
    @Environment(\.tema) private var tema

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14))
            .foregroundStyle(tema.texto)
            .padding(.horizontal, 18)
            .frame(minHeight: 46)
            .background(tema.vidrio(1), in: .capsule)
            .overlay { Capsule().strokeBorder(tema.bordeFuerte, lineWidth: 1) }
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}

// MARK: - Piezas que venían del diseño anterior, ahora sobre vidrio

extension Theme {
    /// Radios del diseño, iguales a los de la web.
    static let radius: CGFloat = 24
    static let radiusSmall: CGFloat = 16
}

/// Encabezado de widget: rótulo chico arriba.
struct WidgetHeader: View {
    @Environment(\.tema) private var tema
    let title: String

    var body: some View {
        Text(title)
            .font(.system(size: 13))
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Número grande de un widget, con su unidad al lado.
struct WidgetValue: View {
    @Environment(\.tema) private var tema
    let value: String
    var unit: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(value)
                .font(.system(size: 26, weight: .semibold))
                .tracking(-0.8)
                .foregroundStyle(tema.texto)
            if let unit {
                Text(unit)
                    .font(.system(size: 12))
                    .foregroundStyle(tema.texto2)
            }
        }
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
}

/// Barra de progreso: riel tenue y relleno con el sólido del tema, la misma
/// que `.d2-muscle-bar` en la web.
struct WidgetMeter: View {
    @Environment(\.tema) private var tema
    /// 0...1
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            let ancho = proxy.size.width
            ZStack(alignment: .leading) {
                Capsule().fill(tema.texto3.opacity(0.35))
                Capsule().fill(tema.solido).frame(width: ancho * min(max(value, 0), 1))
            }
        }
        .frame(height: 6)
    }
}

/// Alias del contenedor de tarjeta, para las pantallas que ya lo usaban.
typealias SurfaceCard = GlassCard
typealias AccentButtonStyle = SolidButtonStyle

extension View {
    /// Los teclados numéricos de iOS no traen una tecla para cerrarlos.
    /// Todas las pantallas con formularios comparten este botón para que el
    /// usuario siempre pueda terminar la edición sin buscar un gesto oculto.
    func tecladoConBotonListo() -> some View {
        toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Listo") {
                    UIApplication.shared.sendAction(
                        #selector(UIResponder.resignFirstResponder),
                        to: nil,
                        from: nil,
                        for: nil
                    )
                }
            }
        }
    }
}
