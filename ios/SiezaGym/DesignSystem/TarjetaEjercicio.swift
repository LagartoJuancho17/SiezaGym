import SwiftUI

/// Un ejercicio como tarjeta suelta: miniatura a la izquierda, nombre y
/// prescripción, y los controles a la derecha. Cada ejercicio es su propia
/// tarjeta, con aire entre una y otra, en vez de filas apiladas en un panel.
///
/// La usan el detalle de la rutina y el entrenamiento, así las dos pantallas
/// muestran el mismo ejercicio de la misma forma. Lo que va debajo del
/// encabezado (las series) lo pone cada pantalla en `contenido`.
struct TarjetaEjercicio<Accesorio: View, Contenido: View>: View {
    @Environment(\.tema) private var tema
    let miniatura: URL?
    let nombre: String
    let detalle: String
    var completo = false
    var alTocar: () -> Void
    /// Tocar la miniatura abre el GIF o el video; sin esto, la miniatura es
    /// parte del botón de la tarjeta.
    var alTocarMiniatura: (() -> Void)?
    @ViewBuilder var accesorio: Accesorio
    @ViewBuilder var contenido: Contenido

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 14) {
                if let alTocarMiniatura {
                    Button(action: alTocarMiniatura) {
                        MiniaturaEjercicio(url: miniatura, completo: completo)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Ver la técnica de \(nombre)")
                } else {
                    MiniaturaEjercicio(url: miniatura, completo: completo)
                }

                Button(action: alTocar) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(nombre)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(tema.texto)
                                .lineLimit(2)
                            Text(detalle)
                                .font(.system(size: 13))
                                .foregroundStyle(tema.texto2)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)

                        accesorio
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
            }
            .padding(12)

            contenido
        }
        .background(tema.vidrio(1), in: .rect(cornerRadius: 22))
        .overlay {
            RoundedRectangle(cornerRadius: 22)
                .strokeBorder(completo ? tema.solido.opacity(0.55) : tema.borde, lineWidth: 1)
        }
        .animation(.snappy(duration: 0.25), value: completo)
    }
}

/// Los dos íconos de la derecha de la referencia: ajustes y flecha. La flecha
/// gira hacia abajo cuando la tarjeta está desplegada.
struct AccesorioTarjeta: View {
    @Environment(\.tema) private var tema
    let abierto: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: "slider.horizontal.3")
            Image(systemName: "chevron.right")
                .rotationEffect(.degrees(abierto ? 90 : 0))
        }
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(tema.texto2)
        .accessibilityHidden(true)
    }
}

/// La miniatura de un ejercicio, con el GIF entero a la vista.
///
/// Terminado, se tiñe del color del tema y lleva un tilde encima, como en la
/// referencia: se ve de reojo al bajar por la lista.
struct MiniaturaEjercicio: View {
    @Environment(\.tema) private var tema
    let url: URL?
    var lado: CGFloat = 58
    var completo = false

    var body: some View {
        Miniatura(url: url, lado: lado, radio: 16)
            .overlay {
                if completo {
                    ZStack {
                        RoundedRectangle(cornerRadius: 16).fill(tema.solido.opacity(0.82))
                        Image(systemName: "checkmark")
                            .font(.system(size: lado * 0.36, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    .transition(.opacity.combined(with: .scale(scale: 0.9)))
                }
            }
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(completo ? tema.solido : .clear, lineWidth: 1.5)
            }
            .animation(.spring(duration: 0.3, bounce: 0.3), value: completo)
    }
}

/// El botón de empezar: fondo oscuro, borde del color del tema y un brillo
/// suave alrededor, en vez del bloque lleno de color.
struct BotonBrilloStyle: ButtonStyle {
    @Environment(\.tema) private var tema
    @Environment(\.isEnabled) private var habilitado

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity, minHeight: 60)
            .background(Color(r: 13, g: 13, b: 15, a: 1), in: .capsule)
            .overlay { Capsule().strokeBorder(tema.solido, lineWidth: 1.5) }
            // Dos sombras: una cerca y marcada para el filo, una ancha y
            // tenue para el resplandor.
            .shadow(color: tema.solido.opacity(habilitado ? 0.55 : 0), radius: 4)
            .shadow(color: tema.solido.opacity(habilitado ? 0.35 : 0), radius: 16)
            .opacity(habilitado ? (configuration.isPressed ? 0.85 : 1) : 0.45)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}
