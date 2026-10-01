import SwiftUI

/// El volumen en tres vistas: semana a semana, por día de la semana y las
/// últimas sesiones. Antes vivía repartido entre `/progreso` y datos que
/// `HomeMetrics` ya calculaba pero ninguna pantalla mostraba.
struct VolumeScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private var barras: [ProgressMetrics.WeekBar] {
        ProgressMetrics.volumeByWeek(store.sessions, weeks: 12)
    }
    private var porDia: [HomeMetrics.WeekdayVolume] { store.weekdayVolume }
    private var tendencia: HomeMetrics.VolumeTrend { store.volumeTrend }

    var body: some View {
        Pantalla(titulo: "Volumen", volver: true) {
            porSemana.padding(.top, 12)
            porDiaDeLaSemana
            if tendencia.hasData { ultimasSesiones }
        }
        .bottomNavInset()
    }

    private var porSemana: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Por semana").padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(spacing: 12) {
                    HStack(alignment: .bottom, spacing: 4) {
                        ForEach(barras) { barra in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(barra.isEmpty ? tema.texto3.opacity(0.35) : tema.solido)
                                .frame(height: max(4, 96 * barra.height))
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 96, alignment: .bottom)

                    HStack {
                        Text("hace \(barras.count) semanas")
                        Spacer()
                        Text(mejorSemana).foregroundStyle(tema.texto3)
                        Spacer()
                        Text("esta semana")
                    }
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
                }
            }
        }
    }

    private var mejorSemana: String {
        let mejor = barras.map(\.kg).max() ?? 0
        return mejor > 0 ? "mejor \(ProgressMetrics.formatKg(mejor))" : "sin volumen todavía"
    }

    /// Nuevo: qué día de la semana concentra más volumen, para saber si el
    /// reparto de la rutina se cumple en la práctica.
    private var porDiaDeLaSemana: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Por día de la semana").padding(.top, 24).padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(spacing: 10) {
                    HStack(alignment: .bottom, spacing: 6) {
                        ForEach(porDia) { dia in
                            VStack(spacing: 6) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(dia.kg > 0 ? tema.solido : tema.texto3.opacity(0.35))
                                    .frame(height: max(4, 72 * dia.pct))
                                Text(dia.label)
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundStyle(tema.texto3)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 90, alignment: .bottom)

                    if let mejorDia = porDia.max(by: { $0.kg < $1.kg }), mejorDia.kg > 0 {
                        Text("\(mejorDia.label.capitalized) concentra más volumen")
                            .font(.system(size: 10))
                            .foregroundStyle(tema.texto2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
    }

    /// Nuevo: las últimas sesiones, para ver si el volumen viene subiendo o
    /// bajando entrenamiento a entrenamiento y no solo semana a semana.
    private var ultimasSesiones: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Últimas sesiones").padding(.top, 24).padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(spacing: 12) {
                    let maximo = tendencia.points.max() ?? 0
                    HStack(alignment: .bottom, spacing: 6) {
                        ForEach(Array(tendencia.points.enumerated()), id: \.offset) { _, kg in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(kg > 0 ? tema.solido : tema.texto3.opacity(0.35))
                                .frame(height: maximo > 0 ? max(4, 72 * Double(kg) / Double(maximo)) : 4)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 72, alignment: .bottom)

                    HStack {
                        Text("\(tendencia.points.count) entrenamientos")
                        Spacer()
                        Text("promedio \(ProgressMetrics.formatKg(Double(tendencia.averageKg)))")
                    }
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto2)
                }
            }
        }
    }
}

#if DEBUG
#Preview {
    NavigationStack {
        VolumeScreen(store: PreviewData.store())
    }
    .previewSieza()
}
#endif
