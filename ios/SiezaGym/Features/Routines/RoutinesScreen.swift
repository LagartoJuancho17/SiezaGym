import SwiftUI

/// Las rutinas, con la misma forma que `/rutinas` en la web: título con el
/// botón de nueva, buscador, y un panel con una fila por rutina.
struct RoutinesScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    @State private var busqueda = ""
    @State private var workout: WorkoutTarget?
    @State private var creando = false
    @State private var editando: Routine?
    @State private var confirmandoBorrado: Routine?
    @State private var error: String?

    private var visibles: [Routine] {
        let termino = busqueda.trimmingCharacters(in: .whitespaces).folding(
            options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        guard !termino.isEmpty else { return store.routines }
        return store.routines.filter {
            $0.name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
                .contains(termino)
        }
    }

    /// Los meses son un rótulo y no un acordeón, igual que en la web: llegar a
    /// una rutina no puede costar dos clics en dos niveles desplegables. Con
    /// una búsqueda en curso se esconden: cortar tres resultados en secciones
    /// por semana los desordena en vez de ayudarlos a encontrar.
    private var agrupar: Bool { busqueda.trimmingCharacters(in: .whitespaces).isEmpty }

    private var secciones: [TrainingCalendar.SeccionSemana<Routine>] {
        TrainingCalendar.seccionesPorSemana(visibles, fechaDe: \.referenceDate)
    }

    var body: some View {
        NavigationStack {
            Pantalla(titulo: "Rutinas") {
                Button { creando = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .medium))
                        .foregroundStyle(tema.sobreSolido)
                        .frame(width: 56, height: 56)
                        .background(tema.solido, in: .circle)
                }
                .accessibilityLabel("Nueva rutina")
            } contenido: {
                buscador

                // Diez rutinas listas para copiar (upper, lower, full body...).
                NavigationLink { RutinasArmadasScreen(store: store) } label: {
                    PanelLista {
                        FilaLista(
                            nombre: "Rutinas armadas",
                            detalle: "Upper, lower, full body, push, pull y más",
                            etiqueta: "\(RutinasArmadas.cargar().count) listas"
                        )
                    }
                }
                .buttonStyle(.plain)
                .padding(.top, 14)

                if store.routines.isEmpty {
                    Vacio(texto: "Todavía no tenés rutinas.",
                          accion: ("Crear la primera", { creando = true }))
                        .padding(.top, 24)
                } else if visibles.isEmpty {
                    Vacio(texto: "Ninguna rutina coincide.")
                        .padding(.top, 24)
                } else if agrupar {
                    ForEach(secciones) { seccion in
                        SectionLabel(seccion.texto)
                            .padding(.top, 24)
                            .padding(.bottom, 10)
                        panel(seccion.items)
                    }
                } else {
                    panel(visibles)
                        .padding(.top, 24)
                }
            }
            .bottomNavInset()
            .fullScreenCover(item: $workout) { objetivo in
                WorkoutView(
                    store: store,
                    routine: objetivo.routine,
                    existingDraft: store.activeWorkout?.routine?.id == objetivo.routine?.id ? store.activeWorkout : nil
                )
            }
            .fullScreenCover(isPresented: $creando) {
                RoutineComposerScreen(store: store)
            }
            .fullScreenCover(item: $editando) { rutina in
                RoutineComposerScreen(store: store, routine: rutina)
            }
            .confirmationDialog(
                "¿Eliminar \(confirmandoBorrado?.name ?? "esta rutina")?",
                isPresented: Binding(
                    get: { confirmandoBorrado != nil },
                    set: { if !$0 { confirmandoBorrado = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Eliminar", role: .destructive) {
                    if let rutina = confirmandoBorrado { Task { await borrar(rutina) } }
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en el historial.")
            }
            .alert(
                "No se pudo hacer",
                isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(error ?? "")
            }
        }
    }

    private func panel(_ rutinas: [Routine]) -> some View {
        PanelLista {
            ForEach(Array(rutinas.enumerated()), id: \.element.id) { indice, rutina in
                if indice > 0 {
                    Rectangle().fill(tema.borde).frame(height: 1)
                }
                fila(rutina)
            }
        }
    }

    @ViewBuilder private func fila(_ rutina: Routine) -> some View {
        let enlace = NavigationLink {
            RoutineDetailScreen(routine: rutina, store: store) { elegida in
                workout = WorkoutTarget(routine: elegida)
            }
        } label: {
            FilaLista(
                nombre: rutina.name,
                detalle: detalle(rutina),
                etiqueta: rutina.isAssigned ? "Del coach" : nil
            )
        }
        .buttonStyle(.plain)

        // Igual que `routineMenuActions` en la web: una rutina del coach no
        // ofrece nada al mantenerla presionada, ni editar ni borrar — esa se
        // maneja desde su panel.
        if rutina.isAssigned {
            enlace
        } else {
            enlace.contextMenu {
                Button { editando = rutina } label: {
                    Label("Editar", systemImage: "pencil")
                }
                Button { Task { await alternarPortada(rutina) } } label: {
                    Label(
                        rutina.showOnHome ? "Quitar de la portada" : "Mostrar en la portada",
                        systemImage: rutina.showOnHome ? "house.slash" : "house"
                    )
                }
                Button { Task { await duplicar(rutina) } } label: {
                    Label("Duplicar", systemImage: "doc.on.doc")
                }
                Button(role: .destructive) { confirmandoBorrado = rutina } label: {
                    Label("Eliminar", systemImage: "trash")
                }
            }
        }
    }

    private func borrar(_ rutina: Routine) async {
        do { try await store.deleteRoutine(rutina) } catch { self.error = error.localizedDescription }
    }

    private func duplicar(_ rutina: Routine) async {
        do { try await store.duplicateRoutine(rutina) } catch { self.error = error.localizedDescription }
    }

    private func alternarPortada(_ rutina: Routine) async {
        do { try await store.setShowOnHome(rutina, showOnHome: !rutina.showOnHome) }
        catch { self.error = error.localizedDescription }
    }

    private var buscador: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 17))
                .foregroundStyle(tema.texto)
            TextField("", text: $busqueda, prompt: Text("Buscar").foregroundStyle(tema.texto2))
                .foregroundStyle(tema.texto)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
        }
        .padding(.horizontal, 20)
        .frame(height: 54)
        .background(tema.vidrio(1), in: .capsule)
        .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
        .padding(.top, 20)
    }

    private func detalle(_ rutina: Routine) -> String {
        let ejercicios = rutina.exercises.count
        let series = rutina.totalSets
        let minutos = RoutineSummary.estimatedMinutes(rutina, catalog: store.catalog)
        return "\(ejercicios) \(ejercicios == 1 ? "ejercicio" : "ejercicios") · \(series) \(series == 1 ? "serie" : "series") · \(minutos) min"
    }
}

#if DEBUG
#Preview("Rutinas") {
    RoutinesScreen(store: PreviewData.store())
        .previewSieza()
}

#Preview("Rutinas · vacío") {
    RoutinesScreen(store: PreviewData.storeVacio())
        .previewSieza()
}
#endif
