import SwiftUI

/// Elegir ejercicios para la rutina.
///
/// Permite marcar varios y confirmarlos de una: volver al armador por cada
/// ejercicio obliga a repetir búsqueda y filtro cada vez.
struct ExercisePickerSheet: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore
    let yaAgregados: Set<String>
    let alConfirmar: ([Exercise]) -> Void

    @State private var texto = ""
    @State private var region: MuscleRegion?
    @State private var elegidos: Set<String> = []

    private var catalogo: [Exercise] {
        store.catalog.values.sorted { $0.nameEs.localizedCompare($1.nameEs) == .orderedAscending }
    }
    private var resultados: [Exercise] {
        ExerciseSearch.filtrar(catalogo, texto: texto, region: region)
    }
    private var cargando: Bool { store.isLoading && catalogo.isEmpty }

    var body: some View {
        ZStack {
            Backdrop()

            VStack(spacing: 0) {
                encabezado
                buscador
                regiones

                ScrollView {
                    if resultados.isEmpty {
                        // Sin catálogo todavía no hay nada que no coincida:
                        // decir "ninguno coincide" mientras carga es mentira.
                        Vacio(texto: cargando
                              ? "Cargando ejercicios…"
                              : (catalogo.isEmpty
                                 ? "No pudimos traer el catálogo de ejercicios."
                                 : "Ningún ejercicio coincide."))
                            .padding(.horizontal, 18)
                            .padding(.bottom, 24)
                    } else {
                        PanelLista {
                            ForEach(Array(resultados.enumerated()), id: \.element.id) { indice, ejercicio in
                                if indice > 0 {
                                    Rectangle().fill(tema.borde).frame(height: 1)
                                }
                                fila(ejercicio)
                            }
                        }
                        .padding(.horizontal, 18)
                        .padding(.bottom, 24)
                    }

                    // Los gifs son © Gym visual: la atribución va donde se ven.
                    CreditoGifs().padding(.bottom, 12)
                }
                .scrollIndicators(.hidden)
                .padding(.top, 14)

                pie
            }
        }
        .task {
            if store.catalog.isEmpty && !store.isLoading { await store.load() }
        }
    }

    private var encabezado: some View {
        HStack(spacing: 12) {
            Text("Ejercicios")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(tema.texto)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("Cerrar")
        }
        .padding(.leading, 18)
        .padding(.trailing, 6)
        .padding(.top, 12)
    }

    private var buscador: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 17))
                .foregroundStyle(tema.texto)
            TextField("", text: $texto, prompt: Text("Buscar un ejercicio").foregroundStyle(tema.texto2))
                .foregroundStyle(tema.texto)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityLabel("Buscar un ejercicio")
        }
        .padding(.horizontal, 20)
        .frame(height: 54)
        .background(tema.vidrio(1), in: .capsule)
        .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
        .padding(.horizontal, 18)
        .padding(.top, 8)
    }

    private var regiones: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                chip("Todos", activo: region == nil) { region = nil }
                ForEach(MuscleRegion.allCases) { opcion in
                    chip(opcion.label, activo: region == opcion) {
                        region = region == opcion ? nil : opcion
                    }
                }
            }
            .padding(.horizontal, 18)
        }
        .scrollIndicators(.hidden)
        .padding(.top, 14)
    }

    private func chip(_ texto: String, activo: Bool, accion: @escaping () -> Void) -> some View {
        Button(action: accion) {
            Text(texto)
                .font(.system(size: 13))
                .foregroundStyle(activo ? tema.sobreSolido : tema.texto)
                .padding(.horizontal, 14)
                .frame(minHeight: 36)
                .background(activo ? tema.solido : tema.vidrio(1), in: .capsule)
                .overlay { Capsule().strokeBorder(activo ? .clear : tema.borde, lineWidth: 1) }
        }
        .buttonStyle(.plain)
    }

    private func fila(_ ejercicio: Exercise) -> some View {
        let agregado = yaAgregados.contains(ejercicio.id)
        let marcado = elegidos.contains(ejercicio.id)

        return Button {
            if marcado { elegidos.remove(ejercicio.id) } else { elegidos.insert(ejercicio.id) }
        } label: {
            HStack(spacing: 12) {
                Miniatura(url: ejercicio.mediaURL, lado: 54)

                VStack(alignment: .leading, spacing: 4) {
                    Text(ejercicio.nameEs)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(subtitulo(ejercicio, agregado: agregado))
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                ZStack {
                    Circle().strokeBorder(tema.bordeFuerte, lineWidth: 1)
                    if marcado {
                        Circle().fill(tema.solido)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(tema.sobreSolido)
                    }
                }
                .frame(width: 24, height: 24)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        // No se puede agregar dos veces el mismo ejercicio.
        .disabled(agregado)
        .opacity(agregado ? 0.45 : 1)
    }

    private func subtitulo(_ ejercicio: Exercise, agregado: Bool) -> String {
        [
            ejercicio.source == .custom ? "Tuyo" : nil,
            ejercicio.primaryMuscle?.label,
            agregado ? "ya está en la rutina" : nil,
        ]
        .compactMap { $0 }
        .joined(separator: " · ")
    }

    private var pie: some View {
        Button {
            // Sobre el catalogo entero y no sobre `resultados`: si se marca uno,
            // se cambia la busqueda y se marca otro, los dos tienen que entrar.
            alConfirmar(catalogo.filter { elegidos.contains($0.id) })
        } label: {
            Text(elegidos.isEmpty
                 ? "Elegí al menos uno"
                 : "Agregar \(elegidos.count) \(elegidos.count == 1 ? "ejercicio" : "ejercicios")")
        }
        .buttonStyle(SolidButtonStyle())
        .disabled(elegidos.isEmpty)
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }
}
