import SwiftUI
import WidgetKit

/// El fondo del widget.
///
/// No es el `Backdrop` de la app: ese usa `UIScreen`, que no existe en una
/// extensión, y dibuja manchas desenfocadas que en 150 puntos no se ven pero sí
/// se pagan. Acá es el degradado del tema y nada más.
struct FondoWidget: View {
    let tema: Theme

    var body: some View {
        LinearGradient(
            stops: tema.fondo,
            startPoint: tema.fondoInicio,
            endPoint: tema.fondoFin
        )
    }
}

/// La tira de lunes a domingo, igual que la de la portada.
struct SemanaTira: View {
    let tema: Theme
    let dias: [Bool]
    var compacta = false

    private let letras = ["L", "M", "M", "J", "V", "S", "D"]

    var body: some View {
        HStack(spacing: compacta ? 4 : 6) {
            ForEach(Array(dias.enumerated()), id: \.offset) { indice, entrenado in
                VStack(spacing: 3) {
                    if !compacta {
                        Text(letras[indice])
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(tema.texto3)
                    }
                    Circle()
                        .fill(entrenado ? tema.solido : (tema.plano ? tema.bordeFuerte : Color.white.opacity(tema.glass2)))
                        .frame(width: compacta ? 7 : 9, height: compacta ? 7 : 9)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(dias.filter(\.self).count) días entrenados esta semana")
    }
}

/// Un número grande con su rótulo, la unidad mínima de los widgets.
struct Dato: View {
    let tema: Theme
    let valor: String
    let rotulo: String
    var tamanio: CGFloat = 34

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(valor)
                .font(.system(size: tamanio, weight: .bold, design: tema.plano ? .default : .rounded))
                .monospacedDigit()
                .foregroundStyle(tema.texto)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text(rotulo)
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
                .lineLimit(1)
        }
    }
}

extension WidgetSnapshot {
    var tema: Theme { Theme.conId(themeID) }

    /// "12 kg" o "1,2 t": en un widget chico no entran seis dígitos.
    var volumenCorto: String {
        if weeklyVolumeKg >= 1000 {
            return "\((weeklyVolumeKg / 1000).formatted(.number.precision(.fractionLength(1)))) t"
        }
        return "\(Int(weeklyVolumeKg).formatted()) kg"
    }
}
