import SwiftUI

/// Tres pantallas de bienvenida, sobrias: negro, la foto en círculo con un aro
/// fino Brasa, el número de pantalla como único acento y el naranja lleno
/// reservado para "Empezar".
/// Las fotos son locales para que la bienvenida no dependa de la red.
struct OnboardingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var flow = OnboardingFlow()

    let onComplete: () -> Void

    private let brand = Theme.porDefecto

    var body: some View {
        ZStack {
            fondo

            VStack(alignment: .leading, spacing: 0) {
                header
                    .padding(.horizontal, 24)

                hero
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                message
                    .padding(.horizontal, 24)
                controls
                    .padding(.horizontal, 24)
                    .padding(.top, 32)
            }
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

    /// El número de la pantalla, como "01" en las secciones del sitio.
    private var numero: String { String(format: "%02d", flow.page.rawValue + 1) }

    // MARK: - Fondo

    /// Negro plano: la foto y el texto tienen que ser lo único que se mire.
    private var fondo: some View {
        brand.fondoPlano
            .ignoresSafeArea()
            .accessibilityHidden(true)
    }

    // MARK: - Encabezado

    private var header: some View {
        HStack(spacing: 16) {
            // El logo real en blanco: sobre el negro de SIEZA va siempre claro.
            Image("SiezaWordmark")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(height: 15)
                .foregroundStyle(brand.texto)
                .accessibilityLabel("SiezaGym")

            HStack(spacing: 6) {
                ForEach(OnboardingPage.allCases) { page in
                    Capsule()
                        .fill(page.rawValue <= flow.page.rawValue ? brand.texto : brand.texto.opacity(0.18))
                        .frame(height: 3)
                }
            }
            .animation(.snappy(duration: 0.3), value: flow.page)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Pantalla \(flow.page.rawValue + 1) de 3")

            Button("Omitir", action: onComplete)
                .font(.system(size: 14, weight: .medium))
                .padding(.horizontal, 14)
                .frame(minHeight: 44)
                .overlay { Capsule().strokeBorder(brand.texto.opacity(0.18), lineWidth: 1) }
                .accessibilityHint("Abre el inicio de sesión")
        }
    }

    // MARK: - El círculo

    /// La foto en círculo con un aro fino Brasa y un halo leve detrás.
    private var hero: some View {
        GeometryReader { size in
            let lado = min(size.size.width * 0.84, size.size.height * 0.92, 380)

            ZStack {
                // Un halo apenas perceptible detrás, no un sol.
                Circle()
                    .fill(brand.solido.opacity(0.10))
                    .frame(width: lado, height: lado)
                    .blur(radius: 60)

                Image(flow.page.imageName)
                    .resizable()
                    .scaledToFill()
                    .frame(width: lado * 0.86, height: lado * 0.86)
                    .clipShape(.circle)
                    .id("foto-\(flow.page.rawValue)")
                    .transition(.asymmetric(
                        insertion: .scale(scale: 0.94).combined(with: .opacity),
                        removal: .opacity
                    ))
                    .accessibilityHidden(true)

                // El naranja como un trazo fino alrededor, separado de la foto.
                Circle()
                    .strokeBorder(brand.solido, lineWidth: 1.5)
                    .frame(width: lado * 0.94, height: lado * 0.94)
            }
            .frame(width: size.size.width, height: size.size.height)
        }
        .padding(.vertical, 12)
    }

    // MARK: - Texto

    private var message: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(numero)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(brand.solido)
                Text(flow.page.eyebrow)
                    .font(.system(size: 11, weight: .bold))
                    .tracking(2)
                    .foregroundStyle(brand.texto2)
            }
            .padding(.bottom, 14)

            Text(flow.page.headline)
                .font(.system(size: 40, weight: .regular))
                .tracking(-1.6)

            Text(flow.page.headlineEmphasis)
                .font(.system(size: 40, weight: .bold))
                .tracking(-1.6)
                .padding(.bottom, 14)

            Text(flow.page.detail)
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(4)
                .foregroundStyle(brand.texto.opacity(0.78))
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 330, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .minimumScaleFactor(0.8)
        .id(flow.page)
        .transition(.opacity.combined(with: .offset(y: 12)))
    }

    // MARK: - Controles

    private var controls: some View {
        HStack(spacing: 10) {
            Button {
                changePage { flow.goBack() }
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(width: 60, height: 60)
                    .overlay { Circle().strokeBorder(brand.texto.opacity(0.2), lineWidth: 1) }
            }
            .buttonStyle(.plain)
            .disabled(!flow.canGoBack)
            .opacity(flow.canGoBack ? 1 : 0.35)
            .accessibilityLabel("Volver")

            Button {
                if flow.isLastPage {
                    onComplete()
                } else {
                    changePage { _ = flow.advance() }
                }
            } label: {
                HStack(spacing: 10) {
                    Text(flow.isLastPage ? "Empezar" : "Continuar")
                        .font(.system(size: 17, weight: .semibold))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 15, weight: .semibold))
                }
                .frame(maxWidth: .infinity, minHeight: 60)
                // Continuar: solo un borde. El naranja lleno queda para
                // Empezar, que es la única acción que importa.
                .foregroundStyle(flow.isLastPage ? brand.sobreSolido : brand.texto)
                .background(flow.isLastPage ? brand.solido : .clear, in: .capsule)
                .overlay {
                    Capsule().strokeBorder(flow.isLastPage ? .clear : brand.texto.opacity(0.22), lineWidth: 1)
                }
                .contentShape(.capsule)
            }
            .buttonStyle(.plain)
            .accessibilityHint(flow.isLastPage ? "Abre el inicio de sesión" : "Va a la siguiente pantalla")
        }
    }

    private func changePage(_ update: () -> Void) {
        withAnimation(reduceMotion ? nil : .spring(duration: 0.45, bounce: 0.18), update)
    }
}

#if DEBUG
#Preview("Onboarding") {
    OnboardingView {}
        .preferredColorScheme(.dark)
}
#endif
