import SwiftUI

/// El historial, igual que `/historial` en la web: una fila por entrenamiento
/// con su fecha, duración y series, y el volumen a la derecha.
struct HistoryScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    @State private var sessionToDelete: WorkoutSession?
    @State private var showDeleteConfirm = false
    @State private var deleteError: String?
    @State private var deletingSessionID: String?

    var body: some View {
        NavigationStack {
            Pantalla(titulo: "Historial", rotulo: "Tu actividad") {
                if store.sessions.isEmpty {
                    Vacio(texto: "Todavía no terminaste ningún entrenamiento.")
                        .padding(.top, 24)
                } else {
                    PanelLista {
                        ForEach(Array(store.sessions.enumerated()), id: \.element.id) { indice, sesion in
                            if indice > 0 {
                                Rectangle().fill(tema.borde).frame(height: 1)
                            }
                            NavigationLink {
                                SessionDetailScreen(session: sesion, store: store)
                            } label: {
                                FilaLista(
                                    nombre: sesion.routineName ?? "Sesión libre",
                                    detalle: detalle(sesion),
                                    valor: "\(Int(sesion.totalVolumeKg.rounded())) kg",
                                    unidad: "volumen",
                                    chevron: false
                                )
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                Button("Eliminar sesión", systemImage: "trash", role: .destructive) {
                                    sessionToDelete = sesion
                                    showDeleteConfirm = true
                                }
                            }
                            .opacity(deletingSessionID == sesion.id ? 0.45 : 1)
                        }
                    }
                    .padding(.top, 24)

                    Text("Mantené apretada una sesión para eliminarla.")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                        .padding(.top, 10)
                }
            }
            .bottomNavInset()
            .confirmationDialog(
                "¿Eliminar esta sesión?",
                isPresented: $showDeleteConfirm,
                titleVisibility: .visible
            ) {
                Button("Eliminar sesión", role: .destructive) {
                    guard let sessionToDelete else { return }
                    delete(sessionToDelete)
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Se va a quitar del historial y no se puede deshacer.")
            }
            .alert("No se pudo eliminar", isPresented: Binding(
                get: { deleteError != nil },
                set: { if !$0 { deleteError = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(deleteError ?? "Intentá de nuevo.")
            }
        }
    }

    private func delete(_ session: WorkoutSession) {
        deletingSessionID = session.id
        deleteError = nil
        Task {
            defer { deletingSessionID = nil }
            do {
                try await store.deleteSession(session)
            } catch {
                deleteError = "Revisá tu conexión e intentá de nuevo."
            }
        }
    }

    private func detalle(_ sesion: WorkoutSession) -> String {
        let fecha = sesion.finishedAt.map {
            $0.formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated))
        } ?? "Sin fecha"
        return "\(fecha) · \(duracion(sesion.durationSeconds)) · \(sesion.totalSetsCompleted) series"
    }

    private func duracion(_ segundos: Int) -> String {
        let minutos = Int((Double(segundos) / 60).rounded())
        guard minutos >= 60 else { return "\(minutos) min" }
        return "\(minutos / 60)h \(minutos % 60)min"
    }
}

/// El detalle de una sesión: los tres números arriba y una tarjeta por
/// ejercicio con sus series, igual que en la web.
struct SessionDetailScreen: View {
    @Environment(\.tema) private var tema
    let session: WorkoutSession
    let store: GymStore

    private var hayGifs: Bool {
        session.exercises.contains { store.exercise($0.exerciseID)?.mediaURL != nil }
    }

    var body: some View {
        Pantalla(
            titulo: session.routineName ?? "Sesión libre",
            rotulo: session.finishedAt?.formatted(.dateTime.day().month(.wide).hour().minute()),
            volver: true
        ) {
            StatsCard(datos: [
                (duracion, "duración"),
                ("\(session.totalSetsCompleted)", "series"),
                ("\(Int(session.totalVolumeKg.rounded())) kg", "volumen"),
            ])
            .padding(.top, 20)

            SectionLabel("Ejercicios realizados")
                .padding(.top, 24)
                .padding(.bottom, 10)

            VStack(spacing: 14) {
                ForEach(session.exercises) { ejercicio in
                    TarjetaEjercicio(ejercicio: ejercicio, store: store)
                }
            }

            if hayGifs { CreditoGifs() }
        }
        .bottomNavInset()
    }

    private var duracion: String {
        let minutos = Int((Double(session.durationSeconds) / 60).rounded())
        guard minutos >= 60 else { return "\(minutos) min" }
        return "\(minutos / 60)h \(minutos % 60)min"
    }
}

private struct TarjetaEjercicio: View {
    @Environment(\.tema) private var tema
    let ejercicio: LoggedExercise
    let store: GymStore

    var body: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 13) {
                    Miniatura(url: store.exercise(ejercicio.exerciseID)?.mediaURL, lado: 64)
                    Text(store.name(of: ejercicio.exerciseID))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                VStack(spacing: 10) {
                    ForEach(ejercicio.sets) { serie in
                        HStack(spacing: 8) {
                            Text("Serie \(serie.setNumber)")
                                .font(.system(size: 12))
                                .foregroundStyle(tema.texto2)
                                .frame(width: 66, alignment: .leading)

                            VStack(alignment: .center, spacing: 2) {
                                Text("\(serie.weight.formatted())kg × \(serie.reps)")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(tema.texto)
                                if serie.failed {
                                    Text("fallada")
                                        .font(.system(size: 11))
                                        .italic()
                                        .foregroundStyle(tema.texto2)
                                }
                            }
                            .frame(maxWidth: .infinity)

                            // Una serie fallada no da marca: el resto de la app
                            // la descarta, y mostrarla acá diría que levantaste
                            // algo que no levantaste.
                            Text(serie.failed ? "sin marca" : "\(Epley.estimatedOneRepMax(weight: serie.weight, reps: serie.reps).formatted(.number.precision(.fractionLength(1)))) kg · 1RM est.")
                                .font(.system(size: 11))
                                .foregroundStyle(tema.texto3)
                                .frame(width: 118, alignment: .trailing)
                        }
                    }
                }
            }
        }
    }
}
