import SwiftUI

/// Una fila por ejercicio: cuántas veces lo entrenaste y tu mejor 1RM
/// estimado. Con pantalla propia entran más de los 12 que se mostraban en
/// `/progreso`.
struct ExerciseHistoryScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private var ejercicios: [ProgressMetrics.ExerciseRow] {
        ProgressMetrics.byExercise(store.sessions, limit: 30)
    }
    private var hayGifs: Bool {
        ejercicios.contains { store.exercise($0.exerciseID)?.mediaURL != nil }
    }

    var body: some View {
        Pantalla(titulo: "Por ejercicio", volver: true) {
            if ejercicios.isEmpty {
                Vacio(texto: "Todavía no terminaste ningún entrenamiento.")
                    .padding(.top, 12)
            } else {
                PanelLista {
                    ForEach(Array(ejercicios.enumerated()), id: \.element.id) { indice, fila in
                        if indice > 0 {
                            Rectangle().fill(tema.borde).frame(height: 1)
                        }
                        FilaLista(
                            nombre: store.name(of: fila.exerciseID),
                            detalle: "\(fila.sessions) \(fila.sessions == 1 ? "entrenamiento" : "entrenamientos")",
                            valor: fila.bestOneRepMax > 0 ? "\(fila.bestOneRepMax.formatted()) kg" : nil,
                            unidad: fila.bestOneRepMax > 0 ? "1RM est." : nil,
                            miniatura: store.exercise(fila.exerciseID)?.thumbnailURL,
                            chevron: false
                        )
                    }
                }
                .padding(.top, 12)
                if hayGifs { CreditoGifs() }
            }
        }
        .bottomNavInset()
    }
}

#if DEBUG
#Preview {
    NavigationStack {
        ExerciseHistoryScreen(store: PreviewData.store())
    }
    .previewSieza()
}
#endif
