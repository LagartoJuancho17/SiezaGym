import SwiftUI

/// Un tema del diseño: los mismos tokens que `.d2[data-d2-theme="..."]` en la
/// web. Los valores los genera `ios/scripts/sync-theme.mjs` desde el CSS, así
/// que no hay colores escritos a mano de este lado.
struct Theme: Identifiable, Equatable, Sendable {
    let id: String
    let nombre: String
    let plano: Bool

    /// Opacidad de la tinta del vidrio en los temas anteriores. SIEZA usa
    /// superficies opacas en los mismos tres niveles.
    let glass1: Double
    let glass2: Double
    let glass3: Double
    let superficie1: Color?
    let superficie2: Color?
    let superficie3: Color?

    let borde: Color
    let bordeFuerte: Color

    let texto: Color
    let texto2: Color
    let texto3: Color

    /// El sólido del tema: el botón principal, el día entrenado, la serie
    /// confirmada. Y el color del texto que va encima.
    let solido: Color
    let sobreSolido: Color

    /// El segundo color de la marca (`--d2-ink-2`), solo para degradados. En
    /// los temas que no lo traen es igual a `solido`, así `degradado` queda
    /// liso y nadie tiene que preguntar qué tema es.
    let solido2: Color

    /// Las tres luces que se apoyan sobre el degradado de base.
    let luzA: Color
    let luzB: Color
    let luzC: Color

    let mancha1: Color
    let mancha2: Color
    let mancha3: Color

    let fondoInicio: UnitPoint
    let fondoFin: UnitPoint
    let fondo: [Gradient.Stop]

    /// Nombre de la imagen del catálogo para los temas que traen una obra de
    /// fondo en vez de un degradado. `nil` en los demás.
    let obra: String?

    /// El verde de "terminado". Es el único color fijo del diseño: no sale del
    /// tema y no cambia con él, porque significa una sola cosa y tiene que
    /// significarla igual en todos. El sólido de cada tema ya se usa para
    /// "lo importante de esta pantalla"; si el terminado también fuera el
    /// sólido, en Plata (que es casi negro) no se distinguiría de lo pendiente.
    static let hecho = Color(r: 52, g: 199, b: 89, a: 1)

    static let porDefecto = Theme.todos.first { $0.id == "sieza" } ?? Theme.todos[0]

    static func conId(_ id: String?) -> Theme {
        Theme.todos.first { $0.id == id } ?? .porDefecto
    }

    /// `--d2-ink-grad` de la web: del sólido al segundo color, en diagonal
    /// (135deg en CSS es de arriba a la izquierda hacia abajo a la derecha).
    /// Va en lo que se toca para avanzar: botón principal, pestaña activa,
    /// barras de progreso.
    var degradado: LinearGradient {
        LinearGradient(colors: [solido, solido2], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    /// Lo mismo de abajo hacia arriba, para barras verticales: crecen hacia
    /// el color más claro.
    var degradadoVertical: LinearGradient {
        LinearGradient(colors: [solido, solido2], startPoint: .bottom, endPoint: .top)
    }

    /// Un color plano del tema, para los pocos lugares que no pueden llevar el
    /// degradado entero (una barra de sistema, un relleno de respaldo).
    var fondoPlano: Color { fondo.last?.color ?? .black }

    /// Los temas anteriores conservan el vidrio. En SIEZA cada superficie es
    /// opaca: el fondo no se filtra ni cambia el contraste de los controles.
    func vidrio(_ nivel: Int = 1) -> Color {
        if plano {
            return (nivel >= 3 ? superficie3 : (nivel == 2 ? superficie2 : superficie1)) ?? fondoPlano
        }
        let opacidad = nivel >= 3 ? glass3 : (nivel == 2 ? glass2 : glass1)
        return Color.white.opacity(opacidad)
    }
}
