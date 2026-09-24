import SwiftUI

/// Tres escenas editoriales, con controles planos sobre la paleta SIEZA.
/// Las fotos son locales para que la bienvenida no dependa de la red.
struct OnboardingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var flow = OnboardingFlow()

    let onComplete: () -> Void

    private let brand = Theme.porDefecto

    var body: some View {
        ZStack {
            photo

            VStack(alignment: .leading, spacing: 0) {
                header
                Spacer(minLength: 24)
                message
                controls
                    .padding(.top, 42)
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

    private var photo: some View {
        GeometryReader { size in
            Image(flow.page.imageName)
                .resizable()
                .scaledToFill()
                .frame(width: size.size.width, height: size.size.height)
                .clipped()
                .overlay {
                    LinearGradient(
                        stops: [
                            .init(color: brand.fondoPlano.opacity(0.52), location: 0),
                            .init(color: brand.fondoPlano.opacity(0.02), location: 0.24),
                            .init(color: brand.fondoPlano.opacity(0.04), location: 0.46),
                            .init(color: brand.fondoPlano.opacity(0.83), location: 0.70),
                            .init(color: brand.fondoPlano, location: 1),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
        }
        .ignoresSafeArea()
        .accessibilityHidden(true)
    }

    private var header: some View {
        HStack(spacing: 16) {
            Text("SIEZA")
                .font(.system(size: 17, weight: .black))
                .tracking(-0.6)
                .accessibilityLabel("SiezaGym")

            HStack(spacing: 6) {
                ForEach(OnboardingPage.allCases) { page in
                    Capsule()
                        .fill(page.rawValue <= flow.page.rawValue ? brand.texto : brand.texto.opacity(0.32))
                        .frame(height: 3)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Pantalla \(flow.page.rawValue + 1) de 3")

            Button("Omitir", action: onComplete)
                .font(.system(size: 14, weight: .medium))
                .padding(.horizontal, 14)
                .frame(minHeight: 44)
                .background(brand.vidrio(2), in: .capsule)
                .accessibilityHint("Abre el inicio de sesión")
        }
    }

    private var message: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(flow.page.eyebrow)
                .font(.system(size: 11, weight: .bold))
                .tracking(2)
                .foregroundStyle(brand.texto2)
                .padding(.bottom, 16)

            Text(flow.page.headline)
                .font(.system(size: 43, weight: .regular))
                .tracking(-1.8)

            Text(flow.page.headlineEmphasis)
                .font(.system(size: 43, weight: .bold))
                .tracking(-1.8)
                .padding(.bottom, 16)

            Text(flow.page.detail)
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(4)
                .foregroundStyle(brand.texto.opacity(0.84))
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 330, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .minimumScaleFactor(0.8)
        .id(flow.page)
    }

    private var controls: some View {
        HStack(spacing: 10) {
            Button {
                changePage { flow.goBack() }
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(width: 62, height: 62)
                    .background(brand.vidrio(2), in: .circle)
                    .overlay { Circle().strokeBorder(brand.bordeFuerte, lineWidth: 1) }
            }
            .buttonStyle(.plain)
            .disabled(!flow.canGoBack)
            .opacity(flow.canGoBack ? 1 : 0.42)
            .accessibilityLabel("Volver")

            Button {
                if flow.isLastPage {
                    onComplete()
                } else {
                    changePage { _ = flow.advance() }
                }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "arrow.right")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(brand.texto)
                        .frame(width: 46, height: 46)
                        .background(brand.fondoPlano, in: .circle)

                    Text(flow.isLastPage ? "Empezar" : "Continuar")
                        .font(.system(size: 15, weight: .semibold))

                    Spacer(minLength: 0)

                    Image(systemName: "chevron.right.2")
                        .font(.system(size: 12, weight: .bold))
                        .accessibilityHidden(true)
                }
                .padding(.leading, 8)
                .padding(.trailing, 20)
                .frame(height: 62)
                .foregroundStyle(flow.isLastPage ? brand.sobreSolido : brand.texto)
                .background(flow.isLastPage ? brand.solido : brand.bordeFuerte, in: .capsule)
            }
            .buttonStyle(.plain)
            .accessibilityHint(flow.isLastPage ? "Abre el inicio de sesión" : "Va a la siguiente pantalla")
        }
    }

    private func changePage(_ update: () -> Void) {
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.25), update)
    }
}
