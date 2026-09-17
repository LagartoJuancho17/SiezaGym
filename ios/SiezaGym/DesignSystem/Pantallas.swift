import SwiftUI

/// El marco de una pantalla: rótulo opcional arriba, título, y una acción a la
/// derecha. Es el `PageShell` de la web.
struct Pantalla<Contenido: View, Accion: View>: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss

    let titulo: String
    var rotulo: String?
    /// Con `volver` aparece la flecha a la izquierda.
    var volver = false
    @ViewBuilder var accion: Accion
    @ViewBuilder var contenido: Contenido

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .center, spacing: 12) {
                    if volver {
                        Button { dismiss() } label: {
                            Image(systemName: "arrow.left")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundStyle(tema.texto)
                                .frame(width: 44, height: 44)
                        }
                        .accessibilityLabel("Volver")
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        if let rotulo {
                            Text(rotulo)
                                .font(.system(size: 13))
                                .foregroundStyle(tema.texto2)
                        }
                        Text(titulo)
                            .font(.system(size: volver ? 24 : 30, weight: .heavy))
                            .tracking(-0.7)
                            .foregroundStyle(tema.texto)
                            .lineLimit(2)
                            .minimumScaleFactor(0.7)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    accion
                }
                .padding(.bottom, 4)

                contenido
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background { Backdrop() }
        .scrollIndicators(.hidden)
        .navigationBarBackButtonHidden(volver)
        .toolbar(.hidden, for: .navigationBar)
    }
}

extension Pantalla where Accion == EmptyView {
    init(titulo: String, rotulo: String? = nil, volver: Bool = false, @ViewBuilder contenido: () -> Contenido) {
        self.init(titulo: titulo, rotulo: rotulo, volver: volver, accion: { EmptyView() }, contenido: contenido)
    }
}

/// Tres números en una tarjeta, separados por líneas. El `d2-stats` de la web.
struct StatsCard: View {
    @Environment(\.tema) private var tema
    let datos: [(valor: String, rotulo: String)]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(datos.enumerated()), id: \.offset) { indice, dato in
                if indice > 0 {
                    Rectangle().fill(tema.borde).frame(width: 1, height: 34)
                }
                VStack(spacing: 4) {
                    Text(dato.valor)
                        .font(.system(size: 22, weight: .semibold))
                        .tracking(-0.7)
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text(dato.rotulo)
                        .font(.system(size: 10))
                        .foregroundStyle(tema.texto2)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 10)
        .background(tema.vidrio(1), in: .rect(cornerRadius: 26))
        .overlay { RoundedRectangle(cornerRadius: 26).strokeBorder(tema.borde, lineWidth: 1) }
    }
}

/// Panel de vidrio con filas separadas por una línea fina, como
/// `.d2-routine-list`: la lista se lee como un objeto y no como una pila.
struct PanelLista<Contenido: View>: View {
    @Environment(\.tema) private var tema
    @ViewBuilder var contenido: Contenido

    var body: some View {
        VStack(spacing: 0) { contenido }
            .background(tema.vidrio(1), in: .rect(cornerRadius: 24))
            .overlay { RoundedRectangle(cornerRadius: 24).strokeBorder(tema.borde, lineWidth: 1) }
    }
}

/// Una fila de lista: nombre, detalle abajo, y un valor opcional a la derecha.
struct FilaLista: View {
    @Environment(\.tema) private var tema
    let nombre: String
    let detalle: String
    var etiqueta: String?
    var valor: String?
    var unidad: String?
    var miniatura: URL?
    var chevron = true

    var body: some View {
        HStack(spacing: 12) {
            if let miniatura {
                Miniatura(url: miniatura, lado: 40)
            }

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(nombre)
                        .font(.system(size: 15, weight: .medium))
                        .tracking(-0.2)
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    if let etiqueta {
                        Text(etiqueta)
                            .font(.system(size: 10))
                            .foregroundStyle(tema.texto2)
                    }
                }
                Text(detalle)
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if let valor {
                VStack(alignment: .trailing, spacing: 3) {
                    Text(valor)
                        .font(.system(size: 13))
                        .foregroundStyle(tema.texto)
                    if let unidad {
                        Text(unidad)
                            .font(.system(size: 9))
                            .foregroundStyle(tema.texto3)
                    }
                }
            }

            if chevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto3)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 13)
        .contentShape(.rect)
    }
}

/// La animación del ejercicio. Fondo claro siempre: son trazos negros sobre
/// blanco y sobre el vidrio de un tema oscuro no se ven.
struct Miniatura: View {
    @Environment(\.tema) private var tema
    let url: URL?
    var lado: CGFloat = 54

    var body: some View {
        ZStack {
            Color(white: 0.95)
            if let url {
                AsyncImage(url: url) { imagen in
                    imagen.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "dumbbell.fill")
                        .font(.system(size: lado * 0.34))
                        .foregroundStyle(Color(white: 0.6))
                }
            } else {
                Image(systemName: "dumbbell.fill")
                    .font(.system(size: lado * 0.34))
                    .foregroundStyle(Color(white: 0.6))
            }
        }
        .frame(width: lado, height: lado)
        .clipShape(.rect(cornerRadius: lado * 0.3))
    }
}

/// Estado vacío: qué falta y cómo salir de ahí.
struct Vacio: View {
    @Environment(\.tema) private var tema
    let texto: String
    var accion: (titulo: String, hacer: () -> Void)?

    var body: some View {
        VStack(spacing: 16) {
            Text(texto)
                .font(.system(size: 14))
                .foregroundStyle(tema.texto2)
                .multilineTextAlignment(.center)
            if let accion {
                Button(accion.titulo, action: accion.hacer)
                    .buttonStyle(SolidButtonStyle(expands: false))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .background(tema.vidrio(1), in: .rect(cornerRadius: 24))
        .overlay { RoundedRectangle(cornerRadius: 24).strokeBorder(tema.borde, lineWidth: 1) }
    }
}

/// La atribución de los gifs. Es condición de la licencia: donde se ven las
/// animaciones tiene que estar el crédito.
struct CreditoGifs: View {
    @Environment(\.tema) private var tema

    var body: some View {
        Link(destination: URL(string: "https://gymvisual.com/")!) {
            Text("Animaciones de ejercicios © Gym visual")
                .font(.system(size: 10))
                .underline()
                .foregroundStyle(tema.texto3)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 14)
    }
}
