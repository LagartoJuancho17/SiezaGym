import SwiftUI
import WidgetKit

/// El widget chico de músculos: el mismo reparto que "Músculos que trabaja"
/// en Progreso, con las tres barras más grandes.
struct VistaMusculos: View {
    let entrada: EntradaSiezaGym

    private var snapshot: WidgetSnapshot { entrada.snapshot }
    private var tema: Theme { snapshot.tema }
    private var musculos: ResumenMusculos { snapshot.musculos }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MÚSCULOS")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(tema.solido)

            if musculos.hasData {
                Spacer(minLength: 2)
                ForEach(musculos.filas) { fila in
                    FilaVolumenMuscular(tema: tema, fila: fila)
                }
            } else {
                Spacer()
                Text("Todavía sin entrenamientos")
                    .font(.system(size: 12))
                    .foregroundStyle(tema.texto2)
                Spacer()
            }
        }
    }
}

private struct FilaVolumenMuscular: View {
    let tema: Theme
    let fila: FilaMusculo

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(fila.musculo)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
                Spacer(minLength: 4)
                Text("\(fila.kg) kg")
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
                    .lineLimit(1)
            }
            BarraProgreso(tema: tema, pct: Int((fila.pct * 100).rounded()))
        }
    }
}

struct MusculosWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SiezaGymMusculos", provider: ProveedorSiezaGym()) { entrada in
            VistaMusculos(entrada: entrada)
                .containerBackground(for: .widget) { FondoWidget(tema: entrada.snapshot.tema) }
        }
        .configurationDisplayName("Músculos")
        .description("Qué grupos musculares trabajaste más.")
        .supportedFamilies([.systemSmall])
    }
}
