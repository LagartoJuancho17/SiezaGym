import SwiftUI

/// Las rutinas, con la misma forma que `/rutinas` en la web: título con el
/// botón de nueva, buscador, y un panel con una fila por rutina.
struct RoutinesScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    @State private var busqueda = ""
    @State private var workout: WorkoutTarget?
    @State private var creando = false

    private var visibles: [Routine] {
        let termino = busqueda.trimmingCharacters(in: .whitespaces).folding(
            options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        guard !termino.isEmpty else { return store.routines }
        return store.routines.filter {
            $0.name.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
                .contains(termino)
        }
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

                if store.routines.isEmpty {
                    Vacio(texto: "Todavía no tenés rutinas.",
                          accion: ("Crear la primera", { creando = true }))
                        .padding(.top, 24)
                } else if visibles.isEmpty {
                    Vacio(texto: "Ninguna rutina coincide.")
                        .padding(.top, 24)
                } else {
                    PanelLista {
                        ForEach(Array(visibles.enumerated()), id: \.element.id) { indice, rutina in
                            if indice > 0 {
                                Rectangle().fill(tema.borde).frame(height: 1)
                            }
                            NavigationLink {
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
                        }
                    }
                    .padding(.top, 24)
                }
            }
            .bottomNavInset()
            .fullScreenCover(item: $workout) { objetivo in
                WorkoutView(store: store, routine: objetivo.routine)
            }
            .fullScreenCover(isPresented: $creando) {
                RoutineComposerScreen(store: store)
            }
        }
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
