import SwiftUI

/// Las cinco secciones de la app.
enum AppTab: Hashable, CaseIterable {
    case home, routines, history, progress, profile
}

/// Barra inferior, copiada de `components/nav/BottomNav.js` de la web: 292x60,
/// fondo gris, el item activo en naranja con radio 10 y separadores finos entre
/// los inactivos. No usa la TabView nativa a proposito -- la barra del sistema
/// es de vidrio y no tiene nada que ver con este diseno.
struct BottomNav: View {
    @Binding var selection: AppTab

    static let height: CGFloat = 60
    /// Separacion del borde inferior, como el `bottom-6` de la web.
    static let bottomGap: CGFloat = 16

    private static let background = Color(hex: 0xB9B4B4)
    private static let active = Color(hex: 0xF1602F)
    private static let divider = Color(hex: 0xAFAAA9)

    private let tabs = AppTab.allCases

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.element) { index, tab in
                let isActive = tab == selection
                let nextIsActive = index < tabs.count - 1 && tabs[index + 1] == selection

                Button {
                    selection = tab
                } label: {
                    NavIcon(tab: tab)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background {
                            if isActive {
                                RoundedRectangle(cornerRadius: 10).fill(Self.active)
                            }
                        }
                        .contentShape(.rect)
                }
                .buttonStyle(NavButtonStyle())
                .accessibilityLabel(tab.label)
                .accessibilityAddTraits(isActive ? [.isSelected] : [])

                // El separador solo aparece entre dos inactivos: al lado del
                // naranja quedaria pegado al borde de la pastilla.
                if index < tabs.count - 1, !isActive, !nextIsActive {
                    Rectangle()
                        .fill(Self.divider)
                        .frame(width: 1)
                }
            }
        }
        .padding(4)
        .frame(width: 292, height: Self.height)
        .background(Self.background, in: .rect(cornerRadius: 10))
        .shadow(color: .black.opacity(0.18), radius: 15, y: 8)
        .animation(.snappy(duration: 0.2), value: selection)
    }
}

private struct NavButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}

extension AppTab {
    var label: String {
        switch self {
        case .home: "Inicio"
        case .routines: "Rutinas"
        case .history: "Historial"
        case .progress: "Progreso"
        case .profile: "Perfil"
        }
    }
}

/// Los iconos de la web son SVG solidos de 22x22 en un viewBox de 24.
/// Aca se dibujan con Path sobre el mismo sistema de coordenadas.
private struct NavIcon: View {
    let tab: AppTab

    var body: some View {
        Canvas { context, size in
            let scale = size.width / 24
            context.scaleBy(x: scale, y: scale)
            context.fill(path, with: .color(.white), style: FillStyle(eoFill: true))
        }
        .frame(width: 22, height: 22)
    }

    private var path: Path {
        switch tab {
        case .home: Self.bento
        case .routines: Self.dumbbell
        case .history: Self.clipboard
        case .progress: Self.calendar
        case .profile: Self.dots
        }
    }

    // Dos bloques a la izquierda y uno alto a la derecha.
    private static var bento: Path {
        var path = Path()
        path.addRoundedRect(in: CGRect(x: 4.5, y: 4.5, width: 6.5, height: 6.5), cornerSize: .init(width: 2, height: 2))
        path.addRoundedRect(in: CGRect(x: 4.5, y: 13, width: 6.5, height: 6.5), cornerSize: .init(width: 2, height: 2))
        path.addRoundedRect(in: CGRect(x: 13, y: 4.5, width: 6.5, height: 15), cornerSize: .init(width: 2.5, height: 2.5))
        return path
    }

    // Mancuerna con discos interiores y exteriores.
    private static var dumbbell: Path {
        var path = Path()
        let bars: [(CGRect, CGFloat)] = [
            (CGRect(x: 2, y: 10.5, width: 2, height: 3), 0.8),
            (CGRect(x: 4.5, y: 7, width: 2, height: 10), 1),
            (CGRect(x: 7, y: 5, width: 3, height: 14), 1.2),
            (CGRect(x: 9.5, y: 10.5, width: 5, height: 3), 0),
            (CGRect(x: 14, y: 5, width: 3, height: 14), 1.2),
            (CGRect(x: 17.5, y: 7, width: 2, height: 10), 1),
            (CGRect(x: 20, y: 10.5, width: 2, height: 3), 0.8),
        ]
        for (rect, radius) in bars {
            path.addRoundedRect(in: rect, cornerSize: .init(width: radius, height: radius))
        }
        return path
    }

    /// Cuerpo redondeado con dos renglones calados. El calado sale del relleno
    /// par-impar: la forma interior invierte lo que ya estaba pintado.
    private static var clipboard: Path {
        var path = Path()
        path.addRoundedRect(in: CGRect(x: 8.5, y: 2.5, width: 7, height: 3.5), cornerSize: .init(width: 1.5, height: 1.5))
        path.addRoundedRect(in: CGRect(x: 4.5, y: 5, width: 15, height: 17), cornerSize: .init(width: 2.5, height: 2.5))
        path.addRoundedRect(in: CGRect(x: 9, y: 9.5, width: 6, height: 2), cornerSize: .init(width: 1, height: 1))
        path.addRoundedRect(in: CGRect(x: 9, y: 13.5, width: 6, height: 2), cornerSize: .init(width: 1, height: 1))
        return path
    }

    /// Calendario de pared: dos anillos arriba, cuerpo, la hoja calada y tres
    /// puntos que vuelven a pintarse dentro del calado.
    private static var calendar: Path {
        var path = Path()
        path.addRoundedRect(in: CGRect(x: 7.5, y: 2.5, width: 2, height: 3.5), cornerSize: .init(width: 1, height: 1))
        path.addRoundedRect(in: CGRect(x: 14.5, y: 2.5, width: 2, height: 3.5), cornerSize: .init(width: 1, height: 1))
        path.addRoundedRect(in: CGRect(x: 4.5, y: 5, width: 15, height: 17), cornerSize: .init(width: 2.5, height: 2.5))

        // Hoja: esquinas de abajo redondeadas, las de arriba rectas.
        var sheet = Path()
        sheet.move(to: CGPoint(x: 7, y: 9.5))
        sheet.addLine(to: CGPoint(x: 17, y: 9.5))
        sheet.addLine(to: CGPoint(x: 17, y: 18))
        sheet.addQuadCurve(to: CGPoint(x: 15.5, y: 19.5), control: CGPoint(x: 17, y: 19.5))
        sheet.addLine(to: CGPoint(x: 8.5, y: 19.5))
        sheet.addQuadCurve(to: CGPoint(x: 7, y: 18), control: CGPoint(x: 7, y: 19.5))
        sheet.closeSubpath()
        path.addPath(sheet)

        for x in [9.5, 13.0, 16.5] {
            path.addEllipse(in: CGRect(x: x - 1, y: 12.5, width: 2, height: 2))
        }
        return path
    }

    private static var dots: Path {
        var path = Path()
        for x in [6.0, 12.0, 18.0] {
            path.addEllipse(in: CGRect(x: x - 2.2, y: 12 - 2.2, width: 4.4, height: 4.4))
        }
        return path
    }
}

extension View {
    /// Deja libre abajo el lugar que ocupa la barra flotante. Sin esto el
    /// contenido termina tapado: la barra va por encima, no dentro del layout.
    func bottomNavInset() -> some View {
        safeAreaPadding(.bottom, BottomNav.height + BottomNav.bottomGap + 12)
    }
}
