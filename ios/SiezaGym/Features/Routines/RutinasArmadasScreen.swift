import SwiftUI

/// Las rutinas armadas: diez listas para usar. Tocar una muestra qué tiene y
/// la copia a tus rutinas, donde se edita como cualquier otra.
struct RutinasArmadasScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    @State private var viendo: RutinaParaCopiar?

    private let rutinas = RutinasArmadas.cargar()

    var body: some View {
        Pantalla(titulo: "Rutinas armadas", volver: true) {
            Text("Elegí una, copiala a tus rutinas y cambiala como quieras.")
                .font(.system(size: 13))
                .foregroundStyle(tema.texto2)
                .padding(.top, 8)
                .padding(.bottom, 16)

            PanelLista {
                ForEach(Array(rutinas.enumerated()), id: \.element.id) { indice, rutina in
                    if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                    Button { viendo = rutina } label: {
                        FilaLista(
                            nombre: rutina.nombre,
                            detalle: rutina.detalle,
                            valor: "\(rutina.ejercicios.count)",
                            unidad: "ejercicios"
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .bottomNavInset()
        .sheet(item: $viendo) { rutina in
            CopiarRutinaSheet(store: store, rutina: rutina)
        }
    }
}

/// Lo que tiene una rutina ajena y el botón para copiarla a las tuyas. Sirve
/// para las armadas y para las que llegan por un link compartido.
struct CopiarRutinaSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore
    let rutina: RutinaParaCopiar
    var titulo = "Agregar a mis rutinas"

    @State private var guardando = false
    @State private var copiada = false
    @State private var error: String?

    private var faltantes: [RoutineExercise] { rutina.faltantes(catalogo: store.catalog) }

    var body: some View {
        ZStack {
            Backdrop()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(rutina.nombre)
                            .font(.system(size: 28, weight: .bold))
                            .tracking(-0.6)
                            .foregroundStyle(tema.texto)
                        if !rutina.detalle.isEmpty {
                            Text(rutina.detalle).font(.system(size: 13)).foregroundStyle(tema.solido)
                        }
                        if !rutina.nota.isEmpty {
                            Text(rutina.nota)
                                .font(.system(size: 14))
                                .foregroundStyle(tema.texto2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(.top, 24)

                    PanelLista {
                        ForEach(Array(rutina.ejercicios.enumerated()), id: \.element.id) { indice, ejercicio in
                            if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                            let ficha = store.catalog[ejercicio.exerciseID]
                            let tiempo = ficha?.registrationType.isTimeBased ?? false
                            FilaLista(
                                nombre: rutina.nombre(de: ejercicio, catalogo: store.catalog),
                                detalle: ejercicio.group.isEmpty ? (ficha?.primaryMuscle?.label ?? "") : ejercicio.group,
                                valor: "\(ejercicio.targetSets) × \(ejercicio.targetReps)\(tiempo ? " s" : "")",
                                miniatura: ficha?.thumbnailURL,
                                chevron: false
                            )
                        }
                    }

                    if !faltantes.isEmpty {
                        Text("\(faltantes.count) \(faltantes.count == 1 ? "ejercicio no está" : "ejercicios no están") en tu catálogo y no se van a copiar.")
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto3)
                    }

                    if let error {
                        Text(error).font(.system(size: 13)).foregroundStyle(tema.texto)
                    }

                    Button(copiada ? "Listo, está en tus rutinas" : (guardando ? "Copiando…" : titulo)) {
                        if copiada { dismiss() } else { Task { await copiar() } }
                    }
                    .buttonStyle(SolidButtonStyle())
                    .disabled(guardando || rutina.borradores(catalogo: store.catalog).isEmpty)
                    .padding(.top, 4)
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 32)
            }
        }
        .presentationDragIndicator(.visible)
    }

    private func copiar() async {
        guardando = true
        defer { guardando = false }
        do {
            try await store.createRoutine(
                name: rutina.nombre,
                note: rutina.nota,
                exercises: rutina.borradores(catalogo: store.catalog)
            )
            withAnimation(.smooth(duration: 0.2)) { copiada = true }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#if DEBUG
#Preview("Rutinas armadas") {
    NavigationStack {
        RutinasArmadasScreen(store: PreviewData.store())
    }
    .previewSieza()
}
#endif
