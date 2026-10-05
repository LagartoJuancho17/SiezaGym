import SwiftUI

/// Los dos gráficos que se ven directo en el Perfil, sin entrar a otra
/// pantalla: los días entrenados (estilo contribuciones de GitHub) y el
/// reparto del volumen por músculo. Antes cada uno era su propia pantalla
/// (`TrainedDaysScreen`, `MuscleVolumeScreen`) detrás de una tarjeta.

/// La grilla de días entrenados de las últimas semanas.
struct GrillaDiasEntrenados: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    var semanas = 26

    private var grilla: ProgressMetrics.Grid {
        ProgressMetrics.trainedGrid(store.trainedDayKeys, weeks: semanas)
    }

    var body: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                EncabezadoGrafico(icono: "calendar", titulo: "Días entrenados", valor: "\(store.trainedDayKeys.count) en total")

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
    }
}

/// Dónde fue el volumen, repartido por grupo muscular.
///
/// Llama a `HomeMetrics.volumeByMuscleGroup` directo y no a `store.muscleVolume`
/// (que se queda en las 3 filas del resumen de Inicio): acá entran hasta 8.
struct RepartoMusculos: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    var limite = 8

    private var musculos: HomeMetrics.MuscleVolume {
        HomeMetrics.volumeByMuscleGroup(store.sessions, catalog: store.catalog, limit: limite)
    }

    var body: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                EncabezadoGrafico(
                    icono: "figure.strengthtraining.traditional",
                    titulo: "Músculos",
                    valor: musculos.rows.first.map { "Más trabajado: \($0.label)" } ?? ""
                )

                if musculos.rows.isEmpty {
                    Text("Todavía no hay volumen para repartir entre músculos.")
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto2)
                } else {
                    VStack(spacing: 11) {
                        ForEach(musculos.rows) { fila in
                            VStack(spacing: 5) {
                                HStack {
                                    Text(fila.label).font(.system(size: 13)).foregroundStyle(tema.texto)
                                    Spacer()
                                    Text(ProgressMetrics.formatKg(Double(fila.kg)))
                                        .font(.system(size: 13)).foregroundStyle(tema.texto2)
                                }
                                WidgetMeter(value: fila.pct)
                            }
                        }
                    }
                    // Sale de muscleWeights del catálogo cruzado con el peso y
                    // las reps de cada serie, no de una estimación por rutina.
                    Text("Repartido sobre tus últimos \(store.sessions.count) entrenamientos")
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto3)
                }
            }
        }
    }
}

/// Ícono, título y el dato principal arriba de cada gráfico.
private struct EncabezadoGrafico: View {
    @Environment(\.tema) private var tema
    let icono: String
    let titulo: String
    let valor: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icono)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(tema.solido)
            Text(titulo)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(tema.texto)
            Spacer(minLength: 8)
            Text(valor)
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
                .lineLimit(1)
                .minimumScaleFactor(0.85)
        }
    }
}

#if DEBUG
#Preview("Gráficos del perfil") {
    ScrollView {
        VStack(spacing: 12) {
            GrillaDiasEntrenados(store: PreviewData.store())
            RepartoMusculos(store: PreviewData.store())
        }
        .padding()
    }
    .previewSieza()
}
#endif
