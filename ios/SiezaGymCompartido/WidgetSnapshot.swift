import Foundation

/// Lo que el widget de la pantalla de inicio muestra, ya calculado.
///
/// El widget corre en otro proceso y **no puede leer Firestore**: no tiene la
/// sesión de Firebase ni presupuesto de memoria para el SDK. Así que la app
/// deja esto escrito cada vez que carga, y el widget solo lo lee y lo dibuja.
///
/// Por eso son valores y no ids: el widget no tiene el catálogo de ejercicios
/// para resolver nada.
nonisolated struct WidgetSnapshot: Codable, Sendable, Hashable {
    /// El tema elegido en la app. El widget no puede leer el `@AppStorage` de
    /// la app (son dos contenedores distintos), así que viaja acá.
    var themeID: String

    var streak: Int
    /// Lunes a domingo de la semana en curso. `true` = entrenaste ese día.
    var week: [Bool]
    var weeklyVolumeKg: Double
    var weeklySessions: Int

    /// La rutina que la app propone en la portada.
    var routineName: String?
    var routineExercises: Int
    var routineSets: Int
    var routineMinutes: Int

    var lastSessionAt: Date?
    var updatedAt: Date

    var trainedThisWeek: Int { week.filter(\.self).count }

    /// El estado vacío de verdad: nunca entrenó y no tiene rutinas.
    var isEmpty: Bool { streak == 0 && trainedThisWeek == 0 && routineName == nil }

    /// Sin id de tema, `Theme.conId` cae en el de por defecto: el widget de
    /// alguien que nunca abrió la app se ve como la app recién instalada.
    static let vacio = WidgetSnapshot(
        themeID: "",
        streak: 0,
        week: Array(repeating: false, count: 7),
        weeklyVolumeKg: 0,
        weeklySessions: 0,
        routineName: nil,
        routineExercises: 0,
        routineSets: 0,
        routineMinutes: 0,
        lastSessionAt: nil,
        updatedAt: .distantPast
    )
}
