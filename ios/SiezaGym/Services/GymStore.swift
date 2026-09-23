import Foundation
import Observation
import os

private let log = Logger(subsystem: "com.siezagym.app", category: "store")

/// Estado compartido de la app: una sola carga de Firestore alimenta las cinco
/// pantallas. Si cada tab consultara por su cuenta pagariamos las mismas
/// lecturas cinco veces y podrian mostrar numeros distintos entre si.
@Observable
final class GymStore {
    let uid: String

    private(set) var profile: UserProfile?
    private(set) var routines: [Routine] = []
    private(set) var sessions: [WorkoutSession] = []
    private(set) var catalog: [String: Exercise] = [:]
    private(set) var isLoading = false
    private(set) var loadError: String?
    /// Nil hasta la primera carga: sirve para no mostrar "no hay nada" mientras carga.
    private(set) var lastLoadedAt: Date?

    /// Rutina en curso mantenida en stand-by
    var activeWorkout: WorkoutDraft?

    let healthKit = HealthKitService()

    private let repository = GymRepository()

    init(uid: String) {
        self.uid = uid
    }

    var hasLoaded: Bool { lastLoadedAt != nil }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            // Las cuatro consultas son independientes: van en paralelo.
            async let catalog = repository.exercises(uid: uid)
            async let profile = repository.profile(uid: uid)
            async let routines = repository.routines(uid: uid)
            async let sessions = repository.sessions(uid: uid)

            self.catalog = try await catalog
            self.profile = try await profile
            self.routines = try await routines
            self.sessions = try await sessions
            loadError = nil
            lastLoadedAt = Date()
            publicarWidget()
        } catch {
            log.error("carga fallo: \(error.localizedDescription, privacy: .public)")
            loadError = "No pudimos traer tus datos. Deslizá para reintentar."
        }
    }

    /// El widget corre en otro proceso y no llega a Firestore: la app le deja
    /// el resumen escrito cada vez que trae datos.
    private func publicarWidget() {
        WidgetBridge.publicar(
            WidgetSnapshotBuilder.build(
                themeID: ThemeStore.temaGuardado,
                sessions: sessions,
                routine: featuredRoutine,
                catalog: catalog
            )
        )
    }

    func exercise(_ id: String) -> Exercise? { catalog[id] }

    func name(of exerciseID: String) -> String {
        catalog[exerciseID]?.nameEs ?? exerciseID
    }

    // MARK: - Derivados de la Home

    var trainedDayKeys: Set<String> { HomeMetrics.trainedDayKeys(sessions) }

    var streak: Int { TrainingCalendar.streak(trainedDayKeys: trainedDayKeys) }

    /// La rutina que la Home propone: la ultima usada que se muestre en Home.
    var featuredRoutine: Routine? {
        routines.first { $0.showOnHome } ?? routines.first
    }

    var weekSessions: [WorkoutSession] { HomeMetrics.sessionsInLastDays(sessions, days: 7) }

    var weeklyVolumeKg: Double { weekSessions.reduce(0) { $0 + $1.totalVolumeKg } }

    var muscleVolume: HomeMetrics.MuscleVolume {
        HomeMetrics.volumeByMuscleGroup(sessions, catalog: catalog)
    }

    var pushPull: HomeMetrics.PushPull { HomeMetrics.pushPullBalance(sessions, catalog: catalog) }

    var completion: HomeMetrics.Completion { HomeMetrics.setCompletionRate(sessions) }

    var weekdayVolume: [HomeMetrics.WeekdayVolume] { HomeMetrics.volumeByWeekday(sessions) }

    var intensity: HomeMetrics.Intensity { HomeMetrics.relativeIntensity(sessions) }

    var volumeTrend: HomeMetrics.VolumeTrend { HomeMetrics.volumePerSession(sessions) }

    var zones: HomeMetrics.Zones { HomeMetrics.intensityZones(sessions) }

    var calories: HomeMetrics.CalorieGoal {
        HomeMetrics.weeklyCalories(
            weekSessions,
            bodyWeightKg: profile?.bodyWeightKg,
            goal: profile?.weeklyCalorieGoalKcal
        )
    }

    // MARK: - Escrituras

    func saveSession(routine: Routine?, startedAt: Date, exercises: [LoggedExercise]) async throws {
        try await repository.saveSession(
            uid: uid,
            routine: routine,
            startedAt: startedAt,
            exercises: exercises
        )
        await load()
    }

    func deleteSession(_ session: WorkoutSession) async throws {
        guard session.userID == uid else { return }
        try await repository.deleteSession(uid: uid, sessionID: session.id)
        sessions.removeAll { $0.id == session.id }
    }

    /// Crea una rutina y recarga, para que aparezca en la lista sin salir y
    /// volver a entrar.
    func createRoutine(name: String, note: String, exercises: [RoutineDraftExercise]) async throws {
        try await repository.createRoutine(uid: uid, name: name, note: note, exercises: exercises)
        await load()
    }

    /// Guarda los cambios de una rutina y recarga, para que el detalle muestre
    /// lo editado sin salir y volver a entrar.
    func updateRoutine(_ routine: Routine, name: String, note: String, exercises: [RoutineDraftExercise]) async throws {
        // Una rutina del coach vive en `assignments` y no es del alumno.
        guard !routine.isAssigned else { throw RoutineEditError.esDelCoach }
        try await repository.updateRoutine(
            routineID: routine.id,
            name: name,
            note: note,
            exercises: exercises
        )
        await load()
    }

    /// Crea un ejercicio propio y lo suma al catálogo en memoria, para que
    /// aparezca en el selector sin recargar todo desde Firestore.
    @discardableResult
    func createCustomExercise(_ draft: CustomExerciseDraft) async throws -> Exercise {
        let ejercicio = try await repository.createCustomExercise(uid: uid, draft: draft)
        catalog[ejercicio.id] = ejercicio
        return ejercicio
    }

    func updateProfile(_ fields: [String: Any]) async {
        do {
            try await repository.updateProfile(uid: uid, fields: fields)
            profile = try await repository.profile(uid: uid)
        } catch {
            log.error("perfil no se guardo: \(error.localizedDescription, privacy: .public)")
            loadError = "No se pudo guardar el perfil."
        }
    }
}

nonisolated enum RoutineEditError: LocalizedError {
    case esDelCoach

    var errorDescription: String? {
        "Las rutinas del coach se editan desde su panel."
    }
}
