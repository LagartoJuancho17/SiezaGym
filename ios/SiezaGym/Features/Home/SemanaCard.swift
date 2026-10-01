import SwiftUI

/// La semana, igual a la de la web: siete días con flechas para moverse, el
/// día entrenado con el sólido del tema y hoy con anillo.
struct SemanaCard: View {
    @Environment(\.tema) private var tema
    let trainedDayKeys: Set<String>
    let streak: Int
    /// Cuántas semanas atrás se está mirando. 0 es la actual.
    @State private var offset = 0

    private var lunes: Date {
        let cal = TrainingCalendar.calendar
        let hoy = Date()
        let indice = TrainingCalendar.weekdayIndex(hoy)
        let base = cal.date(byAdding: .day, value: -indice, to: hoy) ?? hoy
        return cal.date(byAdding: .day, value: offset * 7, to: base) ?? base
    }

    private var dias: [(key: String, inicial: String, numero: Int, entrenado: Bool, esHoy: Bool, futuro: Bool)] {
        let cal = TrainingCalendar.calendar
        let hoyKey = TrainingCalendar.dayKey(Date())
        return (0..<7).compactMap { i in
            guard let fecha = cal.date(byAdding: .day, value: i, to: lunes) else { return nil }
            let key = TrainingCalendar.dayKey(fecha)
            return (key, HomeMetrics.dayLabels[i], cal.component(.day, from: fecha),
                    trainedDayKeys.contains(key), key == hoyKey, key > hoyKey)
        }
    }

    private var entrenadosEnSemana: Int { dias.filter(\.entrenado).count }

    var body: some View {
        GlassCard(padding: 16, radius: 26) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    flecha("chevron.left", habilitada: true) { offset -= 1 }
                    Text(rango)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .frame(maxWidth: .infinity)
                    // No se puede haber entrenado en una semana que no pasó.
                    flecha("chevron.right", habilitada: offset < 0) { offset += 1 }
                }

                HStack(spacing: 4) {
                    ForEach(dias, id: \.key) { dia in
                        VStack(spacing: 7) {
                            Text(dia.inicial)
                                .font(.system(size: 10))
                                .foregroundStyle(tema.texto3)
                            Text("\(dia.numero)")
                                .font(.system(size: 13, weight: dia.entrenado ? .medium : .regular))
                                .foregroundStyle(color(dia))
                                .frame(width: 34, height: 34)
                                .background {
                                    if dia.entrenado { Circle().fill(tema.solido) }
                                }
                                .overlay {
                                    if dia.esHoy { Circle().strokeBorder(tema.texto, lineWidth: dia.entrenado ? 2 : 1) }
                                }
                                .opacity(dia.futuro ? 0.35 : 1)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                Text(pie)
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
            }
        }
        .animation(.smooth(duration: 0.2), value: offset)
    }

    private func color(_ dia: (key: String, inicial: String, numero: Int, entrenado: Bool, esHoy: Bool, futuro: Bool)) -> Color {
        // Hoy y entrenado a la vez: manda el color del relleno. Si ganara el de
        // "hoy" quedaría blanco sobre blanco.
        if dia.entrenado { return tema.sobreSolido }
        return dia.esHoy ? tema.texto : tema.texto2
    }

    private var rango: String {
        if offset == 0 { return "Esta semana" }
        let cal = TrainingCalendar.calendar
        let fin = cal.date(byAdding: .day, value: 6, to: lunes) ?? lunes
        let meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
        let d1 = cal.component(.day, from: lunes), m1 = cal.component(.month, from: lunes)
        let d2 = cal.component(.day, from: fin), m2 = cal.component(.month, from: fin)
        return m1 == m2 ? "\(d1) – \(d2) \(meses[m1 - 1])" : "\(d1) \(meses[m1 - 1]) – \(d2) \(meses[m2 - 1])"
    }

    private var pie: String {
        guard entrenadosEnSemana > 0 else { return "Sin entrenamientos esta semana." }
        let base = "\(entrenadosEnSemana) \(entrenadosEnSemana == 1 ? "día entrenado" : "días entrenados")"
        guard offset == 0, streak > 0 else { return base }
        return "\(base) · 🔥 \(streak) \(streak == 1 ? "día seguido" : "días seguidos")"
    }

    private func flecha(_ icono: String, habilitada: Bool, accion: @escaping () -> Void) -> some View {
        Button(action: accion) {
            Image(systemName: icono)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(tema.texto)
                .frame(width: 34, height: 34)
                .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }
        }
        .disabled(!habilitada)
        .opacity(habilitada ? 1 : 0.3)
        .accessibilityLabel(icono == "chevron.left" ? "Semana anterior" : "Semana siguiente")
    }
}
