import SwiftUI

struct ProfileView: View {
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

                    SurfaceCard {
                        VStack(alignment: .leading, spacing: 12) {
                            WidgetHeader(title: "Tus datos")

                            numberRow("Peso corporal", value: $bodyWeight, unit: "kg")
                            numberRow("Altura", value: $height, unit: "cm")
                            numberRow("Meta semanal", value: $calorieGoal, unit: "kcal")

                            HStack {
                                Text("Sexo")
                                    .font(.system(size: 14))
                                    .foregroundStyle(Theme.cardText)
                                Spacer()
                                Picker("Sexo", selection: $sex) {
                                    ForEach(Sex.allCases, id: \.self) { Text($0.label).tag($0) }
                                }
                                .labelsHidden()
                                .pickerStyle(.menu)
                                .tint(Theme.accent)
                            }
                            .frame(minHeight: 44)

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Nivel")
                                    .font(.system(size: 14))
                                    .foregroundStyle(Theme.cardText)
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
                                .foregroundStyle(Theme.cardMuted)

                            Button(isSaving ? "Guardando…" : "Guardar", action: save)
                                .buttonStyle(AccentButtonStyle())
                                .disabled(isSaving)

                            if let savedAt {
                                Label(
                                    "Guardado \(savedAt.formatted(.dateTime.hour().minute()))",
                                    systemImage: "checkmark.circle.fill"
                                )
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Theme.accent)
                                .transition(.opacity)
                            }
                        }
                    }

                    Button("Cerrar sesión") { auth.signOut() }
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.accentLight)
                        .frame(maxWidth: .infinity, minHeight: 50)
                }
                .padding(12)
            }
            .background(Theme.background)
            .bottomNavInset()
            .scrollIndicators(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Perfil")
            .task { fillFromProfile() }
            .animation(.smooth(duration: 0.25), value: savedAt)
        }
    }

    private var identity: some View {
        SurfaceCard {
            HStack(spacing: 12) {
                Circle()
                    .fill(Theme.accent)
                    .frame(width: 52, height: 52)
                    .overlay {
                        Text(store.profile?.initial ?? "?")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.profile?.displayName ?? "Sin nombre")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(Theme.cardText)
                    Text(store.profile?.email ?? "")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.cardMuted)
                }
                Spacer()
            }
        }
    }

    private func numberRow(_ label: String, value: Binding<String>, unit: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundStyle(Theme.cardText)
            Spacer()
            TextField("—", text: value)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(Theme.cardText)
                .frame(width: 70)
            Text(unit)
                .font(.system(size: 11))
                .foregroundStyle(Theme.cardMuted)
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
