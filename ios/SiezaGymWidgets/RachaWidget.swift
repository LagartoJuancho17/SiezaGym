import SwiftUI
import WidgetKit

struct EntradaSiezaGym: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot

    static let muestra = EntradaSiezaGym(
        date: .now,
        snapshot: WidgetSnapshot(
            themeID: "noche",
            streak: 12,
            week: [true, false, true, true, false, true, false],
            weeklyVolumeKg: 4820,
            weeklySessions: 4,
            routineName: "Empuje A",
            routineExercises: 6,
            routineSets: 18,
            routineMinutes: 52,
            lastSessionAt: .now,
            updatedAt: .now
        )
    )
}

struct ProveedorSiezaGym: TimelineProvider {
    func placeholder(in context: Context) -> EntradaSiezaGym { .muestra }

    /// La galería de widgets: ahí se muestra el ejemplo, no los datos reales.
    func getSnapshot(in context: Context, completion: @escaping (EntradaSiezaGym) -> Void) {
        completion(context.isPreview ? .muestra : entradaActual())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<EntradaSiezaGym>) -> Void) {
        // Una sola entrada: los datos no cambian solos, los cambia la app, y
        // cuando los cambia llama a `reloadAllTimelines`. La recarga a
        // medianoche es para que la tira de la semana y la racha pasen de día
        // aunque no se abra la app.
        let manana = TrainingCalendar.calendar.startOfDay(
            for: TrainingCalendar.calendar.date(byAdding: .day, value: 1, to: .now) ?? .now
        )
        completion(Timeline(entries: [entradaActual()], policy: .after(manana)))
    }

    private func entradaActual() -> EntradaSiezaGym {
        EntradaSiezaGym(date: .now, snapshot: SnapshotStore.leer() ?? .vacio)
    }
}

// MARK: - Racha

struct VistaRacha: View {
    @Environment(\.widgetFamily) private var familia
    let entrada: EntradaSiezaGym

    private var snapshot: WidgetSnapshot { entrada.snapshot }
    private var tema: Theme { snapshot.tema }

    var body: some View {
        switch familia {
        case .accessoryCircular: circular
        case .accessoryInline: Text("Racha \(snapshot.streak) días")
        case .accessoryRectangular: rectangular
        default: cuadrado
        }
    }

    private var cuadrado: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("SIEZAGYM")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(tema.solido)

            Spacer(minLength: 6)

            Dato(
                tema: tema,
                valor: "\(snapshot.streak)",
                rotulo: snapshot.streak == 1 ? "día de racha" : "días de racha"
            )

            Spacer(minLength: 8)

            SemanaTira(tema: tema, dias: snapshot.week)
        }
    }

    private var circular: some View {
        // En la pantalla bloqueada el sistema pinta todo de un solo color: los
        // colores del tema no se aplican y el dibujo tiene que leerse en mono.
        Gauge(value: Double(min(snapshot.trainedThisWeek, 7)), in: 0...7) {
            Image(systemName: "flame.fill")
        } currentValueLabel: {
            Text("\(snapshot.streak)")
        }
        .gaugeStyle(.accessoryCircular)
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Racha \(snapshot.streak) días")
                .font(.system(size: 15, weight: .semibold))
            Text("\(snapshot.trainedThisWeek) de 7 días esta semana")
                .font(.system(size: 12))
            if let rutina = snapshot.routineName {
                Text(rutina).font(.system(size: 12)).foregroundStyle(.secondary)
            }
        }
    }
}

struct RachaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SiezaGymRacha", provider: ProveedorSiezaGym()) { entrada in
            VistaRacha(entrada: entrada)
                .containerBackground(for: .widget) { FondoWidget(tema: entrada.snapshot.tema) }
        }
        .configurationDisplayName("Racha")
        .description("Los días seguidos que venís entrenando y la semana en curso.")
        .supportedFamilies([
            .systemSmall,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
