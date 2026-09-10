import SwiftUI

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

/// Los mismos tokens que `app/globals.css` en la web. Si cambia uno alla, cambia
/// aca: son la misma marca.
enum Theme {
    /// Fondo bordo de toda la app.
    static let background = Color(hex: 0x3B0A0C)
    static let deep = Color(hex: 0x250507)
    /// Fondo claro de las tarjetas grandes.
    static let card = Color(hex: 0xEDE8E1)
    /// Fondo de los widgets de la Home.
    static let surface = Color(hex: 0xE5E1E0)
    static let cardBorder = Color(hex: 0x6B1717)
    /// Borde fino de los widgets, un poco mas oscuro que el de las tarjetas.
    static let hairline = Color(hex: 0x5A1215)
    static let cardText = Color(hex: 0x141414)
    static let cardMuted = Color(hex: 0x756C65)
    static let accent = Color(hex: 0xFF5733)
    static let accentLight = Color(hex: 0xFF7352)
    static let accentHover = Color(hex: 0xE84D29)
    static let crimson = Color(hex: 0x6B1717)

    /// Tonos de los graficos, iguales a los widgets de la web.
    static let chartLight = Color(hex: 0xCFC8BE)
    static let chartDark = Color(hex: 0x3A3531)

    static let onDark = Color.white
    static let onDarkMuted = Color.white.opacity(0.72)
    static let onDarkFaint = Color.white.opacity(0.52)

    /// Radio unico de toda la app: 10, igual que los widgets de la web.
    static let radius: CGFloat = 10
}

/// Superficie clara con borde, la base de todo widget y card.
struct SurfaceCard<Content: View>: View {
    var padding: CGFloat = 14
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface, in: .rect(cornerRadius: Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.radius)
                    .strokeBorder(Theme.hairline, lineWidth: 1)
            }
    }
}

/// Encabezado de widget: titulo chico arriba, con la flechita de la referencia.
struct WidgetHeader: View {
    let title: String

    var body: some View {
        HStack(alignment: .top) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .tracking(0.8)
                .foregroundStyle(Theme.cardMuted)
            Spacer(minLength: 8)
            Image(systemName: "arrow.up.right")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(Theme.cardMuted.opacity(0.7))
        }
    }
}

/// Numero grande de un widget, con su unidad al lado.
struct WidgetValue: View {
    let value: String
    var unit: String?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 3) {
            Text(value)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.cardText)
            if let unit {
                Text(unit)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.cardMuted)
            }
        }
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
}

/// Barra de tres tonos: naranja al principio, oscuro hasta el valor, claro el
/// resto. Es la barra de los widgets de la web.
struct WidgetMeter: View {
    /// 0...1
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let filled = width * min(max(value, 0), 1)
            let accent = min(filled, width * 0.35)

            ZStack(alignment: .leading) {
                Capsule().fill(Theme.chartLight)
                Capsule().fill(Theme.chartDark).frame(width: filled)
                Capsule().fill(Theme.accent).frame(width: accent)
            }
        }
        .frame(height: 8)
    }
}

/// Pildora naranja: el boton primario de la app.
struct AccentButtonStyle: ButtonStyle {
    var expands = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 20)
            .frame(maxWidth: expands ? .infinity : nil, minHeight: 50)
            .background(
                configuration.isPressed ? Theme.accentHover : Theme.accent,
                in: .rect(cornerRadius: Theme.radius)
            )
            .shadow(color: Theme.accent.opacity(0.3), radius: 12, y: 4)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}
