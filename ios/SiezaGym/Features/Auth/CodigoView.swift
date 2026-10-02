import SwiftUI
import UIKit

/// El segundo paso del login: el código de seis números que llegó por mail.
///
/// Hasta que este código vuelva bien, la app no tiene sesión. No es una pantalla
/// que se pueda saltear: el permiso para entrar lo emite el servidor recién
/// cuando el código es correcto.
struct CodigoView: View {
    @Environment(\.tema) private var tema
    @Environment(AuthService.self) private var auth

    /// El desafío con el que se arrancó. Se guarda aparte porque reenviar el
    /// mail lo reemplaza por otro, y el de antes deja de servir.
    let desafio: MFAService.Desafio
    let email: String
    let reenviar: () async -> MFAService.Desafio?
    let cerrar: () -> Void

    @State private var actual: MFAService.Desafio?
    @State private var codigo = CodigoMFA()
    @State private var vence = Date.now
    @State private var puedeReenviarDesde = Date.now
    @State private var sacudir = false
    @FocusState private var escribiendo: Bool

    /// Medio minuto entre reenvíos: sin esto, tocar el botón varias veces
    /// manda varios mails y deja al usuario sin saber cuál código sirve.
    private static let esperaParaReenviar: TimeInterval = 30

    private var vigente: MFAService.Desafio { actual ?? desafio }

    var body: some View {
        ZStack {
            Backdrop()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    encabezado
                    casilleros
                    if let aviso = auth.errorMessage {
                        Label(aviso, systemImage: "exclamationmark.triangle.fill")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(tema.texto)
                            .transition(.opacity)
                    }
                    Button("Entrar", action: entrar)
                        .buttonStyle(AccentButtonStyle())
                        .disabled(!codigo.completo || auth.isWorking)
                        .opacity(codigo.completo && !auth.isWorking ? 1 : 0.55)
                        .overlay {
                            if auth.isWorking { ProgressView().tint(tema.sobreSolido) }
                        }
                    pie
                }
                .padding(24)
            }
            .scrollDismissesKeyboard(.never)
        }
        .animation(.smooth(duration: 0.25), value: auth.errorMessage)
        .onAppear {
            vence = .now.addingTimeInterval(TimeInterval(vigente.venceEnSegundos))
            puedeReenviarDesde = .now.addingTimeInterval(Self.esperaParaReenviar)
            escribiendo = true
        }
    }

    // MARK: - Partes

    private var encabezado: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SEGUNDO PASO")
                .font(.system(size: 13))
                .tracking(1.8)
                .foregroundStyle(tema.texto2)
            Text("Revisá tu mail")
                .font(.system(size: 30, weight: tema.plano ? .bold : .heavy))
                .tracking(-0.7)
                .foregroundStyle(tema.texto)
            Text("Te mandamos un código de 6 números a \(email).")
                .font(.system(size: 15))
                .foregroundStyle(tema.texto2)

            if vigente.porConsola {
                // Sólo aparece contra un servidor de desarrollo sin correo
                // configurado. En producción nunca se ve.
                Label("El servidor no tiene correo configurado: el código quedó en su log.",
                      systemImage: "hammer.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(tema.texto3)
            }
        }
        .padding(.top, 40)
    }

    /// Los seis casilleros.
    ///
    /// Es un solo campo de texto invisible arriba de los recuadros: seis campos
    /// de verdad obligan a manejar a mano el borrado, el pegado y el foco, y
    /// pegar el código del mail no funcionaría.
    private var casilleros: some View {
        ZStack {
            // El setter va como closure y no como `set: escribir`: pasar el
            // método directo hace explotar al compilador de Swift 6.3 armando el
            // thunk de reabstracción (crash en IRGen, no error de tipos).
            TextField("", text: Binding(get: { codigo.digitos }, set: { escribir($0) }))
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($escribiendo)
                // Invisible pero enfocable: con opacidad 0 iOS deja de
                // entregarle el teclado.
                .opacity(0.01)
                .accessibilityLabel("Código de 6 números")

            HStack(spacing: 8) {
                ForEach(0..<CodigoMFA.largo, id: \.self) { posicion in
                    casillero(posicion)
                }
            }
            .allowsHitTesting(false)
        }
        .contentShape(.rect)
        .onTapGesture { escribiendo = true }
        .offset(x: sacudir ? -8 : 0)
        .animation(.default, value: vence)
    }

    private func casillero(_ posicion: Int) -> some View {
        let digito = posicion < codigo.digitos.count
            ? String(Array(codigo.digitos)[posicion])
            : ""
        // El cursor se marca en el primer casillero vacío, y en el último
        // cuando ya están todos: si no, el código completo queda sin indicar.
        let enCurso = escribiendo && posicion == min(codigo.digitos.count, CodigoMFA.largo - 1)
        // Misma regla que los campos de LoginView: 14 en SIEZA (plano).
        let radio: CGFloat = tema.plano ? 14 : Theme.radiusSmall

        return Text(digito)
            .font(.system(size: 24, weight: .semibold, design: .rounded))
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity)
            .frame(height: 58)
            .background(tema.vidrio(1), in: .rect(cornerRadius: radio))
            .overlay {
                RoundedRectangle(cornerRadius: radio)
                    .strokeBorder(enCurso ? tema.solido : tema.borde, lineWidth: 1)
            }
            .animation(.snappy(duration: 0.15), value: enCurso)
    }

    private var pie: some View {
        VStack(spacing: 14) {
            HStack(spacing: 4) {
                Text("Vence en")
                Text(timerInterval: CuentaRegresiva.rango(hasta: vence), countsDown: true)
                    .monospacedDigit()
            }
            .font(.system(size: 13))
            .foregroundStyle(tema.texto3)

            Button(action: pedirOtro) {
                Text("Reenviar el código")
                    .font(.system(size: 13))
                    .foregroundStyle(tema.texto)
                    .underline()
            }
            .disabled(auth.isWorking || Date.now < puedeReenviarDesde)
            .opacity(Date.now < puedeReenviarDesde ? 0.45 : 1)

            Button("Volver", action: cerrar)
                .font(.system(size: 13))
                .foregroundStyle(tema.texto2)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
    }

    // MARK: - Acciones

    private func escribir(_ entrada: String) {
        let antes = codigo.digitos
        codigo.escribir(entrada)
        guard codigo.digitos != antes else { return }

        auth.clearError()
        // Con los seis puestos entra solo: tocar "Entrar" después de tipear el
        // último número es un paso de más.
        if codigo.completo { entrar() }
    }

    private func entrar() {
        guard codigo.completo, !auth.isWorking else { return }
        Task {
            let entro = await auth.entrarConCodigo(desafio: vigente.id, codigo: codigo)
            if entro {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                return
            }
            rechazar()
        }
    }

    /// Código equivocado: vibra, sacude los casilleros y los deja vacíos para
    /// escribir de nuevo sin tener que borrar seis veces.
    private func rechazar() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
        codigo = CodigoMFA()
        escribiendo = true

        withAnimation(.snappy(duration: 0.08).repeatCount(3, autoreverses: true)) {
            sacudir = true
        }
        Task {
            try? await Task.sleep(for: .milliseconds(300))
            sacudir = false
        }
    }

    private func pedirOtro() {
        Task {
            guard let nuevo = await reenviar() else { return }
            actual = nuevo
            codigo = CodigoMFA()
            vence = .now.addingTimeInterval(TimeInterval(nuevo.venceEnSegundos))
            puedeReenviarDesde = .now.addingTimeInterval(Self.esperaParaReenviar)
            escribiendo = true
        }
    }
}
