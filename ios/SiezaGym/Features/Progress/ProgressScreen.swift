import SwiftUI

/// Progreso, igual que `/progreso` en la web: los tres números de la semana,
/// el volumen semana a semana, los días entrenados, dónde fue el volumen, el
/// balance empuje/tracción y una fila por ejercicio.
struct ProgressScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    private static let semanasGrilla = 26

    private var barras: [ProgressMetrics.WeekBar] {
        ProgressMetrics.volumeByWeek(store.sessions, weeks: 12)
    }
    private var grilla: ProgressMetrics.Grid {
        ProgressMetrics.trainedGrid(store.trainedDayKeys, weeks: Self.semanasGrilla)
    }
    private var ejercicios: [ProgressMetrics.ExerciseRow] {
        ProgressMetrics.byExercise(store.sessions)
    }
    private var entrenamientosSemana: Int { store.weekSessions.count }
    private var hayGifs: Bool {
        ejercicios.contains { store.exercise($0.exerciseID)?.mediaURL != nil }
    }

    var body: some View {
        NavigationStack {
            Pantalla(titulo: "Progreso") {
                StatsCard(datos: [
                    (ProgressMetrics.formatKg(store.weeklyVolumeKg), "esta semana"),
                    ("\(entrenamientosSemana)", entrenamientosSemana == 1 ? "entrenamiento" : "entrenamientos"),
                    (ProgressMetrics.trendLabel(efectividad), "vs semana anterior"),
                ])
                .padding(.top, 20)

                if store.sessions.isEmpty {
                    Vacio(texto: "Todavía no terminaste ningún entrenamiento. Cuando termines el primero, acá vas a ver tu volumen semana a semana.")
                        .padding(.top, 24)
                } else {
                    volumenPorSemana
                    diasEntrenados
                    dondeFueElVolumen
                    empujeYTraccion
                    porEjercicio
                    if hayGifs { CreditoGifs() }
                }
            }
            .bottomNavInset()
        }
    }

    /// Entrenamientos de esta semana contra los de la anterior.
    private var efectividad: Int? {
        let anterior = HomeMetrics.sessionsInLastDays(store.sessions, days: 14).count - entrenamientosSemana
        guard anterior > 0 else { return nil }
        return Int((Double(entrenamientosSemana - anterior) / Double(anterior) * 100).rounded())
    }

    private var volumenPorSemana: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Volumen por semana").padding(.top, 24).padding(.bottom, 10)
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

    private var diasEntrenados: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Días entrenados").padding(.top, 24).padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
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

    @ViewBuilder private var dondeFueElVolumen: some View {
        let musculos = store.muscleVolume
        if !musculos.rows.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel("Dónde fue el volumen").padding(.top, 24).padding(.bottom, 10)
                GlassCard(padding: 16) {
                    VStack(spacing: 11) {
                        ForEach(musculos.rows.prefix(6)) { fila in
                            VStack(spacing: 5) {
                                HStack {
                                    Text(fila.label).font(.system(size: 12)).foregroundStyle(tema.texto)
                                    Spacer()
                                    Text(ProgressMetrics.formatKg(Double(fila.kg)))
                                        .font(.system(size: 12)).foregroundStyle(tema.texto2)
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
            }
        }
    }

    @ViewBuilder private var empujeYTraccion: some View {
        let balance = store.pushPull
        if balance.hasData {
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel("Empuje y tracción").padding(.top, 24).padding(.bottom, 10)
                GlassCard(padding: 16) {
                    VStack(spacing: 12) {
                        GeometryReader { proxy in
                            HStack(spacing: 0) {
                                Rectangle().fill(tema.solido)
                                    .frame(width: proxy.size.width * Double(balance.pct) / 100)
                                Rectangle().fill(tema.vidrio(3))
                            }
                        }
                        .frame(height: 26)
                        .clipShape(.rect(cornerRadius: 9))
                        .accessibilityElement()
                        .accessibilityLabel("Empuje \(balance.pushKg) kilos, tracción \(balance.pullKg) kilos. \(balance.label).")

                        HStack {
                            Text("empuje \(ProgressMetrics.formatKg(Double(balance.pushKg)))")
                            Spacer()
                            Text(balance.label).foregroundStyle(tema.texto3)
                            Spacer()
                            Text("tracción \(ProgressMetrics.formatKg(Double(balance.pullKg)))")
                        }
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                    }
                }
            }
        }
    }

    @ViewBuilder private var porEjercicio: some View {
        if !ejercicios.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel("Por ejercicio").padding(.top, 24).padding(.bottom, 10)
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
                            miniatura: store.exercise(fila.exerciseID)?.mediaURL,
                            chevron: false
                        )
                    }
                }
            }
        }
    }
}
