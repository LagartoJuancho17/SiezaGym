import Foundation
import SwiftUI
import Testing
@testable import SiezaGym

// MARK: - Fixtures

/// 21 de septiembre de 2026, un lunes, 15:00 en Buenos Aires.
private let lunes = Date(timeIntervalSince1970: 1_790_017_200)

private func dia(_ offset: Int, desde: Date = lunes) -> Date {
    TrainingCalendar.calendar.date(byAdding: .day, value: offset, to: desde)!
}

private func session(
    id: String = "s1",
    finishedAt: Date?,
    volume: Double = 0,
    sets: Int = 0
) -> WorkoutSession {
    WorkoutSession(
        id: id,
        userID: "u1",
        routineName: "Test",
        routineID: nil,
        startedAt: nil,
        finishedAt: finishedAt,
        durationSeconds: 0,
        exercises: [],
        totalVolumeKg: volume,
        totalSetsCompleted: sets
    )
}

private func routine(_ ejercicios: [(String, Int)]) -> Routine {
    Routine(
        id: "r1",
        ownerID: "u1",
        name: "Empuje A",
        note: "",
        exercises: ejercicios.enumerated().map { orden, par in
            RoutineExercise(
                exerciseID: par.0,
                source: .catalog,
                order: orden,
                targetSets: par.1,
                targetReps: 10,
                targetRIR: nil,
                targetWeight: nil,
                techniqueNote: "",
                sets: nil
            )
        },
        showOnHome: true,
        lastUsedAt: nil,
        createdAt: nil,
        updatedAt: nil,
        isAssigned: false
    )
}

// MARK: - Snapshot

@Suite("Snapshot del widget")
struct WidgetSnapshotTests {
    @Test("sin datos el widget queda vacío, no en cero inventado")
    func vacio() {
        let snapshot = WidgetSnapshotBuilder.build(
            themeID: "noche", sessions: [], routine: nil, catalog: [:], now: lunes
        )

        #expect(snapshot.isEmpty)
        #expect(snapshot.streak == 0)
        #expect(snapshot.week == Array(repeating: false, count: 7))
        #expect(snapshot.routineName == nil)
    }

    @Test("la semana marca el día entrenado en su casilla")
    func semana() {
        // Lunes y miércoles de esta semana.
        let sesiones = [
            session(id: "a", finishedAt: lunes),
            session(id: "b", finishedAt: dia(2)),
        ]
        let snapshot = WidgetSnapshotBuilder.build(
            themeID: "noche", sessions: sesiones, routine: nil, catalog: [:], now: dia(2)
        )

        #expect(snapshot.week == [true, false, true, false, false, false, false])
        #expect(snapshot.trainedThisWeek == 2)
    }

    /// El miércoles la semana va de lunes a domingo, no de hoy a hoy+6: si el
    /// índice se calculara desde hoy, el lunes entrenado caería en la casilla
    /// del miércoles.
    @Test("la tira arranca el lunes aunque hoy sea jueves")
    func semanaDesdeLunes() {
        let jueves = dia(3)
        let banderas = WidgetSnapshotBuilder.weekFlags(
            trainedDayKeys: [TrainingCalendar.dayKey(lunes)], now: jueves
        )

        #expect(banderas == [true, false, false, false, false, false, false])
    }

    @Test("el volumen de la semana suma solo los últimos siete días")
    func volumenSemanal() {
        let sesiones = [
            session(id: "hoy", finishedAt: lunes, volume: 1200),
            session(id: "vieja", finishedAt: dia(-20), volume: 9999),
        ]
        let snapshot = WidgetSnapshotBuilder.build(
            themeID: "noche", sessions: sesiones, routine: nil, catalog: [:], now: lunes
        )

        #expect(snapshot.weeklyVolumeKg == 1200)
        #expect(snapshot.weeklySessions == 1)
    }

    @Test("la rutina viaja resuelta: el widget no tiene el catálogo")
    func rutinaResuelta() {
        let snapshot = WidgetSnapshotBuilder.build(
            themeID: "brasa",
            sessions: [],
            routine: routine([("press", 4), ("remo", 3)]),
            catalog: [:],
            now: lunes
        )

        #expect(snapshot.routineName == "Empuje A")
        #expect(snapshot.routineExercises == 2)
        #expect(snapshot.routineSets == 7)
        #expect(snapshot.routineMinutes > 0)
        #expect(snapshot.themeID == "brasa")
    }

