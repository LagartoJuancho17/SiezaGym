#if DEBUG
import Foundation

/// Un alumno de ejemplo con entrenamientos, pesos y récords, para revisar el
/// detalle del panel del entrenador sin cuenta ni servidor:
///
///     xcrun simctl launch booted com.siezagym.app -sieza-preview -sieza-alumno-demo
enum AlumnoDemo {
    static let alumno = PanelCoach.Alumno(
        studentId: "demo", displayName: "Ana Pérez", email: "ana@ejemplo.com",
        photoURL: nil, linkedAt: nil, plans: 2
    )

    static let detalle: DetalleAlumno = {
        let json = """
        {"student":{"studentId":"demo","displayName":"Ana Pérez","email":"ana@ejemplo.com","bodyWeightKg":62,"trainingGoal":"fuerza","trainingDaysPerWeek":4},
         "sessions":[
          {"id":"s3","routineName":"Upper body","finishedAt":"2026-10-04T18:30:00.000Z","durationSeconds":3420,"totalVolumeKg":4980,"totalSetsCompleted":11,
           "exercises":[
            {"exerciseId":"press-de-banca-con-barra","note":"Subir 2,5 kg la próxima","sets":[{"weight":50,"reps":8,"pr":false},{"weight":55,"reps":6,"pr":true},{"weight":57.5,"reps":3,"failed":true}]},
            {"exerciseId":"remo-con-barra","sets":[{"weight":45,"reps":10},{"weight":45,"reps":10},{"weight":47.5,"reps":8,"pr":true}]},
            {"exerciseId":"dominadas","sets":[{"weight":0,"reps":6},{"weight":0,"reps":5}]}]},
          {"id":"s2","routineName":"Lower body","finishedAt":"2026-10-02T18:00:00.000Z","durationSeconds":3600,"totalVolumeKg":6320,"totalSetsCompleted":12,
           "exercises":[{"exerciseId":"sentadilla-con-barra","sets":[{"weight":70,"reps":6},{"weight":75,"reps":5,"pr":true}]}]},
          {"id":"s1","routineName":"Upper body","finishedAt":"2026-09-30T18:00:00.000Z","durationSeconds":3300,"totalVolumeKg":4500,"totalSetsCompleted":10,
           "exercises":[{"exerciseId":"press-de-banca-con-barra","sets":[{"weight":50,"reps":8},{"weight":52.5,"reps":6}]}]}],
         "assignments":[{"id":"a1","routineId":"r1","routineName":"Upper body","weekLabel":"Semana 1","note":"","assignedAt":"2026-09-28T10:00:00.000Z","lastCompletedAt":"2026-10-04T18:30:00.000Z","exercises":6}],
         "records":[
          {"exerciseId":"sentadilla-con-barra","bestOneRepMax":87.5,"bestSet":{"weight":75,"reps":5},"bestAt":"2026-10-02T18:00:00.000Z","maxWeightKg":75,"maxReps":6,"sessions":4},
          {"exerciseId":"press-de-banca-con-barra","bestOneRepMax":66,"bestSet":{"weight":55,"reps":6},"bestAt":"2026-10-04T18:30:00.000Z","maxWeightKg":55,"maxReps":8,"sessions":6},
          {"exerciseId":"remo-con-barra","bestOneRepMax":60.2,"bestSet":{"weight":47.5,"reps":8},"bestAt":"2026-10-04T18:30:00.000Z","maxWeightKg":47.5,"maxReps":10,"sessions":5},
          {"exerciseId":"dominadas","bestOneRepMax":0,"bestSet":null,"bestAt":null,"maxWeightKg":0,"maxReps":6,"sessions":5}],
         "exerciseNames":{"press-de-banca-con-barra":"Press de banca con barra","remo-con-barra":"Remo con barra","dominadas":"Dominadas","sentadilla-con-barra":"Sentadilla con barra"}}
        """
        // swiftlint:disable:next force_try
        return try! JSONDecoder.api.decode(DetalleAlumno.self, from: Data(json.utf8))
    }()
}
#endif
