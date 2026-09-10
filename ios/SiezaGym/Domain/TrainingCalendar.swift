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
}
