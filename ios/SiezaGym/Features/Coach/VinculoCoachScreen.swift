import SwiftUI

/// "Entrenador" desde el lado del alumno: con quién estás vinculado, cargar el
/// código que te pasó tu entrenador, o empezar a ser entrenador vos.
struct VinculoCoachScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    var api = WebAPI()

    @State private var entrenador: EntrenadorVinculado?
    @State private var cargado = false
    @State private var codigo = ""
    @State private var trabajando = false
    @State private var mensaje: String?
    @State private var confirmandoDesvincular = false
    @State private var abrirPanel = false

    private var esCoach: Bool { store.profile?.isCoach == true || store.profile?.isAdmin == true }

    var body: some View {
        Pantalla(titulo: "Entrenador", volver: true) {
            if !cargado {
                ProgressView().tint(tema.texto).frame(maxWidth: .infinity).padding(.top, 60)
            } else if let entrenador {
                GlassCard(padding: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Tu entrenador").font(.system(size: 12)).foregroundStyle(tema.texto2)
                        Text(entrenador.displayName).font(.system(size: 20, weight: .semibold)).foregroundStyle(tema.texto)
                        if let email = entrenador.email {
                            Text(email).font(.system(size: 12)).foregroundStyle(tema.texto3)
                        }
                        Text("Las rutinas que te asigne aparecen en Rutinas como «Rutina del coach».")
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto2)
                            .padding(.top, 6)
                    }
                }
                .padding(.top, 16)

                Button("Desvincularme", role: .destructive) { confirmandoDesvincular = true }
                    .buttonStyle(GhostButtonStyle())
                    .frame(maxWidth: .infinity)
                    .padding(.top, 16)
            } else {
                GlassCard(padding: 16) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("¿Tenés entrenador?").font(.system(size: 17, weight: .semibold)).foregroundStyle(tema.texto)
                        Text("Pedile su código y cargalo acá. Vas a ver las rutinas que te asigne y él va a ver tus entrenamientos.")
                            .font(.system(size: 13))
                            .foregroundStyle(tema.texto2)
                            .fixedSize(horizontal: false, vertical: true)
                        TextField("", text: $codigo, prompt: Text("ABC-123").foregroundStyle(tema.texto3))
                            .font(.system(size: 22, weight: .semibold, design: .monospaced))
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .multilineTextAlignment(.center)
                            .foregroundStyle(tema.texto)
                            .frame(minHeight: 54)
                            .background(tema.vidrio(1), in: .rect(cornerRadius: 14))
                            .overlay { RoundedRectangle(cornerRadius: 14).strokeBorder(tema.borde, lineWidth: 1) }
                        Button(trabajando ? "Vinculando…" : "Vincularme") { Task { await vincular() } }
                            .buttonStyle(SolidButtonStyle())
                            .disabled(codigo.filter { $0.isLetter || $0.isNumber }.count < 6 || trabajando)
                    }
                }
                .padding(.top, 16)
            }

            if let mensaje {
                Text(mensaje).font(.system(size: 13)).foregroundStyle(tema.texto).padding(.top, 12)
            }

            SectionLabel("¿Sos entrenador?").padding(.top, 28).padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Text(esCoach
                         ? "Tu cuenta ya tiene el panel de entrenador."
                         : "Generá un código para sumar alumnos: tu cuenta pasa a tener el panel de entrenador.")
                        .font(.system(size: 13))
                        .foregroundStyle(tema.texto2)
                        .fixedSize(horizontal: false, vertical: true)
                    Button(esCoach ? "Abrir el panel" : (trabajando ? "Activando…" : "Activar el panel de entrenador")) {
                        Task { await serEntrenador() }
                    }
                    .buttonStyle(GhostButtonStyle())
                    .disabled(trabajando)
                }
            }
        }
        .bottomNavInset()
        .navigationDestination(isPresented: $abrirPanel) { CoachPanelScreen(store: store, api: api) }
        .task { if !cargado { await cargar() } }
        .confirmationDialog("¿Desvincularte de \(entrenador?.displayName ?? "tu entrenador")?", isPresented: $confirmandoDesvincular, titleVisibility: .visible) {
            Button("Desvincularme", role: .destructive) { Task { await desvincular() } }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Deja de ver tus entrenamientos. Las rutinas que ya te asignó dejan de estar.")
        }
    }

    private func cargar() async {
        do {
            entrenador = try await api.miEntrenador()
        } catch {
            mensaje = error.localizedDescription
        }
        cargado = true
    }

    private func vincular() async {
        trabajando = true
        defer { trabajando = false }
        do {
            entrenador = try await api.vincularme(codigo: codigo)
            codigo = ""
            mensaje = "Listo, quedaste vinculado."
            await store.load()
        } catch {
            mensaje = error.localizedDescription
        }
    }

    private func desvincular() async {
        trabajando = true
        defer { trabajando = false }
        do {
            try await api.desvincularme()
            entrenador = nil
            mensaje = nil
            await store.load()
        } catch {
            mensaje = error.localizedDescription
        }
    }

    private func serEntrenador() async {
        if esCoach { abrirPanel = true; return }
        trabajando = true
        defer { trabajando = false }
        do {
            _ = try await api.generarCodigo()
            await store.load()
            abrirPanel = true
        } catch {
            mensaje = error.localizedDescription
        }
    }
}
