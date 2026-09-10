import SwiftUI

/// Progreso por ejercicio: mejor 1RM estimado y la evolucion del peso.
/// Se llama ProgressScreen y no ProgressView para no chocar con la de SwiftUI.
struct ProgressScreen: View {
    let store: GymStore

    /// Un renglon por ejercicio entrenado, ordenado por 1RM estimado.
    private var rows: [ExerciseProgress] {
        let bests = HomeMetrics.bestOneRepMaxByExercise(store.sessions)
        return bests
            .map { id, oneRM in
                ExerciseProgress(
                    id: id,
                    name: store.name(of: id),
                    oneRepMax: oneRM,
                    maxWeight: maxWeight(for: id),
                    points: series(for: id)
                )
            }
            .sorted { $0.oneRepMax > $1.oneRepMax }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 8) {
                    if rows.isEmpty && store.hasLoaded {
                        SurfaceCard(padding: 24) {
                            Text("Registrá entrenamientos con peso para ver tu progreso.")
                                .font(.system(size: 14))
                                .foregroundStyle(Theme.cardMuted)
                                .frame(maxWidth: .infinity)
                        }
                    }

                    ForEach(rows) { row in
                        SurfaceCard(padding: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(row.name)
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(Theme.cardText)

                                HStack(spacing: 18) {
                                    stat(row.oneRepMax.formatted(.number.precision(.fractionLength(0))), "1RM est.")
                                    stat(row.maxWeight.formatted(), "máximo real")
                                    stat("\(row.points.count)", "sesiones")
                                }

                                if row.points.count > 1 {
                                    Sparkline(values: row.points)
                                        .frame(height: 44)
                                }

                                // Epley es una formula, no una medicion: el 1RM
                                // real solo se sabe intentandolo.
                                Text("1RM estimado con Epley: peso × (1 + reps/30).")
                                    .font(.system(size: 9))
                                    .foregroundStyle(Theme.cardMuted)
                            }
                        }
                    }
                }
                .padding(12)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .navigationTitle("Progreso")
            .refreshable { await store.load() }
        }
    }

    private func maxWeight(for exerciseID: String) -> Double {
        store.sessions
            .flatMap(\.exercises)
            .filter { $0.exerciseID == exerciseID }
            .flatMap(\.sets)
            .filter { !$0.failed }
            .map(\.weight)
            .max() ?? 0
    }

    /// Mejor 1RM estimado de cada sesion, de la mas vieja a la mas nueva.
    private func series(for exerciseID: String) -> [Double] {
        store.sessions
            .reversed()
            .compactMap { session in
                let sets = session.exercises
                    .filter { $0.exerciseID == exerciseID }
                    .flatMap(\.sets)
                guard let best = Epley.bestSet(sets) else { return nil }
                return Epley.estimatedOneRepMax(best)
            }
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.cardText)
            Text(label)
                .font(.system(size: 9))
                .foregroundStyle(Theme.cardMuted)
        }
    }
}

struct ExerciseProgress: Identifiable {
    let id: String
    let name: String
    let oneRepMax: Double
    let maxWeight: Double
    let points: [Double]
}

/// Linea simple de evolucion. Normaliza entre el minimo y el maximo para que la
/// forma se vea aunque los valores esten todos cerca.
struct Sparkline: View {
    let values: [Double]

    var body: some View {
        GeometryReader { proxy in
            let size = proxy.size
            let low = values.min() ?? 0
            let high = values.max() ?? 1
            let span = high - low

            Path { path in
                for (index, value) in values.enumerated() {
                    let x = values.count > 1
                        ? size.width * Double(index) / Double(values.count - 1)
                        : size.width / 2
                    let normalized = span > 0 ? (value - low) / span : 0.5
                    let y = size.height * (1 - normalized)
                    if index == 0 { path.move(to: CGPoint(x: x, y: y)) }
                    else { path.addLine(to: CGPoint(x: x, y: y)) }
                }
            }
            .stroke(Theme.accent, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
        }
    }
}
