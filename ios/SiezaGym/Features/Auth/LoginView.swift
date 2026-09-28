import SwiftUI

/// Entrar o crear la cuenta.
///
/// La misma pantalla para las dos cosas, con las pestañas de arriba decidiendo
/// cuál: es la estructura de `LoginForm.js` en la web, con las mismas palabras.
/// Mandar a otra pantalla para agregar dos campos obliga a escribir el email de
/// nuevo.
struct LoginView: View {
    @Environment(\.tema) private var tema
    @Environment(AuthService.self) private var auth

    @State private var form = AuthForm()
    @State private var verContrasena = false
    @State private var desafio: MFAService.Desafio?
    @FocusState private var campo: Campo?

    private enum Campo { case nombre, email, password, repetir }

    private var creando: Bool { form.modo == .crear }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                encabezado
                pestanas

                GlassCard(padding: 18, radius: Theme.radius) {
                    VStack(spacing: 16) {
                        botonGoogle
                        separador
                        formulario
                    }
                }

                pie
            }
            .padding(24)
        }
        .scrollDismissesKeyboard(.interactively)
        .tecladoConBotonListo()
        .animation(.smooth(duration: 0.25), value: auth.errorMessage)
        .animation(.smooth(duration: 0.25), value: form.modo)
        .sheet(isPresented: hayDesafio) {
            if let desafio {
                CodigoView(
                    desafio: desafio,
                    email: form.emailNormalizado,
                    reenviar: { await auth.pedirCodigo(form) },
                    cerrar: { self.desafio = nil }
                )
            }
        }
    }

    /// El sheet se cierra solo cuando se borra el desafío, y arrastrarlo hacia
    /// abajo tiene que hacer lo mismo: cancelar y volver al formulario.
    private var hayDesafio: Binding<Bool> {
        Binding(get: { desafio != nil }, set: { if !$0 { desafio = nil } })
    }

    // MARK: - Encabezado y pestañas

    private var encabezado: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SIEZAGYM")
                .font(.system(size: 13))
                .tracking(1.8)
                .foregroundStyle(tema.texto2)
            Text(form.modo.titulo)
                .font(.system(size: 30, weight: .heavy))
                .tracking(-0.7)
                .foregroundStyle(tema.texto)
                .contentTransition(.numericText())
        }
        .padding(.top, 50)
    }

    /// Las dos pestañas, mitad y mitad: el `.d2-segs` de la web.
    private var pestanas: some View {
        HStack(spacing: 8) {
            ForEach(AuthMode.allCases, id: \.self) { modo in
                let activa = form.modo == modo
                Button {
                    withAnimation(.smooth(duration: 0.25)) {
                        form.cambiarA(modo)
                        auth.clearError()
                    }
                    campo = nil
                } label: {
                    Text(modo.pestana)
                        .font(.system(size: 13))
                        .foregroundStyle(activa ? tema.sobreSolido : tema.texto2)
                        .frame(maxWidth: .infinity, minHeight: 38)
                        .background(activa ? AnyShapeStyle(tema.solido) : AnyShapeStyle(tema.vidrio(1)), in: .capsule)
                        .overlay {
                            Capsule().strokeBorder(activa ? .clear : tema.borde, lineWidth: 1)
                        }
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Google

    /// El botón de Google, dibujado como el de la web: a todo lo ancho, con la
    /// misma altura y forma que el botón principal.
    ///
    /// Antes usaba `GoogleSignInButton` del SDK, que se plantaba en su ancho y
    /// venía con su fondo blanco: sobre los temas oscuros parecía pegoteado de
    /// otra app. La G sigue siendo el logo oficial sin recolorear, que es lo que
    /// piden las guías de marca; lo que no exigen es usar su botón.
    private var botonGoogle: some View {
        Button {
            campo = nil
            Task { await auth.signInWithGoogle() }
        } label: {
            HStack(spacing: 10) {
                Image("GoogleG")
                    .resizable()
                    .frame(width: 18, height: 18)
                Text(form.modo.conGoogle)
                    .font(.system(size: 14, weight: .medium))
            }
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(tema.vidrio(2), in: .capsule)
            .overlay { Capsule().strokeBorder(tema.bordeFuerte, lineWidth: 1) }
        }
        .buttonStyle(.plain)
        .disabled(auth.isWorking)
        .opacity(auth.isWorking ? 0.5 : 1)
    }

    private var separador: some View {
        HStack(spacing: 12) {
            linea
            Text("o con tu email")
                .font(.system(size: 11))
                .foregroundStyle(tema.texto3)
            linea
        }
    }

    private var linea: some View {
        Rectangle().fill(tema.borde).frame(height: 1)
    }

    // MARK: - Formulario

    @ViewBuilder
    private var formulario: some View {
        VStack(spacing: 16) {
            if creando {
                campoTexto("Nombre", "Como querés que te llamemos", texto: $form.nombre, campo: .nombre)
                    .textContentType(.name)
            }

            campoTexto("Email", "tu@email.com", texto: $form.email, campo: .email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline) {
                    etiqueta("Contraseña")
                    Spacer()
                    // Texto y no un ojo, igual que en la web: "Mostrar" dice lo
                    // que hace y anuncia el estado sin depender del icono.
                    Button(verContrasena ? "Ocultar" : "Mostrar") {
                        verContrasena.toggle()
                    }
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
                }
                caja(
                    marcador: creando ? "Al menos 6 caracteres" : "Tu contraseña",
                    texto: $form.password,
                    campo: .password,
                    contenido: creando ? .newPassword : .password
                )
            }

            if creando {
                VStack(alignment: .leading, spacing: 8) {
                    etiqueta("Repetir contraseña")
                    caja(
                        marcador: "La misma de arriba",
                        texto: $form.repetir,
                        campo: .repetir,
                        contenido: .newPassword
                    )
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if let aviso = form.problema ?? auth.errorMessage {
                Label(aviso, systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            Button(form.modo.accion, action: enviar)
                .buttonStyle(AccentButtonStyle())
                .disabled(!puedeEnviar)
                .opacity(puedeEnviar ? 1 : 0.55)
                .overlay {
                    if auth.isWorking { ProgressView().tint(tema.sobreSolido) }
                }
        }
    }

    private var puedeEnviar: Bool { form.puedeEnviar && !auth.isWorking }

    private func etiqueta(_ texto: String) -> some View {
        Text(texto)
            .font(.system(size: 12))
            .foregroundStyle(tema.texto2)
    }

    private func campoTexto(
        _ label: String,
        _ marcador: String,
        texto: Binding<String>,
        campo cual: Campo
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            etiqueta(label)
            caja(marcador: marcador, texto: texto, campo: cual, contenido: nil)
        }
    }

    /// La caja de un campo. Un solo lugar decide el alto, el radio y el borde
    /// enfocado, así ningún campo queda distinto de los otros.
    @ViewBuilder
    private func caja(
        marcador: String,
        texto: Binding<String>,
        campo cual: Campo,
        contenido: UITextContentType?
    ) -> some View {
        let esPassword = cual == .password || cual == .repetir
        let prompt = Text(marcador).foregroundStyle(tema.texto3)

        Group {
            if esPassword, !verContrasena {
                SecureField("", text: texto, prompt: prompt)
            } else {
                TextField("", text: texto, prompt: prompt)
            }
        }
        .textContentType(contenido)
        .focused($campo, equals: cual)
        .textFieldStyle(.plain)
        .foregroundStyle(tema.texto)
        .submitLabel(cual == .repetir || (cual == .password && !creando) ? .go : .next)
        .onSubmit(siguienteCampo)
        .padding(.horizontal, 16)
        .frame(height: 52)
        .background(tema.vidrio(1), in: .rect(cornerRadius: Theme.radiusSmall))
        .overlay {
            RoundedRectangle(cornerRadius: Theme.radiusSmall)
                .strokeBorder(campo == cual ? tema.solido : tema.borde, lineWidth: 1)
        }
        .animation(.snappy(duration: 0.15), value: campo)
    }

    private var pie: some View {
        HStack(spacing: 6) {
            Text(creando ? "¿Ya tenés cuenta?" : "¿Todavía no tenés cuenta?")
                .foregroundStyle(tema.texto2)
            Button(creando ? "Iniciá sesión" : "Creá una gratis") {
                withAnimation(.smooth(duration: 0.25)) {
                    form.cambiarA(creando ? .entrar : .crear)
                    auth.clearError()
                }
            }
            .foregroundStyle(tema.texto)
            .underline()
        }
        .font(.system(size: 13))
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    // MARK: - Acciones

    /// Enter salta al campo que sigue, y en el último envía.
    private func siguienteCampo() {
        switch campo {
        case .nombre: campo = .email
        case .email: campo = .password
        case .password: campo = creando ? .repetir : nil
        default: campo = nil
        }
        if campo == nil { enviar() }
    }

    private func enviar() {
        guard puedeEnviar else { return }
        campo = nil
        Task {
            // Esto no abre ninguna sesión: sólo hace que salga el mail. La
            // sesión llega cuando el código vuelve bien, en CodigoView.
            desafio = await auth.pedirCodigo(form)
        }
    }
}
