import SwiftUI
import WidgetKit

/// El widget mediano: lo que toca hoy y cómo viene la semana.
struct VistaHoy: View {
    let entrada: EntradaSiezaGym

    private var snapshot: WidgetSnapshot { entrada.snapshot }
    private var tema: Theme { snapshot.tema }

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 0) {
                Text(snapshot.routineName == nil ? "SIEZAGYM" : "HOY TOCA")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(1.2)
                    .foregroundStyle(tema.solido)

                Text(snapshot.routineName ?? "Entrenar libre")
                    .font(.system(size: 19, weight: .bold))
                    .foregroundStyle(tema.texto)
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
                    .padding(.top, 3)

                if snapshot.routineName != nil {
                    Text(detalleRutina)
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                        .lineLimit(1)
                        .padding(.top, 2)
                }

                Spacer(minLength: 8)

                SemanaTira(tema: tema, dias: snapshot.week)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .trailing, spacing: 10) {
                dato("\(snapshot.streak)", snapshot.streak == 1 ? "día" : "días")
                dato(snapshot.volumenCorto, "semana")
            }
        }
    }

    private var detalleRutina: String {
        var partes = ["\(snapshot.routineExercises) ejercicios", "\(snapshot.routineSets) series"]
        if snapshot.routineMinutes > 0 { partes.append("\(snapshot.routineMinutes) min") }
        return partes.joined(separator: " · ")
    }

    private func dato(_ valor: String, _ rotulo: String) -> some View {
        VStack(alignment: .trailing, spacing: 0) {
            Text(valor)
                .font(.system(size: 21, weight: .bold, design: .rounded))
                .foregroundStyle(tema.texto)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(rotulo)
                .font(.system(size: 10))
                .foregroundStyle(tema.texto2)
        }
    }
}

struct HoyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SiezaGymHoy", provider: ProveedorSiezaGym()) { entrada in
            VistaHoy(entrada: entrada)
                .containerBackground(for: .widget) { FondoWidget(tema: entrada.snapshot.tema) }
        }
        .configurationDisplayName("Hoy")
        .description("La rutina que toca, la racha y el volumen de la semana.")
        .supportedFamilies([.systemMedium])
    }
}

@main
struct SiezaGymWidgets: WidgetBundle {
    var body: some Widget {
        RachaWidget()
        HoyWidget()
        EntrenamientoActivity()
    }
}
