import SwiftUI

/// Tres pantallas de bienvenida hechas solo de color: negro, una mancha de
/// Brasa a naranja vista a través de vidrio acanalado, grano fino y el texto
/// grande en blanco. Sin fotos: la marca es el color. El arte lo dibuja p5
/// (`ArteP5`) a la resolución real de la pantalla.
struct OnboardingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var flow = OnboardingFlow()

    let onComplete: () -> Void

    private let brand = Theme.porDefecto

    var body: some View {
        ZStack {
            brand.fondoPlano.ignoresSafeArea()

            ZStack {
                BrilloNativo(pagina: flow.page.rawValue)
                ArteP5(pagina: flow.page.rawValue, sinMovimiento: reduceMotion)
            }
            .ignoresSafeArea()
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 0) {
                header
                Spacer(minLength: 24)
                message
                controls
                    .padding(.top, 36)
            }
            .padding(.horizontal, 24)
            .padding(.top, 12)
            .padding(.bottom, 18)
        }
        .foregroundStyle(brand.texto)
        .simultaneousGesture(
            DragGesture(minimumDistance: 60)
                .onEnded { value in
                    guard abs(value.translation.width) > abs(value.translation.height) else { return }
                    changePage {
                        if value.translation.width > 0 {
                            flow.goBack()
                        } else if !flow.isLastPage {
                            _ = flow.advance()
                        }
                    }
                }
        )
    }

    // MARK: - Encabezado

    private var header: some View {
        HStack(spacing: 16) {
            Image("SiezaWordmark")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(height: 15)
                .foregroundStyle(brand.texto)
                .accessibilityLabel("SiezaGym")

            Spacer(minLength: 0)

            HStack(spacing: 6) {
                ForEach(OnboardingPage.allCases) { page in
                    Capsule()
                        .fill(brand.texto.opacity(page == flow.page ? 1 : 0.25))
                        .frame(width: page == flow.page ? 18 : 6, height: 6)
                }
            }
            .animation(.snappy(duration: 0.3), value: flow.page)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Pantalla \(flow.page.rawValue + 1) de 3")

            Button("Omitir", action: onComplete)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(brand.texto.opacity(0.75))
                .frame(minHeight: 44)
                .padding(.leading, 6)
                .accessibilityHint("Abre el inicio de sesión")
        }
    }

    // MARK: - Texto

    private var message: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("\(flow.page.headline)\n\(flow.page.headlineEmphasis)")
                .font(.system(size: 48, weight: .semibold))
                .tracking(-1.8)
                .lineSpacing(-4)
                .fixedSize(horizontal: false, vertical: true)

            Text(flow.page.detail)
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(4)
                .foregroundStyle(brand.texto.opacity(0.78))
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 320, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .minimumScaleFactor(0.8)
        .id(flow.page)
        .transition(.opacity.combined(with: .offset(y: 14)))
    }

    // MARK: - Controles

    private var controls: some View {
        VStack(spacing: 12) {
            Button {
                if flow.isLastPage {
                    onComplete()
                } else {
                    changePage { _ = flow.advance() }
                }
            } label: {
                Text(flow.isLastPage ? "Empezar" : "Continuar")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 58)
                    .background(
                        LinearGradient(
                            colors: [OnboardingColor.brasa, OnboardingColor.naranja],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: .capsule
                    )
                    .contentShape(.capsule)
            }
            .buttonStyle(.plain)
            .accessibilityHint(flow.isLastPage ? "Abre el inicio de sesión" : "Va a la siguiente pantalla")

            // La segunda opción: en la primera pantalla, ir directo a entrar;
            // después, volver a la anterior.
            Button {
                if flow.canGoBack {
                    changePage { flow.goBack() }
                } else {
                    onComplete()
                }
            } label: {
                Text(flow.canGoBack ? "Volver" : "Ya tengo cuenta")
                    .font(.system(size: 17, weight: .medium))
                    .frame(maxWidth: .infinity, minHeight: 58)
                    .overlay { Capsule().strokeBorder(brand.texto.opacity(0.35), lineWidth: 1) }
                    .contentShape(.capsule)
            }
            .buttonStyle(.plain)
        }
    }

    private func changePage(_ update: () -> Void) {
        withAnimation(reduceMotion ? nil : .spring(duration: 0.7, bounce: 0.12), update)
    }
}

/// Los dos naranjas de la marca para el arte y el botón principal.
enum OnboardingColor {
    static let brasa = Color(r: 255, g: 50, b: 1, a: 1)
    static let naranja = Color(r: 255, g: 118, b: 1, a: 1)
}

/// Dónde cae la mancha de color en cada pantalla, en proporción a la vista.
/// Se mueve de una a otra para que avanzar se sienta como avanzar.
nonisolated enum ArteOnboarding {
    struct Mancha: Equatable {
        let centro: UnitPoint
        let ancho: Double
        let alto: Double
    }

    static func mancha(pagina: Int) -> Mancha {
        switch pagina {
        case 0: Mancha(centro: UnitPoint(x: 0.68, y: 0.36), ancho: 0.95, alto: 0.42)
        case 1: Mancha(centro: UnitPoint(x: 0.32, y: 0.32), ancho: 1.0, alto: 0.38)
        default: Mancha(centro: UnitPoint(x: 0.55, y: 0.44), ancho: 1.15, alto: 0.5)
        }
    }
}

/// El brillo sin vidrio ni grano, en el mismo lugar que el de p5. Se ve el
/// instante antes de que p5 dibuje su primer cuadro (y queda si WebGL fallara),
/// para que no aparezca un negro vacío.
private struct BrilloNativo: View {
    let pagina: Int

    var body: some View {
        let mancha = ArteOnboarding.mancha(pagina: pagina)

        GeometryReader { size in
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [
                            OnboardingColor.naranja,
                            OnboardingColor.brasa.opacity(0.85),
                            OnboardingColor.brasa.opacity(0.25),
                            .clear,
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: size.size.width * mancha.ancho * 0.55
                    )
                )
                .frame(width: size.size.width * mancha.ancho, height: size.size.height * mancha.alto)
                .position(
                    x: size.size.width * mancha.centro.x,
                    y: size.size.height * mancha.centro.y
                )
                .blur(radius: 30)
                .animation(.spring(duration: 0.9, bounce: 0.1), value: mancha)
        }
    }
}

#if DEBUG
#Preview("Onboarding") {
    OnboardingView {}
        .preferredColorScheme(.dark)
}
#endif
