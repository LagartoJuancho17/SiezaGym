import SwiftUI

/// La grilla de días entrenados, estilo contribuciones de GitHub.
struct TrainedDaysScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private static let semanas = 26

    private var grilla: ProgressMetrics.Grid {
        ProgressMetrics.trainedGrid(store.trainedDayKeys, weeks: Self.semanas)
    }

    var body: some View {
        Pantalla(titulo: "Días entrenados", volver: true) {
            GlassCard(padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 3) {
                        ForEach(Array(grilla.columns.enumerated()), id: \.offset) { _, columna in
                            VStack(spacing: 3) {
                                ForEach(columna) { dia in
                                    RoundedRectangle(cornerRadius: 2.5)
                                        .fill(dia.trained ? tema.solido : tema.texto3.opacity(0.3))
                                        .opacity(dia.isFuture ? 0.25 : 1)
                                        .frame(maxWidth: .infinity)
                                        .aspectRatio(1, contentMode: .fit)
                                }
                            }
                        }
                    }
                    .accessibilityElement()
                    .accessibilityLabel("\(grilla.total) días entrenados en las últimas \(grilla.columns.count) semanas")

                    HStack {
                        Text("\(grilla.total) \(grilla.total == 1 ? "día entrenado" : "días entrenados")")
                        Spacer()
                        Text("últimas \(grilla.columns.count) semanas")
                    }
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
                }
            }
            .padding(.top, 12)
        }
        .bottomNavInset()
    }
}

#if DEBUG
#Preview {
    NavigationStack {
        TrainedDaysScreen(store: PreviewData.store())
    }
    .previewSieza()
}
#endif
