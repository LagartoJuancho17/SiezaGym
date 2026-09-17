import Foundation

/// Lo que dibuja la pantalla de progreso. Son las mismas cuentas que
/// `lib/progress/` en la web, para que los dos clientes muestren lo mismo.
nonisolated enum ProgressMetrics {
    // MARK: - Volumen por semana

    struct WeekBar: Sendable, Hashable, Identifiable {
        let weekStartKey: String
        let kg: Double
        /// 0...1 contra la semana más alta.
        let height: Double
        var id: String { weekStartKey }
        var isEmpty: Bool { kg == 0 }
    }

    /// Las últimas `weeks` semanas hasta la actual.
    ///
    /// Las alturas van relativas entre sí y no contra un objetivo: nadie fijó
    /// uno, y dibujar una meta inventada haría que una buena semana parezca
    /// poca. La semana en cero conserva una línea mínima, porque una barra de
    /// altura cero se lee como "no hay dato" y no como "no entrenaste".
    static func volumeByWeek(_ sessions: [WorkoutSession], weeks: Int = 12, now: Date = Date()) -> [WeekBar] {
        let cal = TrainingCalendar.calendar
        var porSemana: [String: Double] = [:]

        for sesion in sessions {
            guard let fecha = sesion.finishedAt else { continue }
            porSemana[lunesKey(de: fecha), default: 0] += sesion.totalVolumeKg
        }

        let lunesActual = lunes(de: now)
        var filas: [(String, Double)] = []
        for atras in stride(from: weeks - 1, through: 0, by: -1) {
            guard let inicio = cal.date(byAdding: .day, value: -atras * 7, to: lunesActual) else { continue }
            let key = TrainingCalendar.dayKey(inicio)
            filas.append((key, porSemana[key] ?? 0))
        }

        let maximo = filas.map(\.1).max() ?? 0
        return filas.map { key, kg in
            WeekBar(weekStartKey: key, kg: kg,
                    height: maximo > 0 ? max(0.04, kg / maximo) : 0.04)
        }
    }

    // MARK: - Días entrenados

    struct GridDay: Sendable, Hashable, Identifiable {
        let key: String
        let trained: Bool
        let isFuture: Bool
        var id: String { key }
    }

    struct Grid: Sendable, Hashable {
        let columns: [[GridDay]]
        let total: Int
    }

    /// Una columna por semana, de lunes a domingo. Los días que todavía no
    /// pasaron van aparte: no haber entrenado mañana no es lo mismo que
    /// haberte salteado ayer.
    static func trainedGrid(_ trainedDayKeys: Set<String>, weeks: Int = 26, now: Date = Date()) -> Grid {
        let cal = TrainingCalendar.calendar
        let hoyKey = TrainingCalendar.dayKey(now)
        let lunesActual = lunes(de: now)
        guard let primero = cal.date(byAdding: .day, value: -(weeks - 1) * 7, to: lunesActual) else {
            return Grid(columns: [], total: 0)
        }

        var columnas: [[GridDay]] = []
        for semana in 0..<weeks {
            guard let inicio = cal.date(byAdding: .day, value: semana * 7, to: primero) else { continue }
            var dias: [GridDay] = []
            for offset in 0..<7 {
                guard let fecha = cal.date(byAdding: .day, value: offset, to: inicio) else { continue }
                let key = TrainingCalendar.dayKey(fecha)
                dias.append(GridDay(key: key, trained: trainedDayKeys.contains(key), isFuture: key > hoyKey))
            }
            columnas.append(dias)
        }

        let total = columnas.flatMap { $0 }.filter(\.trained).count
        return Grid(columns: columnas, total: total)
    }

    // MARK: - Por ejercicio

    struct ExerciseRow: Sendable, Hashable, Identifiable {
        let exerciseID: String
        let sessions: Int
        /// Epley sobre la mejor serie real. Es una estimación y se rotula.
        let bestOneRepMax: Double
        let lastAt: Date?
        var id: String { exerciseID }
    }

    /// Ordena por lo último entrenado y no por la mejor marca: la pregunta al
    /// abrir progreso es "cómo vengo", y lo que estás entrenando ahora va
    /// primero.
    static func byExercise(_ sessions: [WorkoutSession], limit: Int = 12) -> [ExerciseRow] {
        var acumulado: [String: (sesiones: Int, mejor: Double, ultima: Date?)] = [:]

        for sesion in sessions {
            for ejercicio in sesion.exercises {
                var fila = acumulado[ejercicio.exerciseID] ?? (0, 0, nil)
                fila.sesiones += 1
                if let fecha = sesion.finishedAt, fila.ultima == nil || fecha > fila.ultima! {
                    fila.ultima = fecha
                }
                for serie in ejercicio.sets where !serie.failed {
                    fila.mejor = max(fila.mejor, Epley.estimatedOneRepMax(weight: serie.weight, reps: serie.reps))
                }
                acumulado[ejercicio.exerciseID] = fila
            }
        }

        return acumulado
            .map { ExerciseRow(exerciseID: $0.key, sessions: $0.value.sesiones,
                               bestOneRepMax: ($0.value.mejor * 10).rounded() / 10,
                               lastAt: $0.value.ultima) }
            .sorted { ($0.lastAt ?? .distantPast) > ($1.lastAt ?? .distantPast) }
            .prefix(limit)
            .map { $0 }
    }

    // MARK: - Formato

    /// Kilos en una unidad que se lea de un vistazo: arriba de una tonelada el
    /// número entero deja de decir algo útil.
    static func formatKg(_ kg: Double) -> String {
        guard kg > 0 else { return "0" }
        guard kg >= 1000 else { return "\(Int(kg.rounded())) kg" }
        let toneladas = kg / 1000
        let texto = toneladas >= 10
            ? String(format: "%.0f", toneladas)
            : String(format: "%.1f", toneladas).replacingOccurrences(of: ".", with: ",")
        return "\(texto) t"
    }

    /// "+20%" / "−5%" / "—". El signo menos es el de verdad, no un guion.
    static func trendLabel(_ pct: Int?) -> String {
        guard let pct else { return "—" }
        if pct == 0 { return "0%" }
        return pct > 0 ? "+\(pct)%" : "−\(abs(pct))%"
    }

    // MARK: - Ayudas

    private static func lunes(de fecha: Date) -> Date {
        let cal = TrainingCalendar.calendar
        let indice = TrainingCalendar.weekdayIndex(fecha)
        return cal.date(byAdding: .day, value: -indice, to: fecha) ?? fecha
    }

    private static func lunesKey(de fecha: Date) -> String {
        TrainingCalendar.dayKey(lunes(de: fecha))
    }
}
