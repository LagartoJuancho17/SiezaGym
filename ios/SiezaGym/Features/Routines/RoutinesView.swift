import SwiftUI

struct RoutinesView: View {
    let store: GymStore
    @State private var workout: WorkoutTarget?

    /// Meses de mas nuevo a mas viejo, y dentro de cada uno las semanas.
    private var months: [MonthGroup] { MonthGroup.group(store.routines) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    hero

                    if store.routines.isEmpty && store.hasLoaded {
                        SurfaceCard(padding: 24) {
                            VStack(spacing: 10) {
                                Text("Todavía no tenés rutinas.")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(Theme.cardText)
                                Text("Creá una desde la web y aparece acá.")
                                    .font(.system(size: 12))
                                    .foregroundStyle(Theme.cardMuted)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.horizontal, 12)
                    }

                    ForEach(months) { month in
                        MonthSection(month: month, store: store) { routine in
                            workout = WorkoutTarget(routine: routine)
                        }
                        .padding(.horizontal, 12)
                    }
                }
                .padding(.bottom, 24)
            }
            .background(Theme.background)
            .scrollIndicators(.hidden)
            .refreshable { await store.load() }
            .navigationDestination(item: $workout) { target in
                WorkoutView(store: store, routine: target.routine)
            }
        }
    }

    private var hero: some View {
        ZStack(alignment: .bottomLeading) {
            HeroImage(height: 190)
                .overlay {
                    LinearGradient(
                        colors: [.black.opacity(0.2), .black.opacity(0.7)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
            Text("Rutinas")
                .font(.system(size: 40, weight: .bold))
                .foregroundStyle(.white)
                .padding(20)
        }
        .frame(height: 190)
    }
}

/// Un mes con sus semanas. Mismo criterio que `lib/routines/schedule.js`.
struct MonthGroup: Identifiable {
    let id: String
    let label: String
    let weeks: [WeekGroup]
    var total: Int { weeks.reduce(0) { $0 + $1.routines.count } }

    struct WeekGroup: Identifiable {
        let id: Int
        var label: String { "Semana \(id)" }
        let routines: [Routine]
    }

    static func group(_ routines: [Routine]) -> [MonthGroup] {
        let calendar = TrainingCalendar.calendar
        var buckets: [String: [Int: [Routine]]] = [:]
        var labels: [String: String] = [:]

        for routine in routines {
            guard let date = routine.referenceDate else { continue }
            let parts = calendar.dateComponents([.year, .month, .day], from: date)
            guard let year = parts.year, let month = parts.month, let day = parts.day else { continue }
            let key = String(format: "%04d-%02d", year, month)
            labels[key] = TrainingCalendar.monthLabel(year: year, month: month)
            buckets[key, default: [:]][TrainingCalendar.weekOfMonth(day: day), default: []].append(routine)
        }

        return buckets.keys.sorted(by: >).map { key in
            MonthGroup(
                id: key,
                label: labels[key] ?? key,
                weeks: buckets[key]!.keys.sorted().map { week in
                    WeekGroup(id: week, routines: buckets[key]![week]!)
                }
            )
        }
    }
}

private struct MonthSection: View {
    let month: MonthGroup
    let store: GymStore
    let onStart: (Routine) -> Void

    @State private var isOpen: Bool

    init(month: MonthGroup, store: GymStore, onStart: @escaping (Routine) -> Void) {
        self.month = month
        self.store = store
        self.onStart = onStart
        // El mes en curso arranca abierto.
        let now = TrainingCalendar.calendar.dateComponents([.year, .month], from: Date())
        let currentKey = String(format: "%04d-%02d", now.year ?? 0, now.month ?? 0)
        _isOpen = State(initialValue: month.id == currentKey)
    }

    var body: some View {
        VStack(spacing: 6) {
            Button {
                withAnimation(.smooth(duration: 0.25)) { isOpen.toggle() }
            } label: {
                HStack {
                    Label(month.label, systemImage: "calendar")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.cardText)
                    Spacer()
                    Text("\(month.total) \(month.total == 1 ? "rutina" : "rutinas")")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.cardMuted)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Theme.cardText)
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                }
                .padding(14)
                .background(Theme.surface, in: .rect(cornerRadius: Theme.radius))
                .overlay {
                    RoundedRectangle(cornerRadius: Theme.radius)
                        .strokeBorder(Theme.hairline, lineWidth: 1)
                }
            }
            .buttonStyle(.plain)

            if isOpen {
                ForEach(month.weeks) { week in
                    WeekSection(week: week, store: store, onStart: onStart)
                }
            }
        }
    }
}

private struct WeekSection: View {
    let week: MonthGroup.WeekGroup
    let store: GymStore
    let onStart: (Routine) -> Void

    @State private var isOpen = true

    var body: some View {
        VStack(spacing: 6) {
            Button {
                withAnimation(.smooth(duration: 0.25)) { isOpen.toggle() }
            } label: {
                HStack {
                    Text(week.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.cardText)
                    Spacer()
                    Text("\(week.routines.count)")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.cardMuted)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.cardText)
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Theme.surface.opacity(0.9), in: .rect(cornerRadius: Theme.radius))
                .overlay {
                    RoundedRectangle(cornerRadius: Theme.radius)
                        .strokeBorder(Theme.hairline.opacity(0.6), lineWidth: 1)
                }
            }
            .buttonStyle(.plain)
            .padding(.leading, 10)

            if isOpen {
                ForEach(week.routines) { routine in
                    NavigationLink {
                        RoutineDetailView(routine: routine, store: store, onStart: onStart)
                    } label: {
                        RoutineRow(routine: routine, store: store)
                    }
                    .buttonStyle(.plain)
                    .padding(.leading, 10)
                }
            }
        }
    }
}

struct RoutineRow: View {
    let routine: Routine
    let store: GymStore

    var body: some View {
        HStack(spacing: 0) {
            HeroImage(height: 72, width: 72)

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top) {
                    Text(routine.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.cardText)
                        .lineLimit(1)
                    Spacer(minLength: 6)
                    if routine.isAssigned {
                        Text("ASIGNADA")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(Theme.accent)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Theme.accent.opacity(0.12), in: .capsule)
                    }
                }

                HStack(spacing: 10) {
                    meta("dumbbell.fill", "\(routine.exercises.count)")
                    meta("square.stack.3d.up.fill", "\(routine.totalSets) series")
                    meta("clock", "\(RoutineSummary.estimatedMinutes(routine, catalog: store.catalog)) min")
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)

            Spacer(minLength: 0)

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Theme.cardMuted)
                .padding(.trailing, 12)
        }
        .frame(height: 72)
        .background(Theme.surface, in: .rect(cornerRadius: Theme.radius))
        .overlay {
            RoundedRectangle(cornerRadius: Theme.radius)
                .strokeBorder(Theme.hairline, lineWidth: 1)
        }
        .clipShape(.rect(cornerRadius: Theme.radius))
    }

    private func meta(_ symbol: String, _ text: String) -> some View {
        HStack(spacing: 3) {
            Image(systemName: symbol).font(.system(size: 9))
            Text(text).font(.system(size: 11))
        }
        .foregroundStyle(Theme.cardMuted)
    }
}
