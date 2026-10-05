import Foundation

/// Cuentas de "Tus datos": leer lo que se escribe en los campos, el IMC y el
/// resumen de una línea que muestra el Perfil. Puras, para probarlas.
nonisolated enum BodyMetrics {
    /// Lee "78,5" o "78.5". Vacío o cero o texto da nil: no es un dato.
    static func decimal(_ texto: String) -> Double? {
        let limpio = texto.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: ",", with: ".")
        guard let valor = Double(limpio), valor.isFinite, valor > 0 else { return nil }
        return valor
    }

    struct IMC: Equatable, Sendable {
        let valor: Double
        let categoria: String
    }

    /// Índice de masa corporal (peso / altura² en metros), con las categorías
    /// de la OMS. Nil si falta un dato o los valores no son de una persona.
    static func imc(pesoKg: Double?, alturaCm: Double?) -> IMC? {
        guard let peso = pesoKg, let altura = alturaCm,
              (20...400).contains(peso), (100...250).contains(altura) else { return nil }
        let metros = altura / 100
        let valor = ((peso / (metros * metros)) * 10).rounded() / 10
        let categoria = switch valor {
        case ..<18.5: "Bajo peso"
        case ..<25: "Normal"
        case ..<30: "Sobrepeso"
        default: "Obesidad"
        }
        return IMC(valor: valor, categoria: categoria)
    }

    /// "78,5 kg · 180 cm · Intermedio", con lo que haya. Sin nada, invita a
    /// completarlo.
    static func resumen(pesoKg: Double?, alturaCm: Double?, nivel: String?) -> String {
        var partes: [String] = []
        if let pesoKg { partes.append("\(numero(pesoKg)) kg") }
        if let alturaCm { partes.append("\(numero(alturaCm)) cm") }
        if let nivel { partes.append(nivel) }
        return partes.isEmpty ? "Completá peso, altura y experiencia" : partes.joined(separator: " · ")
    }

    /// 78.5 → "78,5"; 180.0 → "180".
    static func numero(_ valor: Double) -> String {
        let redondo = (valor * 10).rounded() / 10
        let texto = redondo == redondo.rounded() ? String(Int(redondo)) : String(redondo)
        return texto.replacingOccurrences(of: ".", with: ",")
    }
}
