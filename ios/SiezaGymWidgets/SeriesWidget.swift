import SwiftUI
import WidgetKit

/// El widget chico de series: lo mismo que la tarjeta "Series" de "Tus
/// objetivos" en la Home.
struct VistaSeries: View {
    let entrada: EntradaSiezaGym

    private var snapshot: WidgetSnapshot { entrada.snapshot }
    private var tema: Theme { snapshot.tema }
    private var series: ResumenSeries { snapshot.series }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("SERIES")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(tema.solido)

            Spacer(minLength: 6)

            if series.hasData {
                Dato(tema: tema, valor: "\(series.pct)%", rotulo: "\(series.completadas) de \(series.totales)")
                Spacer(minLength: 8)
                BarraProgreso(tema: tema, pct: series.pct)
                Text(series.etiqueta)
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
                    .padding(.top, 4)
            } else {
                Spacer()
                Text("Todavía sin series marcadas")
                    .font(.system(size: 12))
                    .foregroundStyle(tema.texto2)
                Spacer()
            }
        }
    }
}

struct SeriesWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SiezaGymSeries", provider: ProveedorSiezaGym()) { entrada in
            VistaSeries(entrada: entrada)
                .containerBackground(for: .widget) { FondoWidget(tema: entrada.snapshot.tema) }
        }
        .configurationDisplayName("Series")
        .description("Qué porcentaje de tus series marcás como hechas.")
        .supportedFamilies([.systemSmall])
    }
}
