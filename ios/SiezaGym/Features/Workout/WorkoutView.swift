import SwiftUI

struct WorkoutView: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    let routine: Routine?

    @State private var draft: WorkoutDraft
    @State private var isSaving = false
    @State private var saveError: String?
    @State private var showFinishConfirm = false
    @State private var showExitConfirm = false
    @Environment(\.dismiss) private var dismiss

    init(store: GymStore, routine: Routine?) {
        self.store = store
        self.routine = routine
        _draft = State(initialValue: WorkoutDraft(routine: routine, catalog: store.catalog))
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar

            ScrollView {
                VStack(spacing: 10) {
                    summary

                    ForEach($draft.exercises) { $exercise in
                        ExerciseCard(exercise: $exercise, draft: draft)
                    }

                    if let saveError {
                        Text(saveError)
                            .font(.system(size: 13))
                            .foregroundStyle(tema.texto)
                    }

                    Button("Terminar entrenamiento") { showFinishConfirm = true }
                        .buttonStyle(AccentButtonStyle())
                        .disabled(!draft.canSave || isSaving)
                        .opacity(draft.canSave ? 1 : 0.5)
                        .overlay { if isSaving { ProgressView().tint(tema.sobreSolido) } }
                        .padding(.top, 4)
                }
                .padding(12)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .tecladoConBotonListo()
        .background { Backdrop() }
        .confirmationDialog(
            "Guardar \(draft.completedSets) series y \(Int(draft.volumeKg).formatted()) kg?",
            isPresented: $showFinishConfirm,
            titleVisibility: .visible
        ) {
            Button("Guardar", action: finish)
            Button("Seguir entrenando", role: .cancel) {}
        }
        .confirmationDialog(
            "¿Salir del entrenamiento?",
            isPresented: $showExitConfirm,
            titleVisibility: .visible
        ) {
            Button("Salir sin guardar", role: .destructive) { dismiss() }
            Button("Seguir entrenando", role: .cancel) {}
        } message: {
            Text("Las series que marcaste no se van a guardar.")
        }
        .interactiveDismissDisabled(draft.completedSets > 0)
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            Button(action: requestExit) {
                Label("Volver", systemImage: "arrow.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(tema.texto)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 44)
                    .background(tema.vidrio(2), in: .capsule)
                    .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
            }
            .disabled(isSaving)

            VStack(alignment: .leading, spacing: 2) {
                Text("Entrenamiento")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(tema.solido)
                    .textCase(.uppercase)
                    .tracking(1)
                Text(routine?.name ?? "Libre")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Circle()
                .fill(tema.solido)
                .frame(width: 9, height: 9)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private func requestExit() {
        if draft.completedSets > 0 {
            showExitConfirm = true
        } else {
            dismiss()
        }
    }

    private var summary: some View {
        SurfaceCard {
            HStack(spacing: 0) {
                // TimelineView redibuja solo este reloj cada segundo, sin
                // invalidar el resto de la pantalla ni el estado de los campos.
                TimelineView(.periodic(from: draft.startedAt, by: 1)) { context in
                    stat(
                        elapsed(since: draft.startedAt, now: context.date),
                        "tiempo"
                    )
                }
                Spacer()
                stat("\(draft.completedSets)/\(draft.totalSets)", "series")
                Spacer()
                stat(Int(draft.volumeKg).formatted(), "kg")
            }
        }
        .overlay(alignment: .top) {
            Capsule()
                .fill(tema.solido)
                .frame(height: 4)
                .padding(.horizontal, 28)
                .padding(.top, 1)
        }
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(tema.texto)
                .monospacedDigit()
            Text(label)
                .font(.system(size: 10))
                .foregroundStyle(tema.texto2)
        }
    }

    private func elapsed(since start: Date, now: Date) -> String {
        let total = max(0, Int(now.timeIntervalSince(start)))
        return String(format: "%02d:%02d", total / 60, total % 60)
    }

    private func finish() {
        isSaving = true
        saveError = nil
        Task {
            defer { isSaving = false }
            do {
                try await store.saveSession(
                    routine: routine,
                    startedAt: draft.startedAt,
                    exercises: draft.loggedExercises()
                )
                dismiss()
            } catch {
                saveError = error.localizedDescription
            }
        }
    }
}

private struct ExerciseCard: View {
    @Environment(\.tema) private var tema
    @Binding var exercise: WorkoutDraft.ExerciseDraft
    let draft: WorkoutDraft

    var body: some View {
        SurfaceCard(padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(exercise.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(tema.texto)
                    Spacer()
                    Text("\(exercise.completedCount)/\(exercise.sets.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(exercise.completedCount == exercise.sets.count
                                         ? tema.solido : tema.texto2)
                }

                ForEach($exercise.sets) { $set in
                    SetRow(set: $set, index: index(of: set), isTimeBased: exercise.isTimeBased)
                }

                Button {
                    draft.addSet(to: exercise.id)
                } label: {
                    Label("Agregar serie", systemImage: "plus")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(tema.texto)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }
        }
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 3)
                .fill(exercise.completedCount > 0 ? tema.solido : tema.borde)
                .frame(width: 3)
                .padding(.vertical, 14)
        }
    }

    private func index(of set: WorkoutDraft.SetDraft) -> Int {
        (exercise.sets.firstIndex { $0.id == set.id } ?? 0) + 1
    }
}

private struct SetRow: View {
    @Environment(\.tema) private var tema
    @Binding var set: WorkoutDraft.SetDraft
    let index: Int
    let isTimeBased: Bool

    var body: some View {
        HStack(spacing: 8) {
            Text("\(index)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(tema.texto2)
                .frame(width: 18)

            if !isTimeBased {
                numberField(value: $set.weight, unit: "kg")
            }
            intField(value: $set.reps, unit: isTimeBased ? "s" : "reps")

            Spacer(minLength: 0)

            // Fallada: el peso se registra pero no suma volumen.
            Button {
                set.failed.toggle()
                if set.failed { set.done = true }
            } label: {
                Image(systemName: set.failed ? "xmark.circle.fill" : "xmark.circle")
                    .font(.system(size: 20))
                    .foregroundStyle(set.failed ? tema.solido : tema.texto2.opacity(0.5))
            }
            .buttonStyle(.plain)

            Button {
                set.done.toggle()
                if !set.done { set.failed = false }
            } label: {
                Image(systemName: set.done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundStyle(set.done ? tema.solido : tema.texto2.opacity(0.5))
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.selection, trigger: set.done)
        }
        .frame(minHeight: 44)
        .opacity(set.failed ? 0.65 : 1)
    }

    private func numberField(value: Binding<Double>, unit: String) -> some View {
        HStack(spacing: 3) {
            TextField("0", value: value, format: .number.precision(.fractionLength(0...1)))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(width: 52)
            Text(unit)
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.black.opacity(0.05), in: .rect(cornerRadius: 8))
    }

    private func intField(value: Binding<Int>, unit: String) -> some View {
        HStack(spacing: 3) {
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(width: 40)
            Text(unit)
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(.black.opacity(0.05), in: .rect(cornerRadius: 8))
    }
}
