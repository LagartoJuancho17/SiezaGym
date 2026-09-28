import Foundation

/// El dia del usuario es el dia en Argentina, no el del dispositivo ni el UTC.
/// Un entrenamiento a las 22:00 en Buenos Aires es del mismo dia aunque el
/// telefono este en otra zona horaria.
nonisolated enum TrainingCalendar {
    static let timeZone = TimeZone(identifier: "America/Argentina/Buenos_Aires") ?? .gmt

    static var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        // Semana de lunes a domingo, como la tira de la Home.
        calendar.firstWeekday = 2
        return calendar
    }

    /// "YYYY-MM-DD" en hora Argentina.
    static func dayKey(_ date: Date) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    /// Indice 0 = lunes ... 6 = domingo.
    static func weekdayIndex(_ date: Date) -> Int {
        // `weekday` es 1 = domingo, asi que se rota para que lunes quede en 0.
        let weekday = calendar.component(.weekday, from: date)
        return (weekday + 5) % 7
    }

    /// Racha de dias consecutivos con al menos una sesion terminada.
    /// No se corta hasta la medianoche siguiente: si hoy todavia no entrenaste
    /// pero ayer si, la racha sigue viva.
    static func streak(trainedDayKeys: Set<String>, now: Date = Date()) -> Int {
        var cursor = now
        if !trainedDayKeys.contains(dayKey(now)) {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: now) else { return 0 }
            cursor = yesterday
        }

        var streak = 0
        while trainedDayKeys.contains(dayKey(cursor)) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return streak
    }

    /// Semana del mes por bloques de 7 dias: 1-7 -> 1, 8-14 -> 2, etc.
    static func weekOfMonth(day: Int) -> Int {
        max(1, Int(ceil(Double(day) / 7)))
    }

    static func monthLabel(year: Int, month: Int) -> String {
        let names = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ]
        guard (1...12).contains(month) else { return "\(year)" }
        return "\(names[month - 1]) \(year)"
    }

    private static func soloMes(_ month: Int) -> String {
        let names = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ]
        return (1...12).contains(month) ? names[month - 1] : ""
    }

    /// La semana a la que pertenece una fecha, para asignarle rutinas: "en qué
    /// semana de qué mes de qué año". Año y mes en el resultado son los de
    /// Argentina, iguales a los de `dayKey`, no los del huso del teléfono.
    struct Semana: Equatable, Sendable {
        let anio: Int
        let mes: Int
        let numero: Int

        /// Para guardar y comparar: "2026-09-4". No es para mostrar.
        var clave: String { String(format: "%04d-%02d-%d", anio, mes, numero) }

        /// Para mostrar: "Septiembre · Semana 4".
        var texto: String { "\(soloMes(mes)) · Semana \(numero)" }
    }

    static func semana(de fecha: Date) -> Semana {
        let partes = calendar.dateComponents([.year, .month, .day], from: fecha)
        let dia = partes.day ?? 1
        return Semana(anio: partes.year ?? 0, mes: partes.month ?? 1, numero: weekOfMonth(day: dia))
    }

    /// Las rutinas propias asignadas a esa semana. Función aparte y no un
    /// filtro escrito en el `GymStore` para que se pueda probar sin Firebase,
    /// igual que el resto de `Domain/`.
    static func delaSemana<Item>(_ items: [Item], clave objetivo: String, claveDe: (Item) -> String?) -> [Item] {
        items.filter { claveDe($0) == objetivo }
    }
}
