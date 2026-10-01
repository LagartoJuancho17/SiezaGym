import AudioToolbox
import Combine
import SwiftUI
import UIKit

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
    @State private var descanso = RestTimer()
    @State private var previewExercise: WorkoutDraft.ExerciseDraft? = nil
    /// Qué ejercicio está desplegado. Arranca en el que estás haciendo.
    @State private var abierto: String?
    @Environment(\.dismiss) private var dismiss

    private let secondTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(store: GymStore, routine: Routine?, existingDraft: WorkoutDraft? = nil) {
        self.store = store
        self.routine = routine ?? existingDraft?.routine
        if let existingDraft {
            _draft = State(initialValue: existingDraft)
        } else {
            _draft = State(initialValue: WorkoutDraft(routine: routine, catalog: store.catalog, sessions: store.sessions))
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar

            ScrollView {
                VStack(spacing: 12) {
                    summary

                    if descanso.corriendo {
                        restTimerCard
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    ForEach(secciones) { seccion in
                        VStack(spacing: 10) {
                            if seccion.agrupada {
                                EncabezadoDeGrupoEntrenamiento(seccion: seccion)
                            }

                            ForEach($draft.exercises) { $exercise in
                                if seccion.items.contains(where: { $0.id == exercise.id }) {
                                    ExerciseCard(
                                        exercise: $exercise,
                                        draft: draft,
                                        abierto: abierto == exercise.id,
                                        alTocar: {
                                            withAnimation(.snappy(duration: 0.22)) {
                                                abierto = abierto == exercise.id ? nil : exercise.id
                                            }
                                        },
                                        onSetCompleted: { handleSetCompleted(en: exercise.id) },
                                        onShowMedia: { previewExercise = exercise }
                                    )
                                }
                            }
                        }
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
            if abierto == nil { abierto = draft.ejercicioEnCurso }
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
            if descanso.tick() { AudioServicesPlaySystemSound(1005) }
        }
        .onReceive(NotificationCenter.default.publisher(for: .terminarSerieDesdeWidget)) { _ in
            completeNextSet()
        }
        .sheet(item: $previewExercise) { exercise in
            TecnicaSheet(
                nombre: exercise.name,
                gif: exercise.mediaURL,
                video: exercise.videoURL,
                descripcion: exercise.description
            )
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

    /// Los ejercicios consecutivos con el mismo grupo, juntos. Igual que
    /// `sections` en `RoutineScreen.js`.
    private var secciones: [RoutineSection<WorkoutDraft.ExerciseDraft>] {
        RoutineGrouping.seccionar(draft.exercises, grupo: \.group, colorID: \.groupColor)
    }

    /// Una serie marcada: sonido, vibración y descanso.
    ///
    /// La háptica se dispara acá y no en el botón para que también se sienta
    /// cuando marcás desde la Dynamic Island, donde no hay botón que tocar.
    private func handleSetCompleted(en ejercicioID: String? = nil) {
        AudioServicesPlaySystemSound(1057)

        let termino = ejercicioID.flatMap { id in
            draft.exercises.first { $0.id == id }?.estaCompleto
        } ?? false

        if termino {
            // Terminar un ejercicio se siente distinto de terminar una serie.
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } else {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        }

        withAnimation(.spring(duration: 0.3)) {
            descanso.arrancar()
            // Con el ejercicio terminado, se pliega y se abre el que sigue.
            if termino { abierto = draft.ejercicioEnCurso }
        }
    }

    /// Lo que dispara el botón "Terminar serie" de la actividad en vivo.
    private func completeNextSet() {
        guard let proxima = draft.proximaSerieSinMarcar() else { return }
        let ejercicioID = draft.exercises[proxima.ejercicio].id
        guard draft.marcarProximaSerie() else { return }
        handleSetCompleted(en: ejercicioID)
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

    private var restTimerCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "timer")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(tema.solido)

            VStack(alignment: .leading, spacing: 2) {
                Text("Descanso")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(tema.texto2)
                    .textCase(.uppercase)
                Text(descanso.texto)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(tema.texto)
                    .monospacedDigit()
            }

            Spacer()

            HStack(spacing: 6) {
                Button("−15s") {
                    descanso.restar()
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(tema.vidrio(2), in: .capsule)

                Button("+30s") {
                    descanso.sumar()
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(tema.vidrio(2), in: .capsule)

                Button("Saltar") {
                    withAnimation { descanso.saltar() }
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

/// La franja de color con el nombre del bloque durante el entrenamiento
/// ("Entrada en calor", "Fuerza", "Potencia"). De sólo lectura: el grupo se
/// arma en el editor, no acá.
private struct EncabezadoDeGrupoEntrenamiento: View {
    @Environment(\.tema) private var tema
    let seccion: RoutineSection<WorkoutDraft.ExerciseDraft>

    var body: some View {
        HStack(spacing: 8) {
            Circle().fill(seccion.color?.color ?? tema.texto3).frame(width: 7, height: 7)
            Text(seccion.nombreGrupo)
                .font(.system(size: 12, weight: .bold))
                .tracking(0.4)
                .textCase(.uppercase)
            Spacer()
            Text("\(seccion.items.count) \(seccion.items.count == 1 ? "ejercicio" : "ejercicios")")
                .font(.system(size: 11))
        }
        .foregroundStyle(seccion.color?.color ?? tema.texto)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background((seccion.color?.color ?? tema.texto3).opacity(0.14), in: .rect(cornerRadius: 12))
        .accessibilityElement(children: .combine)
    }
}

/// Un ejercicio del entrenamiento.
///
/// Plegado por defecto: una rutina de ocho ejercicios con todas las series
/// abiertas no entra en un teléfono, y en el gimnasio mirás uno por vez. Se
/// abre solo el que estás haciendo.
private struct ExerciseCard: View {
    @Environment(\.tema) private var tema
    @Binding var exercise: WorkoutDraft.ExerciseDraft
    let draft: WorkoutDraft
    let abierto: Bool
    let alTocar: () -> Void
    let onSetCompleted: () -> Void
    let onShowMedia: () -> Void

    private var completo: Bool { exercise.estaCompleto }

    /// El GIF del catálogo, o la portada del video de YouTube en los propios.
    private var miniatura: URL? {
        if let mediaURL = exercise.mediaURL { return mediaURL }
        guard let videoURL = exercise.videoURL, let id = YouTubeLink.id(de: videoURL.absoluteString) else { return nil }
        return YouTubeLink.miniatura(paraID: id)
    }

    private var tieneMedia: Bool { exercise.mediaURL != nil || exercise.videoURL != nil }

    private var progreso: String {
        let total = exercise.sets.count
        let hechas = exercise.completedCount
        if exercise.newPBWeight != nil { return "🏆 NUEVO PB · \(hechas) de \(total) series" }
        if completo { return "\(total) \(total == 1 ? "serie" : "series") · listo" }
        return "\(hechas) de \(total) \(total == 1 ? "serie" : "series")"
    }

    var body: some View {
        TarjetaEjercicio(
            miniatura: miniatura,
            nombre: exercise.name,
            detalle: progreso,
            completo: completo,
            alTocar: alTocar,
            // Tocar la miniatura abre el GIF o el video, igual que en la web.
            alTocarMiniatura: tieneMedia ? onShowMedia : nil
        ) {
            AccesorioTarjeta(abierto: abierto)
        } contenido: {
            if abierto {
                detalle
                    .padding(.horizontal, 12)
                    .padding(.bottom, 12)
                    .transition(.opacity)
            }
        }
        .overlay {
            if exercise.newPBWeight != nil {
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(tema.solido, lineWidth: 2)
                    .allowsHitTesting(false)
            }
        }
        .animation(.snappy(duration: 0.22), value: abierto)
        .animation(.spring(duration: 0.45), value: exercise.newPBWeight)
        .accessibilityHint(abierto ? "Tocá para plegar" : "Tocá para ver las series")
    }

    private var detalle: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let pb = exercise.newPBWeight {
                HStack(spacing: 10) {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 22, weight: .bold))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("NUEVO PB")
                            .font(.system(size: 16, weight: .black))
                            .tracking(1)
                        Text("\(pb.formatted()) kg · antes \(exercise.previousBestWeight.formatted()) kg")
                            .font(.system(size: 12, weight: .medium))
                    }
                    Spacer()
                }
                .foregroundStyle(tema.sobreSolido)
                .padding(12)
                .background(tema.solido, in: .rect(cornerRadius: 12))
                .transition(.scale(scale: 0.9).combined(with: .opacity))
                .accessibilityLabel("Nuevo récord personal: \(pb.formatted()) kilos")
            }

            if let sugerido = exercise.suggestedRIR1Weight {
                HStack(spacing: 7) {
                    Image(systemName: "scope")
                    Text("RIR 1 estimado: ~\(sugerido.formatted()) kg para \(exercise.targetReps) reps")
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(tema.texto2)
                .accessibilityHint("Estimación basada en el RIR que registraste; ajustá el peso según cómo te sientas")
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
        .transition(.opacity.combined(with: .move(edge: .top)))
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

            if !isTimeBased {
                TextField("RIR", text: Binding(
                    get: { set.rir.map(String.init) ?? "" },
                    set: { set.rir = Int($0).flatMap { (0...10).contains($0) ? $0 : nil } }
                ))
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(tema.texto)
                .frame(width: 28, height: 30)
                .background(tema.vidrio(2), in: .rect(cornerRadius: 6))
                .accessibilityLabel("Repeticiones en reserva")
            }

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

#if DEBUG
#Preview("Entrenamiento") {
    WorkoutView(store: PreviewData.store(), routine: PreviewData.routines[0])
        .previewSieza()
}
#endif
