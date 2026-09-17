import SwiftUI

/// Armador de rutinas propias. Los ejercicios asignados por un coach siguen
/// siendo de solo lectura; esta pantalla crea documentos en `routines`.
struct RoutineComposerScreen: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.tema) private var tema

    let store: GymStore
    @State private var name = ""
    @State private var note = ""
    @State private var items: [RoutineDraftExercise] = []
    @State private var showingPicker = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack(alignment: .bottom) {
            Pantalla(titulo: "Nueva rutina", volver: true) {
                contenido
            }

            Button {
                save()
            } label: {
                Text(isSaving ? "Guardando..." : "Crear rutina")
            }
            .buttonStyle(SolidButtonStyle())
            .disabled(isSaving)
            .padding(.horizontal, 18)
            .padding(.bottom, 16)
        }
        .background { Backdrop() }
        .sheet(isPresented: $showingPicker) {
            ExercisePickerSheet(
                exercises: ejerciciosOrdenados,
                initiallySelected: Set(items.map(\.exerciseID))
            ) { selected in
                addExercises(selected)
            }
        }
    }

    private var contenido: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Datos")
                .padding(.top, 18)
                .padding(.bottom, 10)

            GlassCard(padding: 14, radius: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    TextField("Nombre", text: $name, prompt: Text("Ej: Empuje A"))
                        .textFieldStyle(.plain)
                        .foregroundStyle(tema.texto)
                        .font(.system(size: 16, weight: .medium))
                        .padding(.horizontal, 12)
                        .frame(height: 44)
                        .background(tema.vidrio(2), in: .rect(cornerRadius: 12))

                    TextEditor(text: $note)
                        .scrollContentBackground(.hidden)
                        .foregroundStyle(tema.texto)
                        .font(.system(size: 14))
                        .frame(minHeight: 72)
                        .padding(8)
                        .background(tema.vidrio(2), in: .rect(cornerRadius: 12))
                        .overlay(alignment: .topLeading) {
                            if note.isEmpty {
                                Text("Nota (opcional)")
                                    .font(.system(size: 14))
                                    .foregroundStyle(tema.texto3)
                                    .padding(.horizontal, 13)
                                    .padding(.top, 16)
                                    .allowsHitTesting(false)
                            }
                        }
                }
            }

            HStack {
                SectionLabel("Ejercicios · \(items.count)")
                Spacer()
                Button {
                    showingPicker = true
                } label: {
                    Label("Agregar", systemImage: "plus")
                }
                .buttonStyle(GhostButtonStyle())
                .fixedSize()
            }
            .padding(.top, 24)
            .padding(.bottom, 10)

            if items.isEmpty {
                Vacio(texto: "Todavía no agregaste ningún ejercicio.")
            } else {
                PanelLista {
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, _ in
                        if index > 0 {
                            Rectangle().fill(tema.borde).frame(height: 1)
                        }
                        RoutineDraftRow(
                            item: binding(for: items[index].id),
                            exercise: store.exercise(items[index].exerciseID),
                            remove: { removeExercise(items[index].exerciseID) }
                        )
                    }
                }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.system(size: 13))
                    .foregroundStyle(tema.solido)
                    .padding(.top, 14)
            }

            Color.clear.frame(height: 82)
        }
    }

    private var ejerciciosOrdenados: [Exercise] {
        store.catalog.values.sorted {
            $0.nameEs.localizedCaseInsensitiveCompare($1.nameEs) == .orderedAscending
        }
    }

    private func binding(for id: String) -> Binding<RoutineDraftExercise> {
        Binding(
            get: { items.first { $0.id == id } ?? RoutineDraftExercise(exercise: fallbackExercise(id)) },
            set: { updated in
                guard let index = items.firstIndex(where: { $0.id == id }) else { return }
                items[index] = updated
            }
        )
    }

    private func fallbackExercise(_ id: String) -> Exercise {
        Exercise(
            id: id, nameEs: id, nameEn: id, equipment: nil, pattern: nil,
            muscleWeights: [:], registrationType: .pesoReps, unilateral: false,
            descriptionEs: "", mediaURL: nil, source: .catalog
        )
    }

    private func addExercises(_ selected: [Exercise]) {
        let existing = Set(items.map(\.exerciseID))
        items.append(contentsOf: selected.filter { !existing.contains($0.id) }.map(RoutineDraftExercise.init))
    }

    private func removeExercise(_ id: String) {
        items.removeAll { $0.id == id }
    }

    private func save() {
        errorMessage = nil
        do {
            try RoutineDraftValidation.validate(name: name, exercises: items)
        } catch {
            errorMessage = error.localizedDescription
            return
        }

        isSaving = true
        Task {
            do {
                try await store.createRoutine(name: name, note: note, exercises: items)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }
}

private struct RoutineDraftRow: View {
    @Environment(\.tema) private var tema
    @Binding var item: RoutineDraftExercise
    let exercise: Exercise?
    let remove: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Miniatura(url: exercise?.mediaURL, lado: 46)
                VStack(alignment: .leading, spacing: 3) {
                    Text(exercise?.nameEs ?? item.exerciseID)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    Text(exercise?.primaryMuscle?.label ?? "Sin datos")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Button(action: remove) {
                    Image(systemName: "trash")
                        .font(.system(size: 13))
                        .foregroundStyle(tema.texto3)
                        .frame(width: 34, height: 34)
                }
                .accessibilityLabel("Quitar \(exercise?.nameEs ?? "ejercicio")")
            }

            HStack(spacing: 8) {
                Stepper(value: $item.targetSets, in: 1...30) {
                    CampoObjetivo(titulo: "Series", valor: "\(item.targetSets)")
                }
                Stepper(value: $item.targetReps, in: 1...999, step: exercise?.registrationType.isTimeBased == true ? 5 : 1) {
                    CampoObjetivo(titulo: exercise?.registrationType.isTimeBased == true ? "Tiempo" : "Reps", valor: "\(item.targetReps)")
                }
                Stepper(value: Binding(
                    get: { item.targetRIR ?? 0 },
                    set: { item.targetRIR = $0 == 0 ? nil : $0 }
                ), in: 0...10) {
                    CampoObjetivo(titulo: "RIR", valor: item.targetRIR.map(String.init) ?? "—")
                }
            }

            TextField("Nota técnica (opcional)", text: $item.techniqueNote)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 10)
                .frame(height: 36)
                .background(tema.vidrio(2), in: .rect(cornerRadius: 10))
        }
        .padding(14)
    }
}

