import SwiftUI

/// Un alumno: sus datos, lo que le asignaste y sus últimos entrenamientos.
/// Desde acá se le asigna una de tus rutinas o se lo desvincula.
struct CoachAlumnoScreen: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore
    let alumno: PanelCoach.Alumno
    var api = WebAPI()
    /// Para que el panel recargue los totales después de un cambio.
    var alCambiar: () -> Void = {}

    @State var detalle: DetalleAlumno?
    @State private var error: String?
    @State private var asignando = false
    @State private var confirmandoQuitar = false
    @State private var quitandoAsignacion: DetalleAlumno.Asignacion?

    var body: some View {
        Pantalla(titulo: alumno.displayName, rotulo: "Alumno", volver: true) {
            if let detalle {
                datos(detalle.student).padding(.top, 16)

                if !detalle.records.isEmpty {
                    HStack {
                        SectionLabel("Récords")
                        Spacer()
                        if detalle.records.count > 6 {
                            NavigationLink("Ver todos") { CoachRecordsScreen(detalle: detalle) }
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(tema.solido)
                        }
                    }
                    .padding(.top, 24)
                    .padding(.bottom, 10)
                    ListaRecords(records: Array(detalle.records.prefix(6)), detalle: detalle)
                }

                HStack {
                    SectionLabel("Rutinas asignadas")
                    Spacer()
                    Button { asignando = true } label: {
                        Label("Asignar", systemImage: "plus").font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(tema.solido)
                    .disabled(store.routines.allSatisfy(\.isAssigned))
                }
                .padding(.top, 24)
                .padding(.bottom, 10)

                if detalle.assignments.isEmpty {
                    Vacio(texto: "Todavía no le asignaste rutinas.")
                } else {
                    PanelLista {
                        ForEach(Array(detalle.assignments.enumerated()), id: \.element.id) { indice, asignacion in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            FilaLista(
                                nombre: asignacion.routineName,
                                detalle: estado(de: asignacion),
                                etiqueta: asignacion.weekLabel,
                                chevron: false
                            )
                            .contextMenu {
                                Button("Sacar la asignación", systemImage: "trash", role: .destructive) {
                                    quitandoAsignacion = asignacion
                                }
                            }
                        }
                    }
                    Text("Mantené presionada una rutina para sacarla.")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                        .padding(.top, 6)
                }

                SectionLabel("Últimos entrenamientos").padding(.top, 24).padding(.bottom, 10)
                if detalle.sessions.isEmpty {
                    Vacio(texto: "Todavía no registró entrenamientos.")
                } else {
                    PanelLista {
                        ForEach(Array(detalle.sessions.prefix(15).enumerated()), id: \.element.id) { indice, sesion in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            NavigationLink {
                                CoachSesionScreen(sesion: sesion, nombres: detalle.exerciseNames)
                            } label: {
                                FilaLista(
                                    nombre: sesion.routineName ?? "Entrenamiento libre",
                                    detalle: resumen(de: sesion),
                                    etiqueta: sesion.exercises.contains(where: \.hayPR) ? "🏆 PR" : nil,
                                    valor: ProgressMetrics.formatKg(sesion.totalVolumeKg),
                                    unidad: "\(sesion.totalSetsCompleted) series"
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Button("Desvincular alumno", role: .destructive) { confirmandoQuitar = true }
                    .buttonStyle(GhostButtonStyle())
                    .frame(maxWidth: .infinity)
                    .padding(.top, 24)
            } else if let error {
                Vacio(texto: error, accion: ("Reintentar", { Task { await cargar() } }))
                    .padding(.top, 24)
            } else {
                ProgressView().tint(tema.texto).frame(maxWidth: .infinity).padding(.top, 60)
            }
        }
        .bottomNavInset()
        .refreshable { await cargar() }
        .task { if detalle == nil { await cargar() } }
        .sheet(isPresented: $asignando) {
            AsignarRutinaSheet(store: store, alumno: alumno.displayName) { rutina, semana, nota in
                try await api.asignar(rutina: rutina.id, a: alumno.studentId, semana: semana, nota: nota)
                await cargar()
                alCambiar()
            }
        }
        .confirmationDialog(
            "¿Desvincular a \(alumno.displayName)?",
            isPresented: $confirmandoQuitar,
            titleVisibility: .visible
        ) {
            Button("Desvincular", role: .destructive) { Task { await quitar() } }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Deja de ver sus entrenamientos y no le podés asignar rutinas. Sus datos no se borran.")
        }
        .confirmationDialog(
            "¿Sacar \(quitandoAsignacion?.routineName ?? "la rutina")?",
            isPresented: Binding(get: { quitandoAsignacion != nil }, set: { if !$0 { quitandoAsignacion = nil } }),
            titleVisibility: .visible
        ) {
            Button("Sacar", role: .destructive) {
                if let asignacion = quitandoAsignacion { Task { await desasignar(asignacion) } }
            }
            Button("Cancelar", role: .cancel) {}
        }
    }

    private func datos(_ perfil: DetalleAlumno.Perfil) -> some View {
        let objetivo = perfil.trainingGoal.flatMap(TrainingGoal.init(rawValue:))?.label
        let nivel = perfil.experienceLevel.flatMap(ExperienceLevel.init(rawValue:))?.label
        return StatsCard(datos: [
            (objetivo ?? "—", "objetivo"),
            (perfil.trainingDaysPerWeek.map { "\($0)" } ?? "—", "días por semana"),
            (perfil.bodyWeightKg.map { "\(BodyMetrics.numero($0)) kg" } ?? nivel ?? "—", perfil.bodyWeightKg != nil ? "peso" : "experiencia"),
        ])
    }

    /// "3 oct · Press de banca 80 kg × 8, Remo…": la fecha y la mejor serie
    /// del primer ejercicio, para ver de un vistazo cuánto levantó.
    private func resumen(de sesion: DetalleAlumno.Sesion) -> String {
        let fecha = sesion.finishedAt?.formatted(.dateTime.day().month(.abbreviated)) ?? ""
        guard let primero = sesion.exercises.first,
              let mejor = primero.sets.filter({ !$0.failed }).max(by: { $0.weight < $1.weight }) else { return fecha }
        let mas = sesion.exercises.count > 1 ? " +\(sesion.exercises.count - 1)" : ""
        return "\(fecha) · \(detalle?.nombre(primero.exerciseId) ?? primero.exerciseId) \(mejor.texto)\(mas)"
    }

    private func estado(de asignacion: DetalleAlumno.Asignacion) -> String {
        if let hecha = asignacion.lastCompletedAt {
            return "Hecha \(hecha.formatted(.relative(presentation: .named)))"
        }
        return "\(asignacion.exercises) ejercicios · todavía sin hacer"
    }

    private func cargar() async {
        do {
            detalle = try await api.alumno(alumno.studentId)
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func quitar() async {
        do {
            try await api.quitarAlumno(alumno.studentId)
            alCambiar()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func desasignar(_ asignacion: DetalleAlumno.Asignacion) async {
        do {
            try await api.desasignar(asignacion.id)
            await cargar()
            alCambiar()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// Elegir una de tus rutinas para asignársela a un alumno, con semana y nota
/// opcionales.
struct AsignarRutinaSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore
    let alumno: String
    let alAsignar: (Routine, Int?, String) async throws -> Void

    @State private var elegida: Routine?
    @State private var semana: Int?
    @State private var nota = ""
    @State private var guardando = false
    @State private var error: String?

    private var propias: [Routine] { store.routines.filter { !$0.isAssigned } }

    var body: some View {
        ZStack {
            Backdrop()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Asignar a \(alumno)")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(tema.texto)
                        .padding(.top, 24)

                    SectionLabel("Rutina")
                    PanelLista {
                        ForEach(Array(propias.enumerated()), id: \.element.id) { indice, rutina in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            Button { elegida = rutina } label: {
                                HStack {
                                    FilaLista(
                                        nombre: rutina.name,
                                        detalle: "\(rutina.exercises.count) ejercicios",
                                        chevron: false
                                    )
                                    Image(systemName: elegida?.id == rutina.id ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(elegida?.id == rutina.id ? tema.solido : tema.texto3)
                                        .padding(.trailing, 18)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    SectionLabel("Semana (opcional)")
                    FlowRow(spacing: 8) {
                        ForEach(1...4, id: \.self) { numero in
                            let activa = semana == numero
                            Button("Semana \(numero)") { semana = activa ? nil : numero }
                                .font(.system(size: 13))
                                .foregroundStyle(activa ? tema.sobreSolido : tema.texto2)
                                .padding(.horizontal, 14)
                                .frame(minHeight: 38)
                                .background(activa ? tema.solido : tema.vidrio(1), in: .capsule)
                                .overlay { Capsule().strokeBorder(activa ? .clear : tema.borde, lineWidth: 1) }
                        }
                    }

                    SectionLabel("Nota (opcional)")
                    TextField("", text: $nota, prompt: Text("Ej: subí el peso si llegás a 12").foregroundStyle(tema.texto3), axis: .vertical)
                        .lineLimit(2...4)
                        .foregroundStyle(tema.texto)
                        .padding(14)
                        .background(tema.vidrio(1), in: .rect(cornerRadius: 14))
                        .overlay { RoundedRectangle(cornerRadius: 14).strokeBorder(tema.borde, lineWidth: 1) }

                    if let error {
                        Text(error).font(.system(size: 13)).foregroundStyle(tema.texto)
                    }

                    Button(guardando ? "Asignando…" : "Asignar") { Task { await asignar() } }
                        .buttonStyle(SolidButtonStyle())
                        .disabled(elegida == nil || guardando)
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 32)
            }
        }
        .presentationDragIndicator(.visible)
    }

    private func asignar() async {
        guard let elegida else { return }
        guardando = true
        defer { guardando = false }
        do {
            try await alAsignar(elegida, semana, nota.trimmingCharacters(in: .whitespacesAndNewlines))
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
