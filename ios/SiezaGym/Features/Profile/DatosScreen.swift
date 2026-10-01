import SwiftUI

/// "Tus datos" completo, en su propia pantalla: el Perfil solo muestra el
/// resumen de una línea y abre esto. Dos grupos, Cuerpo y Entrenamiento, con
/// lo que cada dato calcula a la vista (el IMC, las calorías de la semana).
struct DatosScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore

    @State private var peso = ""
    @State private var altura = ""
    @State private var meta = ""
    @State private var sexo: Sex?
    @State private var nivel: ExperienceLevel?
    @State private var guardando = false
    @State private var guardadoEn: Date?
    @State private var cargado = false

    private var imc: BodyMetrics.IMC? {
        BodyMetrics.imc(pesoKg: BodyMetrics.decimal(peso), alturaCm: BodyMetrics.decimal(altura))
    }

    var body: some View {
        Pantalla(titulo: "Tus datos", volver: true) {
            Text("Nada es obligatorio. Se guarda en tu cuenta y lo ven la web y el iPhone.")
                .font(.system(size: 12))
                .foregroundStyle(tema.texto2)
                .padding(.top, 8)

            SectionLabel("Cuerpo").padding(.top, 20).padding(.bottom, 10)
            cuerpo

            SectionLabel("Entrenamiento").padding(.top, 24).padding(.bottom, 10)
            entrenamiento

            HStack(spacing: 12) {
                Button(guardando ? "Guardando…" : "Guardar") { Task { await guardar() } }
                    .buttonStyle(SolidButtonStyle())
                    .disabled(guardando)
            }
            .padding(.top, 24)

            if guardadoEn != nil {
                Text("Listo, guardado.")
                    .font(.system(size: 12))
                    .foregroundStyle(tema.texto2)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 10)
            }
        }
        .bottomNavInset()
        .task { if !cargado { llenarDesdePerfil() } }
        .animation(.smooth(duration: 0.25), value: guardadoEn)
        .animation(.smooth(duration: 0.25), value: imc)
        // Peso, altura y meta usan teclado decimal, que no trae tecla de cerrar.
        .tecladoConBotonListo()
    }

    // MARK: - Cuerpo

    private var cuerpo: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 16) {
                opciones("Sexo", Sex.allCases, seleccion: sexo) { sexo = sexo == $0 ? nil : $0 }

                Rectangle().fill(tema.borde).frame(height: 1)

                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 12) {
                        campo("Peso (kg)", texto: $peso)
                        campo("Altura (cm)", texto: $altura)
                    }
                    // El peso no es decorativo: Inicio lo usa para estimar las
                    // calorías de cada sesión.
                    Text("El peso se usa para estimar las calorías de cada sesión.")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                }

                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("IMC").font(.system(size: 14, weight: .medium)).foregroundStyle(tema.texto)
                        Text("Peso sobre altura al cuadrado. Orientativo: no distingue músculo de grasa.")
                            .font(.system(size: 11))
                            .foregroundStyle(tema.texto2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 12)
                    if let imc {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(BodyMetrics.numero(imc.valor))
                                .font(.system(size: 22, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(tema.texto)
                            Text(imc.categoria).font(.system(size: 11)).foregroundStyle(tema.texto2)
                        }
                    } else {
                        Text("—").font(.system(size: 22, weight: .semibold)).foregroundStyle(tema.texto3)
                    }
                }
                .accessibilityElement(children: .combine)
            }
        }
    }

    // MARK: - Entrenamiento

    private var entrenamiento: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 16) {
                opciones("Experiencia", ExperienceLevel.allCases, seleccion: nivel) { nivel = nivel == $0 ? nil : $0 }

                Rectangle().fill(tema.borde).frame(height: 1)

                campo("Meta semanal (kcal)", texto: $meta)

                let semana = store.calories
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Esta semana").font(.system(size: 12)).foregroundStyle(tema.texto2)
                        Spacer()
                        Text("\(semana.kcal) de \(semana.goal) kcal")
                            .font(.system(size: 12))
                            .monospacedDigit()
                            .foregroundStyle(tema.texto)
                    }
                    WidgetMeter(value: Double(semana.pct) / 100)
                    Text(semana.usesDefaultWeight
                         ? "\(semana.label). Calculado con un peso estándar: cargá el tuyo para que sea más preciso."
                         : semana.label)
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                }
            }
        }
    }

    // MARK: - Campos

    private func campo(_ rotulo: String, texto: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(rotulo).font(.system(size: 11)).foregroundStyle(tema.texto2)
            TextField("", text: texto, prompt: Text("—").foregroundStyle(tema.texto3))
                .keyboardType(.decimalPad)
                .foregroundStyle(tema.texto)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 14)
                .frame(minHeight: 46)
                .background(tema.vidrio(1), in: .rect(cornerRadius: 14))
                .overlay { RoundedRectangle(cornerRadius: 14).strokeBorder(tema.borde, lineWidth: 1) }
                .onChange(of: texto.wrappedValue) { if guardadoEn != nil { guardadoEn = nil } }
        }
        .frame(maxWidth: .infinity)
    }

    /// Opciones en línea. Volver a tocar la elegida la desmarca: nada es
    /// obligatorio.
    private func opciones<T: Hashable & Etiquetable>(
        _ rotulo: String, _ todas: [T], seleccion: T?, elegir: @escaping (T) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(rotulo).font(.system(size: 11)).foregroundStyle(tema.texto2)
            FlowRow(spacing: 8) {
                ForEach(todas, id: \.self) { opcion in
                    let activa = seleccion == opcion
                    Button {
                        elegir(opcion)
                        if guardadoEn != nil { guardadoEn = nil }
                    } label: {
                        Text(opcion.label)
                            .font(.system(size: 13))
                            .foregroundStyle(activa ? tema.sobreSolido : tema.texto2)
                            .padding(.horizontal, 14)
                            .frame(minHeight: 38)
                            .background(activa ? tema.solido : tema.vidrio(1), in: .capsule)
                            .overlay { Capsule().strokeBorder(activa ? .clear : tema.borde, lineWidth: 1) }
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(activa ? [.isSelected] : [])
                }
            }
        }
    }

    // MARK: - Guardar

    private func llenarDesdePerfil() {
        guard let perfil = store.profile else { return }
        peso = perfil.bodyWeightKg.map { $0.formatted() } ?? ""
        altura = perfil.heightCm.map { $0.formatted() } ?? ""
        meta = perfil.weeklyCalorieGoalKcal.map { $0.formatted() } ?? ""
        sexo = perfil.sex
        nivel = perfil.experienceLevel
        cargado = true
    }

    private func guardar() async {
        guardando = true
        defer { guardando = false }
        var campos: [String: Any] = [:]
        // Vacío se guarda como null y no como cero: son cosas distintas.
        campos["bodyWeightKg"] = BodyMetrics.decimal(peso) ?? NSNull()
        campos["heightCm"] = BodyMetrics.decimal(altura) ?? NSNull()
        campos["weeklyCalorieGoalKcal"] = BodyMetrics.decimal(meta) ?? NSNull()
        campos["sex"] = sexo?.rawValue ?? NSNull()
        campos["experienceLevel"] = nivel?.rawValue ?? NSNull()
        await store.updateProfile(campos)
        guardadoEn = Date()
    }
}

/// Lo que necesita `opciones` de cada opción: cómo se escribe.
protocol Etiquetable { var label: String { get } }
extension Sex: Etiquetable {}
extension ExperienceLevel: Etiquetable {}

/// Fila que envuelve: "Prefiero no decir" no entra en un tercio de pantalla.
struct FlowRow: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let ancho = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, altoFila: CGFloat = 0
        for vista in subviews {
            let tamano = vista.sizeThatFits(.unspecified)
            if x + tamano.width > ancho, x > 0 {
                x = 0; y += altoFila + spacing; altoFila = 0
            }
            x += tamano.width + spacing
            altoFila = max(altoFila, tamano.height)
        }
        return CGSize(width: ancho, height: y + altoFila)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, altoFila: CGFloat = 0
        for vista in subviews {
            let tamano = vista.sizeThatFits(.unspecified)
            if x + tamano.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += altoFila + spacing; altoFila = 0
            }
            vista.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(tamano))
            x += tamano.width + spacing
            altoFila = max(altoFila, tamano.height)
        }
    }
}

#if DEBUG
#Preview("Tus datos") {
    NavigationStack {
        DatosScreen(store: PreviewData.store())
    }
    .previewSieza()
}
#endif
