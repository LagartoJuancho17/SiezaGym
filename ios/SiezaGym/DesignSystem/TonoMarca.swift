import SwiftUI

/// Pasa una foto en blanco y negro a los colores de la marca: las sombras
/// quedan negras, los medios tonos en Brasa y las luces en naranja. Lo hace
/// un shader de Metal (`TonoMarca.metal`) al dibujar, así las fotos del repo
/// siguen siendo las originales y el tono se ajusta acá, sin reeditarlas.
nonisolated enum TonoMarca {
    /// Paradas del mapa, en RGB 0...1, repartidas parejo de sombra a luz.
    static let paradas: [(r: Double, g: Double, b: Double)] = [
        (0.020, 0.016, 0.016),        // sombra: casi negro
        (0.300, 0.050, 0.000),        // brasa apagada
        (1.000, 50.0 / 255, 1.0 / 255),   // Brasa #FF3201
        (1.000, 118.0 / 255, 1.0 / 255),  // naranja #FF7601
        (1.000, 0.860, 0.720),        // luz: durazno claro
    ]

    /// El mismo cálculo que el shader, para poder probarlo.
    static func tono(luz: Double) -> (r: Double, g: Double, b: Double) {
        let t = min(max(luz, 0), 1) * Double(paradas.count - 1)
        let i = min(Int(t.rounded(.down)), paradas.count - 2)
        let f = t - Double(i)
        let a = paradas[i], b = paradas[i + 1]
        return (a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f)
    }
}

extension View {
    /// Tiñe la vista (pensado para fotos en blanco y negro) con `TonoMarca`.
    func tonoMarca() -> some View {
        colorEffect(
            ShaderLibrary.tonoMarca(
                .colorArray(TonoMarca.paradas.map { Color(.sRGB, red: $0.r, green: $0.g, blue: $0.b) })
            )
        )
    }
}
