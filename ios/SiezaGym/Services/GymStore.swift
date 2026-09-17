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
            async let catalog = repository.exercises()
            async let profile = repository.profile(uid: uid)
            async let routines = repository.routines(uid: uid)
            async let sessions = repository.sessions(uid: uid)

            self.catalog = try await catalog
            self.profile = try await profile
            self.routines = try await routines
            self.sessions = try await sessions
            loadError = nil
            lastLoadedAt = Date()
        } catch {
            log.error("carga fallo: \(error.localizedDescription, privacy: .public)")
            loadError = "No pudimos traer tus datos. Deslizá para reintentar."
        }
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
