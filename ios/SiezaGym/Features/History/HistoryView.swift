import SwiftUI

struct HistoryView: View {
    let store: GymStore

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 8) {
                    if store.sessions.isEmpty && store.hasLoaded {
                        SurfaceCard(padding: 24) {
                            Text("Todavía no registraste entrenamientos.")
                                .font(.system(size: 14))
                                .foregroundStyle(Theme.cardMuted)
                                .frame(maxWidth: .infinity)
                        }
                    }

                    ForEach(store.sessions) { session in
                        NavigationLink {
                            SessionDetailView(session: session, store: store)
                        } label: {
                            SessionRow(session: session, store: store)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(12)
            }
            .background(Theme.background)
            .bottomNavInset()
            .scrollIndicators(.hidden)
            .navigationTitle("Historial")
            .refreshable { await store.load() }
        }
    }
}

struct SessionRow: View {
    let session: WorkoutSession
    let store: GymStore

    var body: some View {
        SurfaceCard(padding: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(session.routineName ?? "Entrenamiento libre")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.cardText)
                    Spacer()
                    if let finishedAt = session.finishedAt {
                        Text(finishedAt.formatted(.dateTime.day().month(.abbreviated)))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(Theme.cardMuted)
                    }
                }
                HStack(spacing: 12) {
                    meta("square.stack.3d.up.fill", "\(session.totalSetsCompleted) series")
                    meta("scalemass.fill", "\(Int(session.totalVolumeKg).formatted()) kg")
                    meta("clock", "\(HomeMetrics.sessionSeconds(session) / 60) min")
                }
            }
        }
    }

    private func meta(_ symbol: String, _ text: String) -> some View {
        HStack(spacing: 3) {
            Image(systemName: symbol).font(.system(size: 9))
            Text(text).font(.system(size: 11))
        }
        .foregroundStyle(Theme.cardMuted)
    }
}

struct SessionDetailView: View {
    let session: WorkoutSession
    let store: GymStore

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                SurfaceCard {
                    HStack {
                        stat("\(session.totalSetsCompleted)", "series")
                        Spacer()
                        stat(Int(session.totalVolumeKg).formatted(), "kg")
                        Spacer()
                        stat("\(HomeMetrics.sessionSeconds(session) / 60)", "min")
                        Spacer()
                        stat(
                            "\(HomeMetrics.calories(for: session, bodyWeightKg: store.profile?.bodyWeightKg))",
                            "kcal est."
                        )
                    }
                }

                ForEach(session.exercises) { exercise in
                    SurfaceCard(padding: 12) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(store.name(of: exercise.exerciseID))
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(Theme.cardText)

                            ForEach(exercise.sets) { set in
                                HStack {
                                    Text("Serie \(set.setNumber)")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Theme.cardMuted)
                                    Spacer()
                                    if set.failed {
                                        Text("fallada")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(Theme.accentHover)
                                    }
                                    Text("\(set.weight.formatted()) kg × \(set.reps)")
                                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                                        .foregroundStyle(Theme.cardText)
                                        .strikethrough(set.failed)
                                }
                                .frame(minHeight: 28)
                            }
                        }
                    }
                }
            }
            .padding(12)
        }
        .background(Theme.background)
        .navigationTitle(session.finishedAt?.formatted(.dateTime.day().month().year()) ?? "Sesión")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.cardText)
            Text(label)
                .font(.system(size: 10))
                .foregroundStyle(Theme.cardMuted)
        }
    }
}
