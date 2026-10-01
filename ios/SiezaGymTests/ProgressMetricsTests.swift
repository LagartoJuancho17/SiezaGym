import Foundation
import Testing
@testable import SiezaGym

// MARK: - Fixtures

/// 21 de septiembre de 2026, un lunes, 15:00 en Buenos Aires. Mismo ancla que
/// `WidgetTests`, para que las semanas se puedan razonar a ojo.
private let lunes = Date(timeIntervalSince1970: 1_790_017_200)

private func dia(_ offset: Int, desde: Date = lunes) -> Date {
    TrainingCalendar.calendar.date(byAdding: .day, value: offset, to: desde)!
}

private func session(
    id: String = "s1",
    finishedAt: Date?,
    volume: Double = 0,
    _ exercises: [LoggedExercise] = []
) -> WorkoutSession {
    WorkoutSession(
        id: id, userID: "u1", routineName: "Test", routineID: nil, startedAt: nil,
        finishedAt: finishedAt, durationSeconds: 0, exercises: exercises,
        totalVolumeKg: volume, totalSetsCompleted: 0
    )
}

private func loggedSet(_ weight: Double, _ reps: Int, failed: Bool = false) -> LoggedSet {
    LoggedSet(setNumber: 1, weight: weight, reps: reps, rir: nil, failed: failed)
}

// MARK: - Volumen por semana

@Suite("Volumen por semana")
struct VolumeByWeekTests {
    @Test("una sesión de esta semana cae en la última barra")
    func ultimaSemana() {
        let barras = ProgressMetrics.volumeByWeek([session(finishedAt: lunes, volume: 500)], weeks: 4, now: lunes)
        #expect(barras.count == 4)
        #expect(barras.last?.kg == 500)
        #expect(barras.dropLast().allSatisfy { $0.kg == 0 })
    }

    @Test("una sesión de hace 20 semanas no entra en una ventana de 12")
    func fueraDeVentana() {
        let barras = ProgressMetrics.volumeByWeek([session(finishedAt: dia(-20 * 7), volume: 999)], weeks: 12, now: lunes)
        #expect(barras.allSatisfy { $0.kg == 0 })
    }

    @Test("la altura es relativa a la semana más alta, no a un objetivo fijo")
    func alturaRelativa() {
        let barras = ProgressMetrics.volumeByWeek([
            session(id: "a", finishedAt: lunes, volume: 1000),
            session(id: "b", finishedAt: dia(-7), volume: 500),
        ], weeks: 2, now: lunes)

        #expect(barras[1].height == 1) // la semana más alta llena la barra
        #expect(barras[0].height == 0.5)
    }

    @Test("una semana sin volumen conserva una línea mínima, no cero")
    func pisoMinimo() {
        let barras = ProgressMetrics.volumeByWeek([session(finishedAt: lunes, volume: 100)], weeks: 2, now: lunes)
        #expect(barras[0].height == 0.04)
        #expect(barras[0].isEmpty)
    }

    @Test("sin sesiones no rompe")
    func sinSesiones() {
        let barras = ProgressMetrics.volumeByWeek([], weeks: 4, now: lunes)
        #expect(barras.count == 4)
        #expect(barras.allSatisfy { $0.height == 0.04 })
    }
}

// MARK: - Días entrenados

@Suite("Días entrenados")
struct TrainedGridTests {
    @Test("marca el día entrenado en su casilla")
    func diaEntrenado() {
        let grilla = ProgressMetrics.trainedGrid([TrainingCalendar.dayKey(lunes)], weeks: 1, now: lunes)
        #expect(grilla.total == 1)
        #expect(grilla.columns.first?.first?.trained == true)
    }

    @Test("un día futuro dentro de la semana en curso se marca aparte")
    func diaFuturo() {
        let grilla = ProgressMetrics.trainedGrid([], weeks: 1, now: lunes)
        let domingo = grilla.columns[0][6]
        #expect(domingo.isFuture) // el lunes es hoy; el domingo de esa semana todavía no llegó
        #expect(grilla.columns[0][0].isFuture == false) // hoy mismo no es "futuro"
    }

    @Test("cuenta el total sobre todas las columnas, no solo la última")
    func totalSumaTodasLasSemanas() {
        let claves: Set<String> = [TrainingCalendar.dayKey(lunes), TrainingCalendar.dayKey(dia(-7))]
        let grilla = ProgressMetrics.trainedGrid(claves, weeks: 2, now: lunes)
        #expect(grilla.total == 2)
    }

    @Test("sin días entrenados no rompe")
    func vacio() {
        let grilla = ProgressMetrics.trainedGrid([], weeks: 4, now: lunes)
        #expect(grilla.total == 0)
        #expect(grilla.columns.count == 4)
    }
}

// MARK: - Por ejercicio

@Suite("Por ejercicio")
struct ByExerciseTests {
    @Test("cuenta las sesiones y guarda la mejor marca real, no la fallada")
    func cuentaYMejorMarca() throws {
        let filas = ProgressMetrics.byExercise([
            session(id: "a", finishedAt: lunes, [
                LoggedExercise(exerciseID: "press", sets: [loggedSet(100, 5), loggedSet(200, 1, failed: true)]),
            ]),
            session(id: "b", finishedAt: dia(-7), [
                LoggedExercise(exerciseID: "press", sets: [loggedSet(90, 5)]),
            ]),
        ])

        let press = try #require(filas.first { $0.exerciseID == "press" })
        #expect(press.sessions == 2)
        #expect(press.bestOneRepMax > 100) // Epley sobre 100×5, no el peso fallado de 200
    }

    @Test("ordena por lo último entrenado, no por la mejor marca")
    func ordenPorFecha() {
        let filas = ProgressMetrics.byExercise([
            session(id: "vieja", finishedAt: dia(-14), [LoggedExercise(exerciseID: "sentadilla", sets: [loggedSet(200, 5)])]),
            session(id: "nueva", finishedAt: lunes, [LoggedExercise(exerciseID: "curl", sets: [loggedSet(20, 10)])]),
        ])

        #expect(filas.first?.exerciseID == "curl")
    }

    @Test("respeta el límite")
    func respetaLimite() {
        let sesiones = (0..<5).map { i in
            session(id: "s\(i)", finishedAt: lunes, [LoggedExercise(exerciseID: "ej\(i)", sets: [loggedSet(50, 10)])])
        }
        #expect(ProgressMetrics.byExercise(sesiones, limit: 2).count == 2)
    }

    @Test("sin sesiones no rompe")
    func sinSesiones() {
        #expect(ProgressMetrics.byExercise([]).isEmpty)
    }
}

// MARK: - Formato

@Suite("Formato de progreso")
struct ProgressFormatTests {
    @Test("kilos por debajo de la tonelada, enteros con unidad")
    func kilosSimples() {
        #expect(ProgressMetrics.formatKg(0) == "0")
        #expect(ProgressMetrics.formatKg(850) == "850 kg")
    }

    @Test("toneladas con coma para menos de 10, sin decimales de 10 en adelante")
    func toneladas() {
        #expect(ProgressMetrics.formatKg(4820) == "4,8 t")
        #expect(ProgressMetrics.formatKg(12_000) == "12 t")
    }

    @Test("la tendencia usa el signo menos de verdad, no un guion")
    func tendencia() {
        #expect(ProgressMetrics.trendLabel(nil) == "—")
        #expect(ProgressMetrics.trendLabel(0) == "0%")
        #expect(ProgressMetrics.trendLabel(20) == "+20%")
        #expect(ProgressMetrics.trendLabel(-5) == "−5%")
    }
}