    @Test("sobrevive la ida y vuelta a JSON, que es como viaja al widget")
    func codable() throws {
        let original = WidgetSnapshotBuilder.build(
            themeID: "plata",
            sessions: [session(finishedAt: lunes, volume: 500, sets: 12)],
            routine: routine([("press", 4)]),
            catalog: [:],
            now: lunes
        )

        let datos = try JSONEncoder().encode(original)
        let vuelta = try JSONDecoder().decode(WidgetSnapshot.self, from: datos)

        #expect(vuelta == original)
    }

    @Test("un tema desconocido cae en el de por defecto y no rompe el widget")
    func temaDesconocido() {
        #expect(Theme.conId("inventado").id == Theme.porDefecto.id)
    }
}

@Suite("Tema de marca SIEZA")
struct BrandThemeTests {
    @Test("SIEZA es el tema inicial y mantiene las opciones anteriores")
    func disponibilidad() {
        #expect(Theme.porDefecto.id == "sieza")
        #expect(Theme.todos.count == 6)
        #expect(Theme.conId("plata").id == "plata")
        #expect(Theme.conId("noche").id == "noche")
    }

    @Test("las tres capas del tema son opacas y el fondo es plano")
    func superficies() throws {
        let tema = Theme.conId("sieza")
        let superficie1 = try #require(tema.superficie1)
        let superficie2 = try #require(tema.superficie2)
        let superficie3 = try #require(tema.superficie3)

        #expect(tema.plano)
        #expect(tema.obra == nil)
        #expect(tema.fondo.count == 1)
        #expect(tema.fondoPlano == Color(r: 11, g: 12, b: 14, a: 1))
        #expect(tema.vidrio(1) == superficie1)
        #expect(tema.vidrio(2) == superficie2)
        #expect(tema.vidrio(3) == superficie3)
        #expect(tema.solido == Color(r: 255, g: 87, b: 51, a: 1))
        #expect(tema.sobreSolido == Color(r: 11, g: 12, b: 14, a: 1))
    }

    @Test("los temas antiguos siguen usando vidrio")
    func compatibilidad() {
        let plata = Theme.conId("plata")
        #expect(!plata.plano)
        #expect(plata.superficie1 == nil)
        #expect(plata.vidrio(1) == Color.white.opacity(plata.glass1))
    }
}

// MARK: - Live Activity

@Suite("Actividad del entrenamiento")
struct WorkoutActivityTests {
    @Test("el ejercicio en curso es el primero con series sin marcar")
    func ejercicioActual() {
        let estado = WorkoutActivityState.contenido([
            WorkoutProgress(exerciseName: "Press", doneSets: 4, totalSets: 4),
            WorkoutProgress(exerciseName: "Remo", doneSets: 1, totalSets: 3),
            WorkoutProgress(exerciseName: "Curl", doneSets: 0, totalSets: 3),
        ], volumeKg: 1234.567)

        #expect(estado.exerciseName == "Remo")
        #expect(estado.setNumber == 2)
        #expect(estado.setsInExercise == 3)
        #expect(estado.setLabel == "Serie 2 de 3")
        #expect(estado.completedSets == 5)
        #expect(estado.totalSets == 10)
        #expect(estado.volumeKg == 1234.57)
    }

    @Test("con todo marcado no hay ejercicio en curso")
    func terminado() {
        let estado = WorkoutActivityState.contenido([
            WorkoutProgress(exerciseName: "Press", doneSets: 3, totalSets: 3),
        ], volumeKg: 0)

        #expect(estado.exerciseName == nil)
        #expect(estado.setLabel == "Terminaste")
        #expect(estado.progress == 1)
    }

    @Test("sin series cargadas el progreso es cero y no divide por cero")
    func sinSeries() {
        let estado = WorkoutActivityState.contenido([], volumeKg: 0)

        #expect(estado.progress == 0)
        #expect(estado.totalSets == 0)
        #expect(estado.exerciseName == nil)
    }

    @Test("el progreso es la fracción de series marcadas")
    func progreso() {
        let estado = WorkoutActivityState.contenido([
            WorkoutProgress(exerciseName: "Press", doneSets: 2, totalSets: 4),
            WorkoutProgress(exerciseName: "Remo", doneSets: 0, totalSets: 4),
        ], volumeKg: 0)

        #expect(estado.progress == 0.25)
    }

    /// Un ejercicio al que le agregaron series después de marcarlas todas no
    /// puede dejar el contador por encima del total.
    @Test("la serie en curso nunca pasa del total del ejercicio")
    func seriesExtra() {
        let estado = WorkoutActivityState.contenido([
            WorkoutProgress(exerciseName: "Press", doneSets: 9, totalSets: 4),
        ], volumeKg: 0)

        #expect(estado.exerciseName == nil)
        #expect(estado.progress == 1)
    }
}
