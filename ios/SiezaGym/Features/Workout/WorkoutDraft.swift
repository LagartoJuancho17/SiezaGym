import Foundation
import Observation

/// Lo que el usuario va cargando durante el entrenamiento, antes de guardarlo.
/// Solo las series marcadas como hechas terminan en Firestore: una serie con
/// numeros escritos pero sin tildar es una intencion, no un dato.
@Observable
final class WorkoutDraft {
    struct SetDraft: Identifiable {
        let id = UUID()
        var weight: Double
        var reps: Int
        var rir: Int?
        var failed = false
        var done = false
    }

    struct ExerciseDraft: Identifiable {
        let id: String
        let exerciseID: String
        let name: String
        let isTimeBased: Bool
        let mediaURL: URL?
        let videoURL: URL?
        let description: String?
        /// Bloque de la rutina ("Fuerza", "Potencia"...). Vacío es sin grupo.
        let group: String
        let groupColor: String
        var sets: [SetDraft]

        var completedCount: Int { sets.filter(\.done).count }

        /// Todas las series marcadas. Un ejercicio al que le sacaste todas las
        /// series tiene 0 de 0, que **no** es estar terminado: sin esa guarda
        /// se pintaría de verde sin haber hecho nada.
        var estaCompleto: Bool { !sets.isEmpty && completedCount == sets.count }
    }

    let routine: Routine?
    let startedAt = Date()
    var exercises: [ExerciseDraft]
    /// Cuántos ejercicios se sumaron entrenando: arma ids que no chocan con
    /// los de la rutina ("orden-ejercicio") aunque se agregue dos veces el mismo.
    private var agregadosEnVivo = 0

    init(routine: Routine?, catalog: [String: Exercise]) {
        self.routine = routine
        exercises = (routine?.exercises ?? []).map { item in
            let exercise = catalog[item.exerciseID]
            // Si el coach prescribio series una por una se respetan; si no, se
            // arman targetSets series iguales con el objetivo del plan.
            let sets: [SetDraft] = if let planned = item.sets, !planned.isEmpty {
                planned.map { SetDraft(weight: $0.weight ?? 0, reps: $0.reps, rir: $0.rir) }
            } else {
                (0..<max(1, item.targetSets)).map { _ in
                    SetDraft(weight: item.targetWeight ?? 0, reps: item.targetReps, rir: item.targetRIR)
                }
            }
            return ExerciseDraft(
                id: item.id,
                exerciseID: item.exerciseID,
                name: exercise?.nameEs ?? item.exerciseID,
                isTimeBased: exercise?.registrationType.isTimeBased ?? false,
                mediaURL: exercise?.mediaURL,
                videoURL: exercise?.videoURL,
                description: exercise?.descriptionEs,
                group: item.group,
                groupColor: item.groupColor,
                sets: sets
            )
        }
    }

    var completedSets: Int { exercises.reduce(0) { $0 + $1.completedCount } }

    var totalSets: Int { exercises.reduce(0) { $0 + $1.sets.count } }

    var volumeKg: Double {
        exercises.reduce(0) { total, exercise in
            total + exercise.sets.filter { $0.done && !$0.failed }
                .reduce(0) { $0 + $1.weight * Double($1.reps) }
        }
    }

    var canSave: Bool { completedSets > 0 }

    /// El ejercicio que conviene tener abierto: el primero que todavía tiene
    /// series sin marcar. Los demás van plegados, que es lo que hace que la
    /// pantalla entre en un teléfono cuando la rutina tiene ocho ejercicios.
    var ejercicioEnCurso: String? {
        proximaSerieSinMarcar().map { exercises[$0.ejercicio].id }
    }

    /// Dónde está la próxima serie sin marcar, recorriendo los ejercicios en
    /// orden. Es la misma regla con la que la actividad en vivo decide en qué
    /// ejercicio estás, así que el botón del widget y lo que dice la isla no
    /// pueden apuntar a series distintas.
    func proximaSerieSinMarcar() -> (ejercicio: Int, serie: Int)? {
        for indice in exercises.indices {
            if let serie = exercises[indice].sets.firstIndex(where: { !$0.done }) {
                return (indice, serie)
            }
        }
        return nil
    }

    /// Marca esa serie. Devuelve `false` si ya estaban todas: ahí no hay que
    /// arrancar un descanso.
    @discardableResult
    func marcarProximaSerie() -> Bool {
        guard let proxima = proximaSerieSinMarcar() else { return false }
        exercises[proxima.ejercicio].sets[proxima.serie].done = true
        return true
    }

    func addSet(to exerciseID: String) {
        guard let index = exercises.firstIndex(where: { $0.id == exerciseID }) else { return }
        // La serie nueva copia la ultima cargada: en el gimnasio casi siempre se
        // repite peso y reps, y asi es un toque en vez de dos campos.
        let previous = exercises[index].sets.last
        exercises[index].sets.append(
            SetDraft(weight: previous?.weight ?? 0, reps: previous?.reps ?? 10, rir: previous?.rir)
        )
    }

    /// Suma ejercicios en medio del entrenamiento ("hoy la máquina estaba
    /// libre"). Van al final, sin grupo, con 3 series vacías para cargar: no
    /// cambian la rutina guardada, solo lo que se registra hoy. Devuelve los
    /// ids nuevos, para abrir el primero.
    @discardableResult
    func agregarEjercicios(_ nuevos: [Exercise]) -> [String] {
        nuevos.map { exercise in
            agregadosEnVivo += 1
            let id = "vivo-\(agregadosEnVivo)-\(exercise.id)"
            let tiempo = exercise.registrationType.isTimeBased
            exercises.append(
                ExerciseDraft(
                    id: id,
                    exerciseID: exercise.id,
                    name: exercise.nameEs,
                    isTimeBased: tiempo,
                    mediaURL: exercise.mediaURL,
                    videoURL: exercise.videoURL,
                    description: exercise.descriptionEs.isEmpty ? nil : exercise.descriptionEs,
                    group: "",
                    groupColor: "",
                    sets: (0..<3).map { _ in SetDraft(weight: 0, reps: tiempo ? 30 : 10, rir: nil) }
                )
            )
            return id
        }
    }

    func removeSet(from exerciseID: String, at offsets: IndexSet) {
        guard let index = exercises.firstIndex(where: { $0.id == exerciseID }) else { return }
        exercises[index].sets.remove(atOffsets: offsets)
    }

    /// Lo que efectivamente se guarda.
    func loggedExercises() -> [LoggedExercise] {
        exercises.compactMap { exercise in
            let done = exercise.sets.filter(\.done)
            guard !done.isEmpty else { return nil }
            return LoggedExercise(
                exerciseID: exercise.exerciseID,
                sets: done.enumerated().map { index, set in
                    LoggedSet(
                        setNumber: index + 1,
                        weight: set.weight,
                        reps: set.reps,
                        rir: set.rir,
                        failed: set.failed
                    )
                }
            )
        }
    }
}
