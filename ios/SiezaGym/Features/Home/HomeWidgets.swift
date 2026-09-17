import SwiftUI

/// Widget de volumen repartido por musculo. Es el unico que muestra varias
/// filas, por eso ocupa el ancho completo.
struct MuscleVolumeWidget: View {
    @Environment(\.tema) private var tema
    let volume: HomeMetrics.MuscleVolume

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Volumen por músculo")

                if volume.hasData {
                    WidgetValue(value: volume.totalKg.formatted(), unit: "kg totales")
                    VStack(spacing: 8) {
                        ForEach(volume.rows) { row in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(row.label)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(tema.texto)
                                    Spacer()
                                    Text("\(Int(row.pct * 100))%")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(tema.texto2)
                                }
                                WidgetMeter(value: row.pct)
                            }
                        }
                    }
                } else {
                    EmptyWidget(message: "Registrá un entrenamiento para ver el reparto.")
                }
            }
        }
    }
}

struct PushPullWidget: View {
    @Environment(\.tema) private var tema
    let balance: HomeMetrics.PushPull

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Empuje / tracción")
                WidgetValue(value: "\(balance.pct)", unit: "%")
                WidgetMeter(value: Double(balance.pct) / 100)
                HStack {
                    Text(balance.label)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(balance.hasData ? tema.solido : tema.texto2)
                    Spacer()
                    Text("\(balance.pushKg) / \(balance.pullKg) kg")
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                }
            }
        }
    }
}

struct CompletionWidget: View {
    @Environment(\.tema) private var tema
    let completion: HomeMetrics.Completion

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Series completadas")
                WidgetValue(value: "\(completion.pct)", unit: "%")
                WidgetMeter(value: Double(completion.pct) / 100)
                Text(completion.hasData
                     ? "\(completion.completed) de \(completion.total)"
                     : "Sin datos")
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
            }
        }
    }
}

struct IntensityWidget: View {
    @Environment(\.tema) private var tema
    let intensity: HomeMetrics.Intensity

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Intensidad")
                WidgetValue(value: "\(intensity.pct)", unit: "% 1RM")
                WidgetMeter(value: Double(intensity.pct) / 100)
                Text(intensity.label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(intensity.hasData ? tema.solido : tema.texto2)
            }
        }
    }
}

struct CaloriesWidget: View {
    @Environment(\.tema) private var tema
    let goal: HomeMetrics.CalorieGoal

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Calorías semana")
                WidgetValue(value: goal.kcal.formatted(), unit: "kcal")
                WidgetMeter(value: Double(goal.pct) / 100)
                HStack(spacing: 4) {
                    Text(goal.label)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(goal.hasData ? tema.solido : tema.texto2)
                    Spacer()
                    Text("meta \(goal.goal)")
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                }
                // El numero es una estimacion por MET, no una medicion: si
                // ademas falta el peso del perfil hay que decirlo.
                if goal.usesDefaultWeight {
                    Text("Estimado con 75 kg. Cargá tu peso en Perfil.")
                        .font(.system(size: 9))
                        .foregroundStyle(tema.texto2)
                }
            }
        }
    }
}

/// Barras de volumen por dia de la semana.
struct WeekdayVolumeWidget: View {
    @Environment(\.tema) private var tema
    let days: [HomeMetrics.WeekdayVolume]

    private var hasData: Bool { days.contains { $0.kg > 0 } }

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Volumen por día")

                if hasData {
                    HStack(alignment: .bottom, spacing: 6) {
                        ForEach(days) { day in
                            VStack(spacing: 6) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(day.pct >= 1 ? tema.solido : tema.solido)
                                    .frame(height: max(4, 70 * day.pct))
                                Text(day.label)
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(tema.texto2)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 92, alignment: .bottom)
                } else {
                    EmptyWidget(message: "Todavía no hay sesiones esta semana.")
                }
            }
        }
    }
}

/// Tendencia de volumen sesión a sesión, de la más vieja a la más nueva.
struct VolumeTrendWidget: View {
    @Environment(\.tema) private var tema
    let trend: HomeMetrics.VolumeTrend

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Volumen por sesión")

                if trend.hasData {
                    WidgetValue(value: trend.averageKg.formatted(), unit: "kg promedio")
                    let peak = trend.points.max() ?? 1
                    HStack(alignment: .bottom, spacing: 5) {
                        ForEach(Array(trend.points.enumerated()), id: \.offset) { index, kg in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(index == trend.points.count - 1 ? tema.solido : tema.solido)
                                .frame(height: max(4, 60 * (peak > 0 ? Double(kg) / Double(peak) : 0)))
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 64, alignment: .bottom)
                } else {
                    EmptyWidget(message: "Necesitás al menos una sesión registrada.")
                }
            }
        }
    }
}

/// Reparto de series por zona de intensidad, como % del mejor 1RM estimado.
struct ZonesWidget: View {
    @Environment(\.tema) private var tema
    let zones: HomeMetrics.Zones

    var body: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 10) {
                WidgetHeader(title: "Zonas de intensidad")

                if zones.hasData {
                    GeometryReader { proxy in
                        HStack(spacing: 2) {
                            ForEach(HomeMetrics.Zone.allCases.reversed(), id: \.self) { zone in
                                let share = zones.share(zone)
                                if share > 0 {
                                    Rectangle()
                                        .fill(color(zone))
                                        .frame(width: proxy.size.width * share)
                                }
                            }
                        }
                    }
                    .frame(height: 20)
                    .clipShape(.rect(cornerRadius: 4))

                    HStack(spacing: 12) {
                        ForEach(HomeMetrics.Zone.allCases.reversed().filter { zones.count($0) > 0 }, id: \.self) { zone in
                            HStack(spacing: 4) {
                                Circle().fill(color(zone)).frame(width: 6, height: 6)
                                Text("\(zone.label) \(zones.count(zone))")
                                    .font(.system(size: 9, weight: .semibold))
                                    .foregroundStyle(tema.texto2)
                            }
                        }
                    }
                } else {
                    EmptyWidget(message: "Cargá pesos para medir la intensidad.")
                }
            }
        }
    }

    private func color(_ zone: HomeMetrics.Zone) -> Color {
        switch zone {
        case .peak: tema.solido
        case .high: tema.solido
        case .med: tema.solido
        case .light: tema.texto3
        }
    }
}

struct EmptyWidget: View {
    @Environment(\.tema) private var tema
    let message: String

    var body: some View {
        Text(message)
            .font(.system(size: 11))
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
    }
}
