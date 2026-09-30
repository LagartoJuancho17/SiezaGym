import SwiftUI

/// El balance entre volumen de empuje y de tracción.
struct PushPullScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private var balance: HomeMetrics.PushPull { store.pushPull }

    var body: some View {
        Pantalla(titulo: "Empuje y tracción", volver: true) {
            if !balance.hasData {
                Vacio(texto: "Todavía no hay ejercicios de empuje ni de tracción registrados.")
                    .padding(.top, 12)
            } else {
                GlassCard(padding: 16) {
                    VStack(spacing: 12) {
                        GeometryReader { proxy in
                            HStack(spacing: 0) {
                                Rectangle().fill(tema.solido)
                                    .frame(width: proxy.size.width * Double(balance.pct) / 100)
                                Rectangle().fill(tema.vidrio(3))
                            }
                        }
                        .frame(height: 26)
                        .clipShape(.rect(cornerRadius: 9))
                        .accessibilityElement()
                        .accessibilityLabel("Empuje \(balance.pushKg) kilos, tracción \(balance.pullKg) kilos. \(balance.label).")

                        HStack {
                            Text("empuje \(ProgressMetrics.formatKg(Double(balance.pushKg)))")
                            Spacer()
                            Text(balance.label).foregroundStyle(tema.texto3)
                            Spacer()
                            Text("tracción \(ProgressMetrics.formatKg(Double(balance.pullKg)))")
                        }
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                    }
                }
                .padding(.top, 12)
            }
        }
        .bottomNavInset()
    }
}