private struct CampoObjetivo: View {
    @Environment(\.tema) private var tema
    let titulo: String
    let valor: String

    var body: some View {
        VStack(spacing: 3) {
            Text(titulo)
                .font(.system(size: 9))
                .foregroundStyle(tema.texto3)
            Text(valor)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(minWidth: 38)
        }
        .frame(maxWidth: .infinity, minHeight: 42)
        .background(tema.vidrio(2), in: .rect(cornerRadius: 10))
    }
}

private struct ExercisePickerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.tema) private var tema
    let exercises: [Exercise]
    let initiallySelected: Set<String>
    let onConfirm: ([Exercise]) -> Void

    @State private var query = ""
    @State private var selected: Set<String>

    init(exercises: [Exercise], initiallySelected: Set<String>, onConfirm: @escaping ([Exercise]) -> Void) {
        self.exercises = exercises
        self.initiallySelected = initiallySelected
        self.onConfirm = onConfirm
        _selected = State(initialValue: initiallySelected)
    }

    private var visible: [Exercise] {
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines).folding(
            options: [.diacriticInsensitive, .caseInsensitive], locale: .current
        )
        guard !term.isEmpty else { return exercises }
        return exercises.filter {
            "\($0.nameEs) \($0.nameEn)".folding(
                options: [.diacriticInsensitive, .caseInsensitive], locale: .current
            ).contains(term)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Backdrop()
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(visible) { exercise in
                            Button {
                                toggle(exercise.id)
                            } label: {
                                HStack(spacing: 12) {
                                    Miniatura(url: exercise.mediaURL, lado: 46)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(exercise.nameEs)
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundStyle(tema.texto)
                                        Text(exercise.source == .custom ? "Tuyo" : (exercise.primaryMuscle?.label ?? "Sin datos"))
                                            .font(.system(size: 11))
                                            .foregroundStyle(tema.texto2)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    Image(systemName: selected.contains(exercise.id) ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 22))
                                        .foregroundStyle(selected.contains(exercise.id) ? tema.solido : tema.texto3)
                                }
                                .padding(.horizontal, 18)
                                .padding(.vertical, 10)
                            }
                            .buttonStyle(.plain)
                            if exercise.id != visible.last?.id {
                                Rectangle().fill(tema.borde).frame(height: 1)
                            }
                        }
                    }
                    .background(tema.vidrio(1), in: .rect(cornerRadius: 24))
                    .overlay { RoundedRectangle(cornerRadius: 24).strokeBorder(tema.borde, lineWidth: 1) }
                    .padding(18)
                }
            }
            .safeAreaInset(edge: .top) { buscador.padding(.horizontal, 18).padding(.top, 8) }
            .safeAreaInset(edge: .bottom) {
                Button {
                    onConfirm(exercises.filter { selected.contains($0.id) })
                    dismiss()
                } label: {
                    Text("Agregar \(selected.count) \(selected.count == 1 ? "ejercicio" : "ejercicios")")
                }
                .buttonStyle(SolidButtonStyle())
                .padding(.horizontal, 18)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .principal) {
                    Text("Elegir ejercicios")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(tema.texto)
                }
            }
        }
        .preferredColorScheme(.dark)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var buscador: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(tema.texto2)
            TextField("Buscar ejercicios", text: $query)
                .foregroundStyle(tema.texto)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 16)
        .frame(height: 48)
        .background(tema.vidrio(1), in: .capsule)
        .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
    }

    private func toggle(_ id: String) {
        if selected.contains(id) {
            selected.remove(id)
        } else {
            selected.insert(id)
        }
    }
}
