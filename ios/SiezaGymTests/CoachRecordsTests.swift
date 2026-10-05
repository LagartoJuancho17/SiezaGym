import Foundation
import Testing
@testable import SiezaGym

@Suite("Pesos y récords del alumno")
struct CoachRecordsTests {
    private let json = """
    {"student":{"studentId":"s1","displayName":"Ana","email":null,"photoURL":null,"experienceLevel":null,"bodyWeightKg":62,"trainingGoal":"fuerza","trainingDaysPerWeek":4},
     "sessions":[{"id":"x","routineName":"Upper","finishedAt":"2026-10-03T10:00:00.000Z","durationSeconds":3300,"totalVolumeKg":1840,"totalSetsCompleted":3,
       "exercises":[{"exerciseId":"banca","note":"subir","sets":[{"weight":80,"reps":8,"failed":false,"pr":true},{"weight":90,"reps":2,"failed":true,"pr":false}]},
                    {"exerciseId":"dominadas","note":null,"sets":[{"weight":0,"reps":12,"failed":false,"pr":false}]}]}],
     "assignments":[],
     "records":[{"exerciseId":"banca","bestOneRepMax":101.3,"bestSet":{"weight":80,"reps":8},"bestAt":"2026-10-03T10:00:00.000Z","maxWeightKg":85,"maxReps":8,"sessions":5},
                {"exerciseId":"dominadas","bestOneRepMax":0,"bestSet":null,"bestAt":null,"maxWeightKg":0,"maxReps":12,"sessions":2}],
     "exerciseNames":{"banca":"Press de banca con barra","dominadas":"Dominadas"}}
    """

    @Test("lee peso, reps, falladas y PR de cada serie")
    func series() throws {
        let detalle = try JSONDecoder.api.decode(DetalleAlumno.self, from: Data(json.utf8))
        let banca = try #require(detalle.sessions.first?.exercises.first)
        #expect(banca.hayPR)
        #expect(banca.sets.map(\.texto) == ["80 kg × 8", "90 kg × 2"])
        #expect(banca.sets.map(\.failed) == [false, true])
        // Sin peso se muestran las reps, no "0 kg".
        #expect(detalle.sessions.first?.exercises.last?.sets.first?.texto == "12 reps")
        #expect(detalle.nombre("banca") == "Press de banca con barra")
        #expect(detalle.nombre("otro") == "otro")
    }

    @Test("el récord muestra el 1RM y la mejor serie; sin peso, las reps máximas")
    func records() throws {
        let detalle = try JSONDecoder.api.decode(DetalleAlumno.self, from: Data(json.utf8))
        let banca = detalle.records[0]
        #expect(banca.valor.numero == "101,3 kg" && banca.valor.unidad == "1RM est.")
        #expect(banca.detalle == "Mejor serie: 80 kg × 8 · máx. 85 kg")
        let dominadas = detalle.records[1]
        #expect(dominadas.valor.numero == "12" && dominadas.valor.unidad == "reps máx.")
        #expect(dominadas.detalle == "2 entrenamientos")
    }

    @Test("una web anterior sin récords no rompe el detalle")
    func sinRecords() throws {
        let viejo = """
        {"student":{"studentId":"s1","displayName":"Ana"},"sessions":[],"assignments":[]}
        """
        let detalle = try JSONDecoder.api.decode(DetalleAlumno.self, from: Data(viejo.utf8))
        #expect(detalle.records.isEmpty && detalle.exerciseNames.isEmpty)
    }
}
