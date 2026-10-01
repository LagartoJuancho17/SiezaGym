import SwiftUI

/// Elegir el tema en su propia pantalla, con una vista previa grande de cada
/// uno armada con sus propios colores (fondo, tarjeta, texto y botón), en vez
/// de un círculo chico. El Perfil solo muestra cuál está puesto.
struct TemasScreen: View {
    @Environment(\.tema) private var tema
    @Environment(ThemeStore.self) private var temas

    var body: some View {
        Pantalla(titulo: "Tema", volver: true) {
            Text("La apariencia de la app. Se guarda en este teléfono.")
                .font(.system(size: 12))
                .foregroundStyle(tema.texto2)
                .padding(.top, 8)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 16) {
                ForEach(Theme.todos) { opcion in
                    let elegido = opcion.id == tema.id
                    Button { temas.actual = opcion } label: {
                        VStack(alignment: .leading, spacing: 10) {
                            VistaPreviaTema(opcion: opcion)
                                .overlay {
                                    RoundedRectangle(cornerRadius: 20)
                                        .strokeBorder(elegido ? tema.solido : tema.borde, lineWidth: elegido ? 2 : 1)
                                }
                            HStack(spacing: 6) {
                                Text(opcion.nombre)
                                    .font(.system(size: 14, weight: elegido ? .semibold : .regular))
                                    .foregroundStyle(elegido ? tema.texto : tema.texto2)
                                Spacer(minLength: 0)
                                if elegido {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 15))
                                        .foregroundStyle(tema.solido)
                                }
                            }
                        }
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Tema \(opcion.nombre)")
                    .accessibilityAddTraits(elegido ? [.isSelected] : [])
                }
            }
            .padding(.top, 16)
            .animation(.smooth(duration: 0.25), value: tema.id)
        }
        .bottomNavInset()
    }
}

/// Una pantalla en miniatura con los colores del tema.
struct VistaPreviaTema: View {
    let opcion: Theme

    var body: some View {
        // El tamaño lo pone el rectángulo vacío; el fondo (y la obra, que es
        // una foto más alta) va detrás y solo lo llena. Si la obra fuera parte
        // del layout, su tarjeta saldría más alta que las otras.
        Color.clear
            .aspectRatio(0.78, contentMode: .fit)
            .background {
                ZStack {
                    LinearGradient(stops: opcion.fondo, startPoint: opcion.fondoInicio, endPoint: opcion.fondoFin)
                    if let obra = opcion.obra {
                        Image(obra).resizable().scaledToFill()
                    }
                }
            }
            .overlay(alignment: .topLeading) {
                VStack(alignment: .leading, spacing: 8) {
                    RoundedRectangle(cornerRadius: 3).fill(opcion.texto).frame(width: 46, height: 7)
                    VStack(alignment: .leading, spacing: 6) {
                        RoundedRectangle(cornerRadius: 2).fill(opcion.texto.opacity(0.9)).frame(width: 52, height: 5)
                        RoundedRectangle(cornerRadius: 2).fill(opcion.texto2).frame(width: 70, height: 4)
                        RoundedRectangle(cornerRadius: 2).fill(opcion.texto2).frame(width: 40, height: 4)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(opcion.vidrio(2), in: .rect(cornerRadius: 10))
                    .overlay { RoundedRectangle(cornerRadius: 10).strokeBorder(opcion.borde, lineWidth: 1) }

                    Spacer(minLength: 0)

                    Capsule().fill(opcion.solido).frame(height: 18)
                        .overlay { Capsule().fill(opcion.sobreSolido).frame(width: 34, height: 4) }
                }
                .padding(12)
            }
            .clipShape(.rect(cornerRadius: 20))
            .accessibilityHidden(true)
    }
}

#if DEBUG
#Preview("Tema") {
    NavigationStack {
        TemasScreen()
    }
    .previewSieza()
}
#endif
