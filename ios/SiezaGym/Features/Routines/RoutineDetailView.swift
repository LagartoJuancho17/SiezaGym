import SwiftUI

struct RoutineDetailView: View {
    let routine: Routine
    let store: GymStore
    let onStart: (Routine) -> Void

    private var distribution: [RoutineSummary.MuscleShare] {
        RoutineSummary.muscleDistribution(routine, catalog: store.catalog)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                SurfaceCard {
                    VStack(alignment: .leading, spacing: 10) {
                        WidgetHeader(title: routine.isAssigned ? "Rutina asignada" : "Rutina")
                        Text(routine.name)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(Theme.cardText)
                        HStack(spacing: 14) {
                            stat("\(routine.exercises.count)", "ejercicios")
                            stat("\(routine.totalSets)", "series")
                            stat("\(RoutineSummary.estimatedMinutes(routine, catalog: store.catalog))", "min")
                        }
                        if !routine.note.isEmpty {
                            Text(routine.note)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.cardMuted)
                        }
                    }
                }

                if !distribution.isEmpty {
                    SurfaceCard {
                        VStack(alignment: .leading, spacing: 8) {
                            WidgetHeader(title: "Reparto muscular")
                            ForEach(distribution.prefix(5)) { share in
                                VStack(alignment: .leading, spacing: 3) {
                                    HStack {
                                        Text(share.muscle.label)
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundStyle(Theme.cardText)
                                        Spacer()
                                        Text("\(Int(share.pct * 100))%")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(Theme.cardMuted)
                                    }
                                    WidgetMeter(value: share.pct)
                                }
                            }
                        }
                    }
                }

                ForEach(routine.exercises) { item in
                    SurfaceCard(padding: 12) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(store.name(of: item.exerciseID))
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(Theme.cardText)
                            Text(targetLine(item))
                                .font(.system(size: 12))
                                .foregroundStyle(Theme.cardMuted)
                            if !item.techniqueNote.isEmpty {
                                Text(item.techniqueNote)
                                    .font(.system(size: 12))
                                    .foregroundStyle(Theme.cardMuted)
                                    .italic()
                            }
                        }
                    }
                }

                Button("Empezar entrenamiento") { onStart(routine) }
                    .buttonStyle(AccentButtonStyle())
                    .padding(.top, 6)
            }
            .padding(12)
        }
        .background(Theme.background)
        .navigationTitle(routine.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func targetLine(_ item: RoutineExercise) -> String {
        let isTime = store.exercise(item.exerciseID)?.registrationType.isTimeBased == true
        let unit = isTime ? "s" : " reps"
        var line = "\(item.targetSets) × \(item.targetReps)\(unit)"
        if let weight = item.targetWeight { line += " · \(weight.formatted()) kg" }
        if let rir = item.targetRIR { line += " · RIR \(rir)" }
        return line
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.cardText)
            Text(label)
                .font(.system(size: 10))
                .foregroundStyle(Theme.cardMuted)
        }
    }
}
