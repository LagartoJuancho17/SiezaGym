import GoogleSignInSwift
import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var auth

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @FocusState private var focus: Field?

    private enum Mode { case signIn, signUp }
    private enum Field { case name, email, password }

    private var canSubmit: Bool {
        email.contains("@") && password.count >= 6 && !auth.isWorking
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header

                VStack(spacing: 10) {
                    if mode == .signUp {
                        field("Nombre", text: $displayName, field: .name)
                            .textContentType(.name)
                    }
                    field("Email", text: $email, field: .email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    secureField
                }

                if let message = auth.errorMessage {
                    Label(message, systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Theme.accentLight)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                Button(mode == .signIn ? "Entrar" : "Crear cuenta", action: submit)
                    .buttonStyle(AccentButtonStyle())
                    .disabled(!canSubmit)
                    .opacity(canSubmit ? 1 : 0.5)
                    .overlay {
                        if auth.isWorking { ProgressView().tint(.white) }
                    }

                separator

                // Boton oficial del SDK: el logo y el texto los pone Google, ya
                // localizados. Dibujar la G a mano viola las guias de marca.
                GoogleSignInButton(viewModel: googleButton) {
                    Task { await auth.signInWithGoogle() }
                }
                .disabled(auth.isWorking)
                .frame(height: 50)
                .clipShape(.rect(cornerRadius: Theme.radius))

                Button {
                    withAnimation(.smooth(duration: 0.25)) {
                        mode = mode == .signIn ? .signUp : .signIn
                        auth.clearError()
                    }
                } label: {
                    Text(mode == .signIn ? "No tengo cuenta" : "Ya tengo cuenta")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.onDarkMuted)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(24)
        }
        .scrollDismissesKeyboard(.interactively)
        .animation(.smooth(duration: 0.25), value: auth.errorMessage)
    }

    private var googleButton: GoogleSignInButtonViewModel {
        GoogleSignInButtonViewModel(scheme: .light, style: .wide, state: .normal)
    }

    /// "o" entre el login por email y el de Google.
    private var separator: some View {
        HStack(spacing: 12) {
            line
            Text("o")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.onDarkFaint)
            line
        }
        .padding(.vertical, 2)
    }

    private var line: some View {
        Rectangle()
            .fill(.white.opacity(0.14))
            .frame(height: 1)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("BIENVENIDO")
                .font(.system(size: 11, weight: .bold))
                .tracking(1.6)
                .foregroundStyle(Theme.accent)
            Text("SiezaGym")
                .font(.system(size: 44, weight: .bold, design: .default))
                .foregroundStyle(Theme.onDark)
            Text("Entrá para ver tus rutinas y registrar tus entrenamientos.")
                .font(.system(size: 15))
                .foregroundStyle(Theme.onDarkMuted)
        }
        .padding(.top, 60)
        .padding(.bottom, 6)
    }

    private func field(_ label: String, text: Binding<String>, field: Field) -> some View {
        TextField("", text: text, prompt: Text(label).foregroundStyle(Theme.onDarkFaint))
            .focused($focus, equals: field)
            .textFieldStyle(.plain)
            .foregroundStyle(Theme.onDark)
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(.white.opacity(0.08), in: .rect(cornerRadius: Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.radius)
                    .strokeBorder(focus == field ? Theme.accent : Theme.crimson, lineWidth: 1)
            }
            .animation(.snappy(duration: 0.15), value: focus)
    }

    private var secureField: some View {
        SecureField("", text: $password, prompt: Text("Contraseña").foregroundStyle(Theme.onDarkFaint))
            .focused($focus, equals: .password)
            .textContentType(mode == .signIn ? .password : .newPassword)
            .textFieldStyle(.plain)
            .foregroundStyle(Theme.onDark)
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(.white.opacity(0.08), in: .rect(cornerRadius: Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.radius)
                    .strokeBorder(focus == .password ? Theme.accent : Theme.crimson, lineWidth: 1)
            }
            .onSubmit(submit)
            .animation(.snappy(duration: 0.15), value: focus)
    }

    private func submit() {
        guard canSubmit else { return }
        focus = nil
        Task {
            switch mode {
            case .signIn: await auth.signIn(email: email, password: password)
            case .signUp: await auth.signUp(email: email, password: password, displayName: displayName)
            }
        }
    }
}
