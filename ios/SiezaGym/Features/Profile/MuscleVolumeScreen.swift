import SwiftUI

/// Dónde fue el volumen, repartido por grupo muscular.
///
/// Llama a `HomeMetrics.volumeByMuscleGroup` directo y no a `store.muscleVolume`
/// (que se queda en el límite de 3 filas que usa el resumen de Inicio): acá,
/// con la pantalla completa, entran hasta 8.
struct MuscleVolumeScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private var musculos: HomeMetrics.MuscleVolume {
        HomeMetrics.volumeByMuscleGroup(store.sessions, catalog: store.catalog, limit: 8)
    }

    var body: some View {
        Pantalla(titulo: "Músculos", volver: true) {
            if musculos.rows.isEmpty {
                Vacio(texto: "Todavía no hay volumen para repartir entre músculos.")
                    .padding(.top, 12)
            } else {
                GlassCard(padding: 16) {
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
                        // Sale de muscleWeights del catálogo cruzado con el peso
                        // y las reps de cada serie, no de una estimación por
                        // tipo de rutina.
                        Text("Repartido sobre tus últimos \(store.sessions.count) entrenamientos")
                            .font(.system(size: 10))
                            .foregroundStyle(tema.texto3)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.top, 12)
            }
        }
        .bottomNavInset()
    }
}
