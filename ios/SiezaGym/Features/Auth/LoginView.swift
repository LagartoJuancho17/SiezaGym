import SwiftUI
import UIKit

struct LoginView: View {
    @Environment(\.tema) private var tema
    @Environment(AuthService.self) private var auth

    @State private var form = EmailAuthForm()
    @State private var challenge: PendingEmailChallenge?
    @State private var code = ""
    @State private var passwordVisible = false
    @FocusState private var focus: Field?

    private enum Field { case name, email, password, repeatedPassword, code }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                if let challenge {
                    verification(challenge)
                } else {
                    credentials
                }
            }
            .frame(maxWidth: 440)
            .frame(maxWidth: .infinity)
            .padding(24)
        }
        .scrollDismissesKeyboard(.interactively)
        .tecladoConBotonListo()
        .animation(.smooth(duration: 0.25), value: auth.errorMessage)
        .animation(.smooth(duration: 0.25), value: challenge != nil)
    }

    private var credentials: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 4) {
                modeTab("Iniciar sesión", mode: .signIn)
                modeTab("Crear cuenta", mode: .signUp)
            }
            .padding(4)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 15))
            .overlay { RoundedRectangle(cornerRadius: 15).strokeBorder(tema.borde, lineWidth: 1) }

            VStack(spacing: 11) {
                if form.mode == .signUp {
                    field("Nombre", text: $form.displayName, field: .name)
                        .textContentType(.name)
                }
                field("Email", text: $form.email, field: .email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                passwordField("Contraseña", text: $form.password, field: .password)
                    .textContentType(form.mode == .signIn ? .password : .newPassword)
                if form.mode == .signUp {
                    passwordField("Repetir contraseña", text: $form.repeatedPassword, field: .repeatedPassword)
                        .textContentType(.newPassword)
                    if form.passwordMismatch {
                        Text("Las dos contraseñas no coinciden.")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(tema.solido)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            Button(passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña") {
                passwordVisible.toggle()
            }
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(tema.texto2)

            errorLabel

            Button(form.mode == .signIn ? "Iniciar sesión" : "Crear cuenta", action: start)
                .buttonStyle(AccentButtonStyle())
                .disabled(!form.canSubmit || auth.isWorking)
                .opacity(form.canSubmit && !auth.isWorking ? 1 : 0.48)
                .overlay { if auth.isWorking { ProgressView().tint(tema.sobreSolido) } }

            separator

            // El ícono oficial viene del bundle del SDK. El contenedor es una
            // superficie plana SIEZA: mismo ancho y radio que el CTA principal.
            Button {
                focus = nil
                Task { await auth.signInWithGoogle() }
            } label: {
                HStack(spacing: 12) {
                    if let googleLogo {
                        Image(uiImage: googleLogo)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 22, height: 22)
                    }
                    Text(form.mode == .signUp ? "Crear cuenta con Google" : "Continuar con Google")
                        .font(.system(size: 15, weight: .semibold))
                }
                .foregroundStyle(Color(red: 0.12, green: 0.13, blue: 0.15))
                .frame(maxWidth: .infinity, minHeight: 54)
                .background(.white, in: .rect(cornerRadius: tema.plano ? 14 : Theme.radius))
            }
            .buttonStyle(.plain)
            .disabled(auth.isWorking)
        }
    }

    private func modeTab(_ title: String, mode: EmailAuthMode) -> some View {
        Button {
            focus = nil
            form.changeMode(to: mode)
            auth.clearError()
        } label: {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(form.mode == mode ? tema.texto : tema.texto2)
                .frame(maxWidth: .infinity, minHeight: 42)
                .background(form.mode == mode ? tema.vidrio(3) : .clear,
                            in: .rect(cornerRadius: 11))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(form.mode == mode ? .isSelected : [])
    }

    private var googleLogo: UIImage? {
        guard let bundleURL = Bundle.main.url(forResource: "GoogleSignIn_GoogleSignIn", withExtension: "bundle"),
              let bundle = Bundle(url: bundleURL),
              let imageURL = bundle.url(forResource: "google@3x", withExtension: "png") else {
            return nil
        }
        return UIImage(contentsOfFile: imageURL.path)
    }

    /// "o" entre el login por email y el de Google.
    private var separator: some View {
        HStack(spacing: 12) {
            line
            Text("o")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto3)
            line
        }
        .padding(.vertical, 2)
    }

    private var line: some View {
        Rectangle()
            .fill(tema.borde)
            .frame(height: 1)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SIEZA / ACCESO")
                .font(.system(size: 11, weight: .bold))
                .tracking(1.6)
                .foregroundStyle(tema.solido)
            Text(challenge == nil
                 ? (form.mode == .signIn ? "Bienvenido de nuevo" : "Creá tu cuenta")
                 : "Revisá tu correo")
                .font(.system(size: 34, weight: .bold))
                .tracking(-1.1)
                .foregroundStyle(tema.texto)
            Text(challenge == nil
                 ? "Tus entrenamientos, en un solo lugar."
                 : "Ingresá el código para completar el acceso.")
                .font(.system(size: 15))
                .foregroundStyle(tema.texto2)
        }
        .padding(.top, 60)
        .padding(.bottom, 6)
    }

    private func field(_ label: String, text: Binding<String>, field: Field) -> some View {
        TextField("", text: text, prompt: Text(label).foregroundStyle(tema.texto3))
            .focused($focus, equals: field)
            .textFieldStyle(.plain)
            .foregroundStyle(tema.texto)
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(tema.vidrio(1), in: .rect(cornerRadius: tema.plano ? 14 : Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: tema.plano ? 14 : Theme.radius)
                    .strokeBorder(focus == field ? tema.solido : tema.borde, lineWidth: 1)
            }
            .animation(.snappy(duration: 0.15), value: focus)
    }

    private func passwordField(_ title: String, text: Binding<String>, field: Field) -> some View {
        Group {
            if passwordVisible {
                TextField("", text: text, prompt: Text(title).foregroundStyle(tema.texto3))
            } else {
                SecureField("", text: text, prompt: Text(title).foregroundStyle(tema.texto3))
            }
        }
            .focused($focus, equals: field)
            .textFieldStyle(.plain)
            .foregroundStyle(tema.texto)
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(tema.vidrio(1), in: .rect(cornerRadius: tema.plano ? 14 : Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: tema.plano ? 14 : Theme.radius)
                    .strokeBorder(focus == field ? tema.solido : tema.borde, lineWidth: 1)
            }
            .onSubmit(start)
            .animation(.snappy(duration: 0.15), value: focus)
    }

    private var errorLabel: some View {
        Group {
            if let message = auth.errorMessage {
                Label(message, systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.updatesFrequently)
            }
        }
    }

    private func verification(_ pending: PendingEmailChallenge) -> some View {
        VStack(alignment: .leading, spacing: 22) {
            Button {
                focus = nil
                code = ""
                challenge = nil
                form.password = ""
                auth.clearError()
            } label: {
                Label("Volver", systemImage: "arrow.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(tema.texto2)
            }
            .buttonStyle(.plain)

            Text("Mandamos un código de 6 dígitos a \(pending.email).")
                .font(.system(size: 15))
                .foregroundStyle(tema.texto2)
                .fixedSize(horizontal: false, vertical: true)

            if pending.deliveredToConsole {
                Label("Modo desarrollo: el código está en el log del servidor.", systemImage: "hammer")
                    .font(.system(size: 13))
                    .foregroundStyle(tema.texto2)
            }

            TextField("000000", text: $code)
                .focused($focus, equals: .code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .font(.system(size: 30, weight: .semibold, design: .monospaced))
                .tracking(8)
                .foregroundStyle(tema.texto)
                .padding(.horizontal, 18)
                .frame(height: 64)
                .background(tema.vidrio(1), in: .rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .strokeBorder(focus == .code ? tema.solido : tema.borde, lineWidth: 1)
                }
                .onChange(of: code) { _, value in
                    code = String(value.filter { $0 >= "0" && $0 <= "9" }.prefix(6))
                }
                .accessibilityLabel("Código de seis dígitos")

            TimelineView(.periodic(from: .now, by: 1)) { context in
                let remaining = max(0, Int(ceil(pending.expiresAt.timeIntervalSince(context.date))))
                Text(remaining > 0
                     ? String(format: "Vence en %02d:%02d", remaining / 60, remaining % 60)
                     : "El código venció. Pedí uno nuevo.")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(tema.texto2)
            }

            errorLabel

            TimelineView(.periodic(from: .now, by: 1)) { context in
                let valid = code.count == 6 && !auth.isWorking && pending.expiresAt > context.date
                Button("Verificar y entrar") {
                    focus = nil
                    Task { await auth.verifyEmail(challengeID: pending.id, code: code) }
                }
                .buttonStyle(AccentButtonStyle())
                .disabled(!valid)
                .opacity(valid ? 1 : 0.48)
                .overlay { if auth.isWorking { ProgressView().tint(tema.sobreSolido) } }
            }

            Button("Enviar un código nuevo") {
                focus = nil
                code = ""
                Task {
                    var retry = form
                    // Tras el alta la cuenta ya existe, aunque aún no tenga sesión.
                    retry.mode = .signIn
                    if let renewed = await auth.startEmail(form: retry) {
                        challenge = renewed
                    }
                }
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity)
            .disabled(auth.isWorking)
        }
    }

    private func start() {
        guard form.canSubmit, !auth.isWorking else { return }
        focus = nil
        Task {
            if let pending = await auth.startEmail(form: form) {
                code = ""
                challenge = pending
                focus = .code
            }
        }
    }
}
