// GENERADO por ios/scripts/sync-theme.mjs — no editar a mano.
//
// Los colores salen de app/design2.css, que es la fuente de verdad de los dos
// clientes. Si cambia un tema en la web, correr:
//
//     node ios/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
//
// Temas encontrados: noche, plata, brasa, pliegues, electrico, sieza

import SwiftUI

extension Color {
    init(r: Double, g: Double, b: Double, a: Double) {
        self.init(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a)
    }
}

extension Theme {
    /// Los temas del diseño; SIEZA se ofrece solo en el cliente iOS.
    static let todos: [Theme] = [
        Theme(
            id: "noche",
            nombre: "Noche",
            plano: false,
            glass1: 0.07,
            glass2: 0.11,
            glass3: 0.16,
            superficie1: nil,
            superficie2: nil,
            superficie3: nil,
            borde: Color(r: 255, g: 255, b: 255, a: 0.11),
            bordeFuerte: Color(r: 255, g: 255, b: 255, a: 0.2),
            texto: Color(r: 255, g: 255, b: 255, a: 1),
            texto2: Color(r: 255, g: 255, b: 255, a: 0.66),
            texto3: Color(r: 255, g: 255, b: 255, a: 0.42),
            solido: Color(r: 244, g: 245, b: 247, a: 1),
            sobreSolido: Color(r: 11, g: 12, b: 14, a: 1),
            luzA: Color(r: 35, g: 38, b: 44, a: 1),
            luzB: Color(r: 22, g: 24, b: 28, a: 1),
            luzC: Color(r: 0, g: 0, b: 0, a: 1),
            mancha1: Color(r: 96, g: 108, b: 128, a: 0.5),
            mancha2: Color(r: 210, g: 220, b: 236, a: 0.12),
            mancha3: Color(r: 20, g: 22, b: 27, a: 0.9),
            fondoInicio: UnitPoint(x: 0.3960, y: 0.0109),
            fondoFin: UnitPoint(x: 0.6040, y: 0.9891),
            fondo: [
                Gradient.Stop(color: Color(r: 26, g: 29, b: 34, a: 1), location: 0.000),
                Gradient.Stop(color: Color(r: 11, g: 12, b: 14, a: 1), location: 0.520),
                Gradient.Stop(color: Color(r: 0, g: 0, b: 0, a: 1), location: 1.000)
            ],
            obra: nil
        ),
        Theme(
            id: "plata",
            nombre: "Plata",
            plano: false,
            glass1: 0.19,
            glass2: 0.16,
            glass3: 0.24,
            superficie1: nil,
            superficie2: nil,
            superficie3: nil,
            borde: Color(r: 255, g: 255, b: 255, a: 0.22),
            bordeFuerte: Color(r: 255, g: 255, b: 255, a: 0.3),
            texto: Color(r: 250, g: 252, b: 252, a: 1),
            texto2: Color(r: 247, g: 250, b: 253, a: 0.65),
            texto3: Color(r: 247, g: 250, b: 253, a: 0.57),
            solido: Color(r: 35, g: 34, b: 30, a: 1),
            sobreSolido: Color(r: 247, g: 253, b: 253, a: 1),
            luzA: Color(r: 170, g: 176, b: 183, a: 0.22),
            luzB: Color(r: 178, g: 183, b: 189, a: 0.14),
            luzC: Color(r: 59, g: 62, b: 70, a: 0.68),
            mancha1: Color(r: 187, g: 193, b: 199, a: 0.2),
            mancha2: Color(r: 182, g: 186, b: 193, a: 0.22),
            mancha3: Color(r: 42, g: 45, b: 53, a: 0.7),
            fondoInicio: UnitPoint(x: 0.5000, y: 0.0000),
            fondoFin: UnitPoint(x: 0.5000, y: 1.0000),
            fondo: [
                Gradient.Stop(color: Color(r: 127, g: 132, b: 139, a: 1), location: 0.000),
                Gradient.Stop(color: Color(r: 133, g: 138, b: 145, a: 1), location: 0.220),
                Gradient.Stop(color: Color(r: 104, g: 108, b: 116, a: 1), location: 0.600),
                Gradient.Stop(color: Color(r: 99, g: 102, b: 110, a: 1), location: 1.000)
            ],
            obra: nil
        ),
        Theme(
            id: "brasa",
            nombre: "Brasa",
            plano: false,
            glass1: 0.09,
            glass2: 0.14,
            glass3: 0.2,
            superficie1: nil,
            superficie2: nil,
            superficie3: nil,
            borde: Color(r: 255, g: 255, b: 255, a: 0.13),
            bordeFuerte: Color(r: 255, g: 176, b: 150, a: 0.28),
            texto: Color(r: 255, g: 255, b: 255, a: 1),
            texto2: Color(r: 255, g: 236, b: 232, a: 0.7),
            texto3: Color(r: 255, g: 236, b: 232, a: 0.45),
            solido: Color(r: 255, g: 87, b: 51, a: 1),
            sobreSolido: Color(r: 255, g: 255, b: 255, a: 1),
            luzA: Color(r: 82, g: 15, b: 19, a: 1),
            luzB: Color(r: 44, g: 7, b: 9, a: 1),
            luzC: Color(r: 18, g: 2, b: 3, a: 1),
            mancha1: Color(r: 255, g: 87, b: 51, a: 0.24),
            mancha2: Color(r: 255, g: 190, b: 170, a: 0.1),
            mancha3: Color(r: 60, g: 10, b: 13, a: 0.85),
            fondoInicio: UnitPoint(x: 0.3960, y: 0.0109),
            fondoFin: UnitPoint(x: 0.6040, y: 0.9891),
            fondo: [
                Gradient.Stop(color: Color(r: 59, g: 10, b: 12, a: 1), location: 0.000),
                Gradient.Stop(color: Color(r: 30, g: 4, b: 5, a: 1), location: 0.550),
                Gradient.Stop(color: Color(r: 11, g: 1, b: 2, a: 1), location: 1.000)
            ],
            obra: nil
        ),
        Theme(
            id: "pliegues",
            nombre: "Pliegues",
            plano: false,
            glass1: 0.07,
            glass2: 0.12,
            glass3: 0.18,
            superficie1: nil,
            superficie2: nil,
            superficie3: nil,
            borde: Color(r: 255, g: 219, b: 199, a: 0.12),
            bordeFuerte: Color(r: 255, g: 186, b: 140, a: 0.3),
            texto: Color(r: 253, g: 244, b: 238, a: 1),
            texto2: Color(r: 253, g: 236, b: 226, a: 0.7),
            texto3: Color(r: 253, g: 236, b: 226, a: 0.46),
            solido: Color(r: 223, g: 123, b: 71, a: 1),
            sobreSolido: Color(r: 28, g: 10, b: 5, a: 1),
            luzA: Color(r: 217, g: 221, b: 227, a: 1),
            luzB: Color(r: 196, g: 201, b: 209, a: 1),
            luzC: Color(r: 155, g: 162, b: 173, a: 1),
            mancha1: Color(r: 122, g: 131, b: 145, a: 0.55),
            mancha2: Color(r: 232, g: 236, b: 241, a: 0.6),
            mancha3: Color(r: 104, g: 112, b: 126, a: 0.5),
            fondoInicio: UnitPoint(x: 0.5000, y: 0.0000),
            fondoFin: UnitPoint(x: 0.5000, y: 1.0000),
            fondo: [
                Gradient.Stop(color: Color(r: 0, g: 0, b: 0, a: 1), location: 0)
            ],
            obra: "fondo-pliegues"
        ),
        Theme(
            id: "electrico",
            nombre: "Eléctrico",
            plano: false,
            glass1: 0.1,
            glass2: 0.15,
            glass3: 0.22,
            superficie1: nil,
            superficie2: nil,
            superficie3: nil,
            borde: Color(r: 214, g: 224, b: 255, a: 0.16),
            bordeFuerte: Color(r: 198, g: 212, b: 255, a: 0.34),
            texto: Color(r: 242, g: 245, b: 255, a: 1),
            texto2: Color(r: 234, g: 239, b: 255, a: 0.74),
            texto3: Color(r: 234, g: 239, b: 255, a: 0.5),
            solido: Color(r: 229, g: 69, b: 135, a: 1),
            sobreSolido: Color(r: 26, g: 2, b: 16, a: 1),
            luzA: Color(r: 217, g: 221, b: 227, a: 1),
            luzB: Color(r: 196, g: 201, b: 209, a: 1),
            luzC: Color(r: 155, g: 162, b: 173, a: 1),
            mancha1: Color(r: 122, g: 131, b: 145, a: 0.55),
            mancha2: Color(r: 232, g: 236, b: 241, a: 0.6),
            mancha3: Color(r: 104, g: 112, b: 126, a: 0.5),
            fondoInicio: UnitPoint(x: 0.5000, y: 0.0000),
            fondoFin: UnitPoint(x: 0.5000, y: 1.0000),
            fondo: [
                Gradient.Stop(color: Color(r: 0, g: 0, b: 0, a: 1), location: 0)
            ],
            obra: "fondo-electrico"
        ),
        Theme(
            id: "sieza",
            nombre: "SIEZA",
            plano: true,
            glass1: 1,
            glass2: 1,
            glass3: 1,
            superficie1: Color(r: 26, g: 29, b: 34, a: 1),
            superficie2: Color(r: 26, g: 29, b: 34, a: 1),
            superficie3: Color(r: 26, g: 29, b: 34, a: 1),
            borde: Color(r: 133, g: 138, b: 145, a: 0.28),
            bordeFuerte: Color(r: 99, g: 102, b: 110, a: 1),
            texto: Color(r: 244, g: 245, b: 247, a: 1),
            texto2: Color(r: 244, g: 245, b: 247, a: 0.76),
            texto3: Color(r: 133, g: 138, b: 145, a: 1),
            solido: Color(r: 255, g: 87, b: 51, a: 1),
            sobreSolido: Color(r: 11, g: 12, b: 14, a: 1),
            luzA: Color(r: 11, g: 12, b: 14, a: 1),
            luzB: Color(r: 11, g: 12, b: 14, a: 1),
            luzC: Color(r: 11, g: 12, b: 14, a: 1),
            mancha1: Color(r: 0, g: 0, b: 0, a: 0),
            mancha2: Color(r: 0, g: 0, b: 0, a: 0),
            mancha3: Color(r: 0, g: 0, b: 0, a: 0),
            fondoInicio: UnitPoint(x: 0.5000, y: 0.0000),
            fondoFin: UnitPoint(x: 0.5000, y: 1.0000),
            fondo: [
                Gradient.Stop(color: Color(r: 11, g: 12, b: 14, a: 1), location: 0)
            ],
            obra: nil
        )
    ]
}
