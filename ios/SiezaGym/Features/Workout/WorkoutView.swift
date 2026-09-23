import AudioToolbox
import Combine
import SwiftUI

struct WorkoutView: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    let routine: Routine?

    @Environment(ThemeStore.self) private var temas
    @State private var actividad = LiveActivityController()
    @State private var draft: WorkoutDraft
    @State private var isSaving = false
    @State private var saveError: String?
    @State private var showFinishConfirm = false
    @State private var showExitConfirm = false
    @State private var restTimerSeconds: Int? = nil
    @State private var previewExercise: WorkoutDraft.ExerciseDraft? = nil
    @Environment(\.dismiss) private var dismiss

    private let secondTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(store: GymStore, routine: Routine?, existingDraft: WorkoutDraft? = nil) {
        self.store = store
        self.routine = routine ?? existingDraft?.routine
        if let existingDraft {
            _draft = State(initialValue: existingDraft)
        } else {
            _draft = State(initialValue: WorkoutDraft(routine: routine, catalog: store.catalog))
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar

            ScrollView {
                VStack(spacing: 12) {
                    summary

                    if let seconds = restTimerSeconds, seconds > 0 {
                        restTimerCard(seconds: seconds)
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    ForEach($draft.exercises) { $exercise in
                        ExerciseCard(
                            exercise: $exercise,
                            draft: draft,
                            onSetCompleted: handleSetCompleted,
                            onShowMedia: { previewExercise = exercise }
                        )
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
        .task {
            actividad.comenzar(
                routineName: routine?.name ?? "Entrenamiento libre",
                startedAt: draft.startedAt,
                themeID: temas.actual.id,
                estado: estadoActividad
            )
        }
        .onChange(of: estadoActividad) { _, nuevo in actividad.actualizar(nuevo) }
        .onDisappear {
            if store.activeWorkout == nil {
                actividad.terminar(estadoActividad)
            }
        }
        .onReceive(secondTimer) { _ in
            guard let current = restTimerSeconds, current > 0 else { return }
            if current <= 1 {
                restTimerSeconds = nil
                AudioServicesPlaySystemSound(1005)
            } else {
                restTimerSeconds = current - 1
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .terminarSerieDesdeWidget)) { _ in
            completeNextSet()
        }
        .sheet(item: $previewExercise) { exercise in
            ExerciseMediaSheet(exercise: exercise)
        }
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
            "¿Descartar entrenamiento?",
            isPresented: $showExitConfirm,
            titleVisibility: .visible
        ) {
            Button("Descartar y salir", role: .destructive) {
                store.activeWorkout = nil
                actividad.terminar(estadoActividad)
                dismiss()
            }
            Button("Seguir entrenando", role: .cancel) {}
        } message: {
            Text("Se perderán las series registradas en esta sesión.")
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            Button(action: requestExit) {
                Label("Volver", systemImage: "arrow.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(tema.texto)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 40)
                    .background(tema.vidrio(2), in: .capsule)
                    .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
            }
            .disabled(isSaving)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("Entrenamiento")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(tema.solido)
                        .textCase(.uppercase)
                        .tracking(1)

                    Text("• STANDBY AL VOLVER")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(tema.texto2)
                }
                Text(routine?.name ?? "Libre")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                showExitConfirm = true
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(tema.texto2)
                    .frame(width: 36, height: 36)
                    .background(tema.vidrio(2), in: .circle)
                    .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }
            }
            .disabled(isSaving)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private func requestExit() {
        store.activeWorkout = draft
        dismiss()
    }

    private func handleSetCompleted() {
        AudioServicesPlaySystemSound(1057)
        withAnimation(.spring(duration: 0.3)) {
            restTimerSeconds = 90
        }
    }

    private func completeNextSet() {
        for exerciseIndex in draft.exercises.indices {
            if let setIndex = draft.exercises[exerciseIndex].sets.firstIndex(where: { !$0.done }) {
                draft.exercises[exerciseIndex].sets[setIndex].done = true
                handleSetCompleted()
                break
            }
        }
    }

    private var summary: some View {
        SurfaceCard {
            HStack(spacing: 0) {
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

    private func restTimerCard(seconds: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "timer")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(tema.solido)

            VStack(alignment: .leading, spacing: 2) {
                Text("Descanso")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(tema.texto2)
                    .textCase(.uppercase)
                Text(String(format: "%02d:%02d", seconds / 60, seconds % 60))
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(tema.texto)
                    .monospacedDigit()
            }

            Spacer()

            HStack(spacing: 6) {
                Button("−15s") {
                    restTimerSeconds = max(1, seconds - 15)
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(tema.vidrio(2), in: .capsule)

                Button("+30s") {
                    restTimerSeconds = seconds + 30
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(tema.vidrio(2), in: .capsule)

                Button("Saltar") {
                    withAnimation { restTimerSeconds = nil }
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(tema.texto2)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(tema.vidrio(2), in: .rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(tema.solido.opacity(0.35), lineWidth: 1)
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

    private var estadoActividad: WorkoutActivityAttributes.ContentState {
        WorkoutActivityState.contenido(
            draft.exercises.map {
                WorkoutProgress(
                    exerciseName: $0.name,
                    doneSets: $0.completedCount,
                    totalSets: $0.sets.count
                )
            },
            volumeKg: draft.volumeKg
        )
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
                store.activeWorkout = nil
                actividad.terminar(estadoActividad)
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
    let onSetCompleted: () -> Void
    let onShowMedia: () -> Void

    var body: some View {
        SurfaceCard(padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Text(exercise.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)

                    if exercise.mediaURL != nil || exercise.videoURL != nil {
                        Button(action: onShowMedia) {
                            HStack(spacing: 4) {
                                Image(systemName: "play.circle.fill")
                                Text(exercise.mediaURL != nil ? "GIF" : "Video")
                            }
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(tema.solido)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(tema.vidrio(2), in: .capsule)
                            .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
                        }
                        .buttonStyle(.plain)
                    }

                    Spacer()

                    Text("\(exercise.completedCount)/\(exercise.sets.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(exercise.completedCount == exercise.sets.count
                                         ? tema.solido : tema.texto2)
                }

                ForEach($exercise.sets) { $set in
                    SetRow(
                        set: $set,
                        index: index(of: set),
                        isTimeBased: exercise.isTimeBased,
                        onCompleted: onSetCompleted
                    )
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
    let onCompleted: () -> Void

    var body: some View {
        HStack(spacing: 6) {
            Text("\(index)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(tema.texto2)
                .frame(width: 16)

            if !isTimeBased {
                weightStepper(value: $set.weight)
            }
            intField(value: $set.reps, unit: isTimeBased ? "s" : "reps")

            Spacer(minLength: 0)

            // Fallada: el peso se registra pero no suma volumen.
            Button {
                set.failed.toggle()
                if set.failed {
                    set.done = true
                    onCompleted()
                }
            } label: {
                Image(systemName: set.failed ? "xmark.circle.fill" : "xmark.circle")
                    .font(.system(size: 20))
                    .foregroundStyle(set.failed ? tema.solido : tema.texto2.opacity(0.5))
            }
            .buttonStyle(.plain)

            Button {
                set.done.toggle()
                if !set.done {
                    set.failed = false
                } else {
                    onCompleted()
                }
            } label: {
                Image(systemName: set.done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundStyle(set.done ? tema.solido : tema.texto2.opacity(0.5))
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.impact(weight: .medium), trigger: set.done)
        }
        .frame(minHeight: 44)
        .opacity(set.failed ? 0.65 : 1)
    }

    private func weightStepper(value: Binding<Double>) -> some View {
        HStack(spacing: 3) {
            Button {
                let step = 2.5
                let next = max(0, (value.wrappedValue - step) * 10).rounded() / 10
                value.wrappedValue = next
            } label: {
                Text("−")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 22, height: 30)
                    .background(tema.vidrio(2), in: .rect(cornerRadius: 6))
                    .foregroundStyle(tema.texto)
            }
            .buttonStyle(.plain)

            numberField(value: value, unit: "kg")

            Button {
                let step = 2.5
                let next = ((value.wrappedValue + step) * 10).rounded() / 10
                value.wrappedValue = next
            } label: {
                Text("+")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 22, height: 30)
                    .background(tema.vidrio(2), in: .rect(cornerRadius: 6))
                    .foregroundStyle(tema.texto)
            }
            .buttonStyle(.plain)
        }
    }

    private func numberField(value: Binding<Double>, unit: String) -> some View {
        HStack(spacing: 2) {
            TextField("0", value: value, format: .number.precision(.fractionLength(0...1)))
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(width: 44)
            Text(unit)
                .font(.system(size: 10))
                .foregroundStyle(tema.texto2)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(.black.opacity(0.05), in: .rect(cornerRadius: 8))
    }

    private func intField(value: Binding<Int>, unit: String) -> some View {
        HStack(spacing: 2) {
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(width: 36)
            Text(unit)
                .font(.system(size: 10))
                .foregroundStyle(tema.texto2)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(.black.opacity(0.05), in: .rect(cornerRadius: 8))
    }
}

private struct ExerciseMediaSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let exercise: WorkoutDraft.ExerciseDraft

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if let mediaURL = exercise.mediaURL {
                    AsyncImage(url: mediaURL) { phase in
                        switch phase {
                        case .empty:
                            ProgressView().tint(tema.solido)
                                .frame(maxWidth: .infinity, minHeight: 220)
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(maxWidth: .infinity, maxHeight: 300)
                                .clipShape(.rect(cornerRadius: 12))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 12)
                                        .strokeBorder(tema.borde, lineWidth: 1)
                                }
                        case .failure:
                            VStack(spacing: 8) {
                                Image(systemName: "video.slash")
                                    .font(.system(size: 32))
                                    .foregroundStyle(tema.texto2)
                                Text("No se pudo cargar la animación")
                                    .font(.system(size: 13))
                                    .foregroundStyle(tema.texto2)
                            }
                            .frame(maxWidth: .infinity, minHeight: 180)
                        @unknown default:
                            EmptyView()
                        }
                    }
                }

                if let videoURL = exercise.videoURL {
                    Link(destination: videoURL) {
                        Label("Ver video de técnica en YouTube", systemImage: "play.rectangle.fill")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(tema.sobreSolido)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .background(tema.solido, in: .capsule)
                    }
                }

                if let desc = exercise.description, !desc.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Instrucciones")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(tema.texto2)
                            .textCase(.uppercase)
                        Text(desc)
                            .font(.system(size: 14))
                            .foregroundStyle(tema.texto)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(tema.vidrio(2), in: .rect(cornerRadius: 12))
                }

                Spacer()
            }
            .padding(16)
            .background { Backdrop() }
            .navigationTitle(exercise.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(tema.texto)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
