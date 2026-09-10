import SwiftUI

struct HomeView: View {
    let store: GymStore
    @State private var workout: WorkoutTarget?

    private let columns = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    HomeHero(store: store) { routine in
                        workout = WorkoutTarget(routine: routine)
                    }

                    WeekStrip(trainedDayKeys: store.trainedDayKeys, streak: store.streak)
                        .padding(.horizontal, 12)

                    VStack(spacing: 8) {
                        MuscleVolumeWidget(volume: store.muscleVolume)

                        // Los cuatro chicos van de a dos; los que llevan
                        // grafico necesitan el ancho completo.
                        LazyVGrid(columns: columns, spacing: 8) {
                            CaloriesWidget(goal: store.calories)
                            IntensityWidget(intensity: store.intensity)
                            PushPullWidget(balance: store.pushPull)
                            CompletionWidget(completion: store.completion)
                        }

                        WeekdayVolumeWidget(days: store.weekdayVolume)
                        VolumeTrendWidget(trend: store.volumeTrend)
                        ZonesWidget(zones: store.zones)
                    }
                    .padding(.horizontal, 12)

                    if let error = store.loadError {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.accentLight)
                            .padding(.top, 4)
                    }
                }
                .padding(.bottom, 24)
            }
            .background(Theme.background)
            .bottomNavInset()
            .scrollIndicators(.hidden)
            .refreshable { await store.load() }
            .navigationDestination(item: $workout) { target in
                WorkoutView(store: store, routine: target.routine)
            }
        }
    }
}

/// Envuelve la rutina para poder navegar con `navigationDestination(item:)`.
struct WorkoutTarget: Hashable, Identifiable {
    let routine: Routine?
    var id: String { routine?.id ?? "libre" }
}

private struct HomeHero: View {
    let store: GymStore
    let onStart: (Routine?) -> Void

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HeroImage(height: 300)
                .overlay {
                    LinearGradient(
                        colors: [.black.opacity(0.15), .black.opacity(0.75)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }

            VStack(alignment: .leading, spacing: 12) {
                Text("GO TIME!")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(1.8)
                    .foregroundStyle(Theme.accent)

                Text(store.featuredRoutine?.name ?? "Entrenamiento libre")
                    .font(.system(size: 38, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)

                Button {
                    onStart(store.featuredRoutine)
                } label: {
                    Label("Empezar", systemImage: "play.fill")
                }
                .buttonStyle(AccentButtonStyle(expands: false))
            }
            .padding(20)
        }
        .frame(height: 300)
        .clipShape(.rect(cornerRadius: 0))
    }
}

/// Tira de la semana: los siete dias, con punto en los que entrenaste.
struct WeekStrip: View {
    let trainedDayKeys: Set<String>
    let streak: Int

    private var days: [(key: String, label: String, number: Int, isToday: Bool)] {
        let calendar = TrainingCalendar.calendar
        let now = Date()
        let todayKey = TrainingCalendar.dayKey(now)
        // Arranca el lunes de esta semana.
        let index = TrainingCalendar.weekdayIndex(now)
        guard let monday = calendar.date(byAdding: .day, value: -index, to: now) else { return [] }

        return (0..<7).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: monday) else { return nil }
            let key = TrainingCalendar.dayKey(date)
            return (
                key: key,
                label: HomeMetrics.dayLabels[offset],
                number: calendar.component(.day, from: date),
                isToday: key == todayKey
            )
        }
    }

    var body: some View {
        SurfaceCard(padding: 12) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    WidgetHeader(title: "Tu semana")
                    if streak > 0 {
                        Text("\(streak) \(streak == 1 ? "día" : "días")")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(Theme.accent)
                    }
                }

                HStack(spacing: 4) {
                    ForEach(days, id: \.key) { day in
                        VStack(spacing: 5) {
                            Text(day.label)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(Theme.cardMuted)
                            Text("\(day.number)")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(day.isToday ? .white : Theme.cardText)
                                .frame(width: 30, height: 30)
                                .background {
                                    if day.isToday {
                                        Circle().fill(Theme.accent)
                                    }
                                }
                            Circle()
                                .fill(trainedDayKeys.contains(day.key) ? Theme.accent : .clear)
                                .frame(width: 5, height: 5)
                        }
                        .frame(maxWidth: .infinity, minHeight: 44)
                    }
                }
            }
        }
    }
}
