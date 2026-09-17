import SwiftUI

struct ProfileView: View {
    @Environment(\.tema) private var tema
    @Environment(ThemeStore.self) private var temas
    let store: GymStore
    @Environment(AuthService.self) private var auth

    @State private var bodyWeight = ""
    @State private var height = ""
    @State private var calorieGoal = ""
    @State private var sex: Sex = .prefieroNoDecir
    @State private var level: ExperienceLevel = .principiante
    @State private var isSaving = false
    @State private var savedAt: Date?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 10) {
                    identity

                    temaPicker

                    SurfaceCard {
                        VStack(alignment: .leading, spacing: 12) {
                            WidgetHeader(title: "Tus datos")

                            numberRow("Peso corporal", value: $bodyWeight, unit: "kg")
                            numberRow("Altura", value: $height, unit: "cm")
                            numberRow("Meta semanal", value: $calorieGoal, unit: "kcal")

                            HStack {
                                Text("Sexo")
                                    .font(.system(size: 14))
                                    .foregroundStyle(tema.texto)
                                Spacer()
                                Picker("Sexo", selection: $sex) {
                                    ForEach(Sex.allCases, id: \.self) { Text($0.label).tag($0) }
                                }
                                .labelsHidden()
                                .pickerStyle(.menu)
                                .tint(tema.solido)
                            }
                            .frame(minHeight: 44)

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Nivel")
                                    .font(.system(size: 14))
                                    .foregroundStyle(tema.texto)
                                Picker("Nivel", selection: $level) {
                                    ForEach(ExperienceLevel.allCases, id: \.self) { Text($0.label).tag($0) }
                                }
                                .labelsHidden()
                                .pickerStyle(.segmented)
                            }

                            // El peso corporal alimenta la estimacion de calorias:
                            // conviene decir para que sirve, no pedirlo porque si.
                            Text("El peso se usa para estimar las calorías de cada sesión.")
                                .font(.system(size: 10))
                                .foregroundStyle(tema.texto2)

                            Button(isSaving ? "Guardando…" : "Guardar", action: save)
                                .buttonStyle(AccentButtonStyle())
                                .disabled(isSaving)

                            if let savedAt {
                                Label(
                                    "Guardado \(savedAt.formatted(.dateTime.hour().minute()))",
                                    systemImage: "checkmark.circle.fill"
                                )
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(tema.texto)
                                .transition(.opacity)
                            }
                        }
                    }

                    Button("Cerrar sesión") { auth.signOut() }
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(tema.texto)
                        .frame(maxWidth: .infinity, minHeight: 50)
                }
                .padding(12)
            }
            .background { Backdrop() }
            .bottomNavInset()
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Perfil")
            .task { fillFromProfile() }
            .animation(.smooth(duration: 0.25), value: savedAt)
        }
    }

    /// Elegir el fondo de la app, igual que Configuración en la web.
    ///
    /// Cada muestra dibuja el degradado real de su tema, no un color copiado:
    /// si se retoca un tema en el CSS y se vuelve a generar, la muestra cambia
    /// sola.
    private var temaPicker: some View {
        SurfaceCard {
            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Tema")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(tema.texto)
                    Text("El fondo de la app. Se guarda en este teléfono.")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                }

                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 12) {
                    ForEach(Theme.todos) { opcion in
                        Button {
                            temas.actual = opcion
                        } label: {
                            VStack(spacing: 8) {
                                muestra(opcion)
                                Text(opcion.nombre)
                                    .font(.system(size: 12))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.8)
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
    }

    /// El fondo del tema en un círculo: la obra si la trae, o su degradado.
    private func muestra(_ opcion: Theme) -> some View {
        ZStack {
            LinearGradient(stops: opcion.fondo, startPoint: opcion.fondoInicio, endPoint: opcion.fondoFin)
            if let obra = opcion.obra {
                Image(obra).resizable().aspectRatio(contentMode: .fill)
            }
        }
        .frame(width: 46, height: 46)
        .clipShape(.circle)
        .overlay { Circle().strokeBorder(tema.bordeFuerte, lineWidth: 1) }
    }

    private var identity: some View {
        SurfaceCard {
            HStack(spacing: 12) {
                Circle()
                    .fill(tema.solido)
                    .frame(width: 52, height: 52)
                    .overlay {
                        Text(store.profile?.initial ?? "?")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.profile?.displayName ?? "Sin nombre")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(tema.texto)
                    Text(store.profile?.email ?? "")
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto2)
                }
                Spacer()
            }
        }
    }

    private func numberRow(_ label: String, value: Binding<String>, unit: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundStyle(tema.texto)
            Spacer()
            TextField("—", text: value)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(tema.texto)
                .frame(width: 70)
            Text(unit)
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
                .frame(width: 30, alignment: .leading)
        }
        .frame(minHeight: 44)
    }

    private func fillFromProfile() {
        guard let profile = store.profile else { return }
        bodyWeight = profile.bodyWeightKg.map { $0.formatted() } ?? ""
        height = profile.heightCm.map { $0.formatted() } ?? ""
        calorieGoal = profile.weeklyCalorieGoalKcal.map { $0.formatted() } ?? ""
        sex = profile.sex ?? .prefieroNoDecir
        level = profile.experienceLevel ?? .principiante
    }

    private func save() {
        isSaving = true
        Task {
            defer { isSaving = false }
            var fields: [String: Any] = [
                "sex": sex.rawValue,
                "experienceLevel": level.rawValue,
            ]
            // Un campo vacio se borra en vez de guardarse como 0: un peso de 0 kg
            // romperia la estimacion de calorias.
            fields["bodyWeightKg"] = Double(bodyWeight.replacingOccurrences(of: ",", with: ".")) ?? NSNull()
            fields["heightCm"] = Double(height.replacingOccurrences(of: ",", with: ".")) ?? NSNull()
            fields["weeklyCalorieGoalKcal"] = Double(calorieGoal.replacingOccurrences(of: ",", with: ".")) ?? NSNull()

            await store.updateProfile(fields)
            savedAt = Date()
        }
    }
}
