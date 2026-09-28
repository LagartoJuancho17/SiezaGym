import SwiftUI

/// Perfil, igual que `/perfil` en la web: la tarjeta de identidad, tres
/// números, los datos de la cuenta y la configuración con el tema adentro.
struct ProfileScreen: View {
    @Environment(\.tema) private var tema
    @Environment(ThemeStore.self) private var temas
    @Environment(AuthService.self) private var auth
    let store: GymStore

    @State private var peso = ""
    @State private var altura = ""
    @State private var meta = ""
    @State private var sexo: Sex?
    @State private var nivel: ExperienceLevel?
    @State private var guardadoEn: Date?
    @State private var cargado = false

    private var totalSeries: Int { store.sessions.reduce(0) { $0 + $1.totalSetsCompleted } }

    var body: some View {
        NavigationStack {
            Pantalla(titulo: "Perfil") {
                identidad.padding(.top, 20)

                StatsCard(datos: [
                    ("\(store.sessions.count)", store.sessions.count == 1 ? "entrenamiento" : "entrenamientos"),
                    ("\(totalSeries)", totalSeries == 1 ? "serie" : "series"),
                    ("\(store.streak)", store.streak == 1 ? "día seguido" : "días seguidos"),
                ])
                .padding(.top, 14)

                SectionLabel("Tus datos").padding(.top, 24).padding(.bottom, 10)
                datos

                SectionLabel("Configuración").padding(.top, 24).padding(.bottom, 10)
                configuracion

                Button("Cerrar sesión") { auth.signOut() }
                    .buttonStyle(GhostButtonStyle())
                    .frame(maxWidth: .infinity)
                    .padding(.top, 24)
            }
            .bottomNavInset()
            .task { if !cargado { llenarDesdePerfil() } }
            .animation(.smooth(duration: 0.25), value: guardadoEn)
        }
        // Peso, altura y meta usan teclado decimal, que no trae tecla de cerrar.
        .tecladoConBotonListo()
    }

    // MARK: - Identidad

    private var identidad: some View {
        GlassCard(padding: 16, radius: 26) {
            HStack(spacing: 14) {
                Group {
                    if let url = store.profile?.photoURL {
                        AsyncImage(url: url) { $0.resizable().aspectRatio(contentMode: .fill) } placeholder: { inicial }
                    } else {
                        inicial
                    }
                }
                .frame(width: 58, height: 58)
                .clipShape(.circle)
                .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }

                VStack(alignment: .leading, spacing: 4) {
                    Text(store.profile?.displayName ?? "Sin nombre")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    if let email = store.profile?.email {
                        Text(email)
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto2)
                            .lineLimit(1)
                    }
                    Text(store.profile?.isCoach == true ? "Entrenador" : "Atleta")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var inicial: some View {
        ZStack {
            tema.vidrio(2)
            Text(store.profile?.initial ?? "T")
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(tema.texto)
        }
    }

    // MARK: - Datos

    private var datos: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 16) {
                opciones("Sexo", Sex.allCases, seleccion: sexo) { sexo = sexo == $0 ? nil : $0 }
                opciones("Experiencia", ExperienceLevel.allCases, seleccion: nivel) { nivel = nivel == $0 ? nil : $0 }

                HStack(spacing: 12) {
                    campo("Peso (kg)", texto: $peso)
                    campo("Altura (cm)", texto: $altura)
                }
                campo("Meta semanal (kcal)", texto: $meta)

                HStack(spacing: 12) {
                    Button("Guardar") { Task { await guardar() } }
                        .buttonStyle(SolidButtonStyle(expands: false))
                    if guardadoEn != nil {
                        Text("Listo, guardado.")
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto2)
                    }
                }

                // El peso no es decorativo: la portada lo usa para estimar las
                // calorías de la semana.
                Text("El peso se usa para estimar las calorías de cada sesión.")
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto3)
            }
        }
    }

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
                }
            }
        }
    }

    // MARK: - Configuración

    private var configuracion: some View {
        VStack(spacing: 14) {
            GlassCard(padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Tema").font(.system(size: 14, weight: .medium)).foregroundStyle(tema.texto)
                        Text("La apariencia de la app. Se guarda en este teléfono.")
                            .font(.system(size: 11)).foregroundStyle(tema.texto2)
                    }

                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 12) {
                        ForEach(Theme.todos) { opcion in
                            Button { temas.actual = opcion } label: {
                                VStack(spacing: 8) {
                                    muestra(opcion)
                                    Text(opcion.nombre)
                                        .font(.system(size: 12)).lineLimit(1).minimumScaleFactor(0.8)
                                }
                                .foregroundStyle(opcion.id == tema.id ? tema.texto : tema.texto2)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(opcion.id == tema.id ? tema.vidrio(1) : .clear, in: .rect(cornerRadius: 18))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 18)
                                        .strokeBorder(opcion.id == tema.id ? tema.bordeFuerte : .clear, lineWidth: 1)
                                }
                                .contentShape(.rect)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(opcion.nombre)
                            .accessibilityAddTraits(opcion.id == tema.id ? [.isSelected] : [])
                        }
                    }
                }
            }
            .animation(.smooth(duration: 0.25), value: tema.id)

            PanelLista {
                FilaLista(nombre: "Entrenador",
                          detalle: "Quien te asigna rutinas",
                          valor: store.profile?.isCoach == true ? "Sos entrenador" : "Sin vincular",
                          chevron: false)
            }
        }
    }

    /// El fondo real del tema en un círculo: la obra si la trae, o su degradado.
    private func muestra(_ opcion: Theme) -> some View {
        ZStack {
            LinearGradient(stops: opcion.fondo, startPoint: opcion.fondoInicio, endPoint: opcion.fondoFin)
            if let obra = opcion.obra {
                Image(obra).resizable().aspectRatio(contentMode: .fill)
            }
            if opcion.plano {
                Circle()
                    .fill(opcion.solido)
                    .frame(width: 16, height: 16)
            }
        }
        .frame(width: 46, height: 46)
        .clipShape(.circle)
        .overlay { Circle().strokeBorder(tema.bordeFuerte, lineWidth: 1) }
    }

    // MARK: - Datos del perfil

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
        var campos: [String: Any] = [:]
        // Vacío se guarda como null y no como cero: son cosas distintas.
        campos["bodyWeightKg"] = Double(peso.replacingOccurrences(of: ",", with: ".")) ?? NSNull()
        campos["heightCm"] = Double(altura.replacingOccurrences(of: ",", with: ".")) ?? NSNull()
        campos["weeklyCalorieGoalKcal"] = Double(meta.replacingOccurrences(of: ",", with: ".")) ?? NSNull()
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
