import SwiftUI
import WidgetKit

/// El widget chico de calorías: lo mismo que la tarjeta "Calorías" de "Tus
/// objetivos" en la Home.
struct VistaCalorias: View {
    let entrada: EntradaSiezaGym

    private var snapshot: WidgetSnapshot { entrada.snapshot }
    private var tema: Theme { snapshot.tema }
    private var calorias: ResumenCalorias { snapshot.calorias }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("CALORÍAS")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(tema.solido)

            Spacer(minLength: 6)

            if calorias.hasData {
                Dato(tema: tema, valor: "\(calorias.kcal)", rotulo: "de \(calorias.meta) kcal")
                Spacer(minLength: 8)
                BarraProgreso(tema: tema, pct: calorias.pct)
                HStack {
                    Text(calorias.etiqueta)
                    Spacer()
                    Text(calorias.pesoPorDefecto ? "Estimado" : "Medido")
                }
                .font(.system(size: 10))
                .foregroundStyle(tema.texto2)
                .padding(.top, 4)
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

struct CaloriasWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SiezaGymCalorias", provider: ProveedorSiezaGym()) { entrada in
            VistaCalorias(entrada: entrada)
                .containerBackground(for: .widget) { FondoWidget(tema: entrada.snapshot.tema) }
        }
        .configurationDisplayName("Calorías")
        .description("Cuánto llevás de tu meta semanal de calorías.")
        .supportedFamilies([.systemSmall])
    }
}
