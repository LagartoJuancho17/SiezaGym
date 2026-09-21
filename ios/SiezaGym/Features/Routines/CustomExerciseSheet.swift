import SwiftUI

/// Cargar un ejercicio que no está en el catálogo.
///
/// Es el `CustomExerciseForm` de la web, pero pidiendo lo mínimo: nombre,
/// músculos y, si querés, un video de YouTube. El equipamiento y el patrón
/// tienen valor por defecto porque las reglas de Firestore los exigen, no
/// porque hagan falta para entrenar.
struct CustomExerciseSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore
    /// El nombre que ya venía escrito en el buscador: si buscaste algo y no
    /// apareció, ese es justo el ejercicio que querés crear.
    let nombreInicial: String
    let alCrear: (Exercise) -> Void

    @State private var draft = CustomExerciseDraft()
    @State private var error = ""
    @State private var guardando = false
    @State private var mostrarDetalles = false

    var body: some View {
        ZStack {
            Backdrop()

            VStack(spacing: 0) {
                encabezado

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        campoNombre
                        campoVideo
                        musculos
                        detalles

                        if !error.isEmpty {
                            Text(error)
                                .font(.system(size: 13))
                                .foregroundStyle(tema.texto)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(16)
                                .background(tema.vidrio(1), in: .rect(cornerRadius: 18))
                                .padding(.top, 16)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, 24)
                }
                .scrollIndicators(.hidden)

                pie
            }
        }
        .tecladoConBotonListo()
        .task { if draft.nameEs.isEmpty { draft.nameEs = nombreInicial } }
    }

    // MARK: - Partes

    private var encabezado: some View {
        HStack(spacing: 12) {
            Text("Ejercicio propio")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(tema.texto)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Cerrar")
        }
        .padding(.leading, 18)
        .padding(.trailing, 6)
        .padding(.top, 12)
    }

    private var campoNombre: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel("Nombre")
            TextField("", text: $draft.nameEs, prompt: Text("Ej: Press en Smith a un brazo").foregroundStyle(tema.texto3))
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 16)
                .frame(minHeight: 52)
                .background(tema.vidrio(1), in: .rect(cornerRadius: 16))
                .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(tema.borde, lineWidth: 1) }
                .accessibilityLabel("Nombre del ejercicio")
        }
        .padding(.top, 16)
    }

    private var campoVideo: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel("Video de YouTube (opcional)")

            HStack(spacing: 10) {
                TextField("", text: $draft.videoURL, prompt: Text("Pegá el link").foregroundStyle(tema.texto3))
                    .font(.system(size: 14))
                    .foregroundStyle(tema.texto)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .keyboardType(.URL)
                    .padding(.horizontal, 16)
                    .frame(minHeight: 52)
                    .background(tema.vidrio(1), in: .rect(cornerRadius: 16))
                    .overlay {
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(draft.linkInvalido ? tema.solido : tema.borde, lineWidth: 1)
                    }
                    .accessibilityLabel("Link de YouTube")

                // La portada aparece apenas el link es válido: es la forma de
                // saber que pegaste el video que querías sin salir de acá.
                if let id = draft.videoID {
                    Miniatura(url: YouTubeLink.miniatura(paraID: id), lado: 52)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.snappy(duration: 0.2), value: draft.videoID)

            Text(draft.linkInvalido
                 ? "Ese link no es de YouTube."
                 : "La portada del video queda como miniatura del ejercicio.")
                .font(.system(size: 11))
                .foregroundStyle(draft.linkInvalido ? tema.texto : tema.texto3)
        }
        .padding(.top, 20)
    }

    private var musculos: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel("Músculos que trabaja")

            FlowRow(spacing: 8) {
                ForEach(MuscleGroup.allCases, id: \.self) { musculo in
                    chip(musculo)
                }
            }

            if draft.musculos.count > 1 { reparto }
        }
        .padding(.top, 24)
    }

    private func chip(_ musculo: MuscleGroup) -> some View {
        let partes = draft.shares[musculo] ?? 0

        return Button {
            // Tocar suma una parte y da la vuelta: 0 → 1 → 2 → 3 → 0. Así el
            // reparto se arma tocando, sin teclado ni porcentajes.
            draft.shares[musculo] = partes >= 3 ? 0 : partes + 1
        } label: {
            HStack(spacing: 5) {
                Text(musculo.label)
                if partes > 1 {
                    Text("×\(partes)").font(.system(size: 11, weight: .bold))
                }
            }
            .font(.system(size: 13))
            .foregroundStyle(partes > 0 ? tema.sobreSolido : tema.texto)
            .padding(.horizontal, 14)
            .frame(minHeight: 36)
            .background(partes > 0 ? tema.solido : tema.vidrio(1), in: .capsule)
            .overlay { Capsule().strokeBorder(partes > 0 ? .clear : tema.borde, lineWidth: 1) }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(musculo.label)
        .accessibilityValue(partes == 0 ? "sin participación" : "\(partes) de 3")
        .accessibilityHint("Tocá para subir cuánto participa")
    }

    private var reparto: some View {
        GlassCard(padding: 14) {
            VStack(spacing: 9) {
                ForEach(draft.musculos, id: \.self) { musculo in
                    let pct = draft.muscleWeights[musculo] ?? 0
                    VStack(spacing: 4) {
                        HStack {
                            Text(musculo.label).font(.system(size: 12)).foregroundStyle(tema.texto)
                            Spacer()
                            Text("\(Int((pct * 100).rounded()))%")
                                .font(.system(size: 12)).foregroundStyle(tema.texto2)
                        }
                        WidgetMeter(value: pct)
                    }
                }
            }
        }
        .padding(.top, 4)
    }

    private var detalles: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button { mostrarDetalles.toggle() } label: {
                HStack(spacing: 8) {
                    Text("Más detalles")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(tema.texto2)
                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(tema.texto3)
                        .rotationEffect(.degrees(mostrarDetalles ? 180 : 0))
                    Spacer()
                }
            }
            .buttonStyle(.plain)

            if mostrarDetalles {
                opciones("Cómo se registra", RegistrationType.allCases, actual: draft.registrationType) {
                    draft.registrationType = $0
                }
                opciones("Equipamiento", Equipment.allCases, actual: draft.equipment) {
                    draft.equipment = $0
                }
                opciones("Patrón", MovementPattern.allCases, actual: draft.pattern) {
                    draft.pattern = $0
                }

                Toggle(isOn: $draft.unilateral) {
                    Text("Se hace de a un lado").font(.system(size: 13)).foregroundStyle(tema.texto)
                }
                .tint(tema.solido)
            }
        }
        .animation(.snappy(duration: 0.2), value: mostrarDetalles)
        .padding(.top, 24)
    }

    private func opciones<T: Hashable & Etiquetable>(
        _ rotulo: String,
        _ todas: [T],
        actual: T,
        alElegir: @escaping (T) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(rotulo)
            FlowRow(spacing: 8) {
                ForEach(todas, id: \.self) { opcion in
                    Button { alElegir(opcion) } label: {
                        Text(opcion.label)
                            .font(.system(size: 13))
                            .foregroundStyle(opcion == actual ? tema.sobreSolido : tema.texto)
                            .padding(.horizontal, 14)
                            .frame(minHeight: 34)
                            .background(opcion == actual ? tema.solido : tema.vidrio(1), in: .capsule)
                            .overlay { Capsule().strokeBorder(opcion == actual ? .clear : tema.borde, lineWidth: 1) }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var pie: some View {
        Button { Task { await guardar() } } label: {
            Text(guardando ? "Guardando…" : "Guardar ejercicio")
        }
        .buttonStyle(SolidButtonStyle())
        .disabled(guardando)
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }

    private func guardar() async {
        error = ""
        do {
            try draft.validar()
        } catch {
            self.error = error.localizedDescription
            return
        }

        guardando = true
        do {
            let ejercicio = try await store.createCustomExercise(draft)
            alCrear(ejercicio)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            guardando = false
        }
    }
}

// `Etiquetable` vive en ProfileScreen, donde nació para los chips del perfil.
extension Equipment: Etiquetable {}
extension MovementPattern: Etiquetable {}
extension RegistrationType: Etiquetable {}
