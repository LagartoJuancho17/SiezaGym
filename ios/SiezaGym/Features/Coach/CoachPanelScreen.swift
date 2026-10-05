import SwiftUI

/// El panel del entrenador en el iPhone: el código para sumar alumnos, el
/// resumen y la lista de alumnos. Los datos salen de `/api/coach`, los mismos
/// que ve la web en /dashboard/coach.
struct CoachPanelScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    var api = WebAPI()

    @State private var panel: PanelCoach?
    @State private var cargando = false
    @State private var error: String?
    @State private var trabajandoCodigo = false

    var body: some View {
        Pantalla(titulo: "Entrenador", volver: true) {
            if let panel {
                codigo(panel.code).padding(.top, 16)

                StatsCard(datos: [
                    ("\(panel.summary.linkedStudents)", panel.summary.linkedStudents == 1 ? "alumno" : "alumnos"),
                    ("\(panel.summary.assignedPlans)", panel.summary.assignedPlans == 1 ? "rutina asignada" : "rutinas asignadas"),
                    ("\(panel.summary.studentsWithActivity)", "entrenaron"),
                ])
                .padding(.top, 14)

                SectionLabel("Alumnos").padding(.top, 24).padding(.bottom, 10)
                if panel.students.isEmpty {
                    Vacio(texto: "Todavía no tenés alumnos. Pasales tu código: lo cargan en Perfil → Entrenador.")
                } else {
                    PanelLista {
                        ForEach(Array(panel.students.enumerated()), id: \.element.id) { indice, alumno in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            NavigationLink {
                                CoachAlumnoScreen(store: store, alumno: alumno, api: api) {
                                    Task { await cargar() }
                                }
                            } label: {
                                FilaLista(
                                    nombre: alumno.displayName,
                                    detalle: alumno.email ?? "",
                                    valor: "\(alumno.plans)",
                                    unidad: alumno.plans == 1 ? "rutina" : "rutinas"
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                if !panel.recentActivity.isEmpty {
                    SectionLabel("Actividad reciente").padding(.top, 24).padding(.bottom, 10)
                    PanelLista {
                        ForEach(Array(panel.recentActivity.enumerated()), id: \.element.id) { indice, actividad in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            FilaLista(
                                nombre: actividad.routineName,
                                detalle: "\(actividad.studentName ?? "Alumno") · \(actividad.completedAt.formatted(.relative(presentation: .named)))",
                                valor: actividad.durationSeconds > 0 ? "\(actividad.durationSeconds / 60)" : nil,
                                unidad: actividad.durationSeconds > 0 ? "min" : nil,
                                chevron: false
                            )
                        }
                    }
                }
            } else if let error {
                Vacio(texto: error, accion: ("Reintentar", { Task { await cargar() } }))
                    .padding(.top, 24)
            } else {
                ProgressView().tint(tema.texto).frame(maxWidth: .infinity).padding(.top, 60)
            }
        }
        .bottomNavInset()
        .refreshable { await cargar() }
        .task { if panel == nil { await cargar() } }
    }

    // MARK: - Código de invitación

    @ViewBuilder private func codigo(_ codigo: PanelCoach.Codigo?) -> some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Código para sumar alumnos")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto2)
                if let codigo {
                    Text(codigo.code)
                        .font(.system(size: 34, weight: .bold, design: .monospaced))
                        .foregroundStyle(tema.texto)
                        .textSelection(.enabled)
                        .accessibilityLabel("Código \(codigo.code.map(String.init).joined(separator: " "))")
                    Text("Vence \(codigo.expiresAt.formatted(.relative(presentation: .named))). Sirve para un alumno.")
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto3)
                    HStack(spacing: 10) {
                        ShareLink(item: "Sumate a mis rutinas en SiezaGym: en Perfil → Entrenador cargá el código \(codigo.code)") {
                            Label("Compartir", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity)
                        }
                        .buttonStyle(SolidButtonStyle())
                        Button("Anular") { Task { await anular() } }
                            .buttonStyle(GhostButtonStyle())
                            .disabled(trabajandoCodigo)
                    }
                } else {
                    Text("No tenés un código vigente.")
                        .font(.system(size: 14))
                        .foregroundStyle(tema.texto)
                    Button(trabajandoCodigo ? "Generando…" : "Generar código") { Task { await generar() } }
                        .buttonStyle(SolidButtonStyle())
                        .disabled(trabajandoCodigo)
                }
            }
        }
    }

    // MARK: - Datos

    private func cargar() async {
        cargando = true
        defer { cargando = false }
        do {
            panel = try await api.panelCoach()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func generar() async {
        trabajandoCodigo = true
        defer { trabajandoCodigo = false }
        do {
            _ = try await api.generarCodigo()
            await cargar()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func anular() async {
        trabajandoCodigo = true
        defer { trabajandoCodigo = false }
        do {
            try await api.revocarCodigo()
            await cargar()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
