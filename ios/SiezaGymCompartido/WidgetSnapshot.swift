import Foundation

/// Espejo liviano de `HomeMetrics.CalorieGoal`.
///
/// No es el tipo de `HomeMetrics` directamente: `HomeMetrics` vive en
/// `SiezaGym/Domain` (el target de la app) y este archivo se compila también
/// dentro de la extensión de widgets, que no ve ese target. Los campos son
/// los mismos, ya resueltos a texto/número, así que no hace falta duplicar
/// nada más para dibujarlos.
nonisolated struct ResumenCalorias: Codable, Sendable, Hashable {
    var kcal: Int
    var meta: Int
    var pct: Int
    var etiqueta: String
    /// true cuando se usó el peso por defecto porque el perfil no lo tiene.
    var pesoPorDefecto: Bool
    var hasData: Bool
}

/// Espejo liviano de `HomeMetrics.Completion`.
nonisolated struct ResumenSeries: Codable, Sendable, Hashable {
    var pct: Int
    var completadas: Int
    var totales: Int
    var etiqueta: String
    var hasData: Bool
}

/// Espejo liviano de `HomeMetrics.MuscleVolumeRow`. `musculo` ya viene como
/// `"Pecho"`, no como el enum: el widget tampoco ve `MuscleGroup.label`.
nonisolated struct FilaMusculo: Codable, Sendable, Hashable, Identifiable {
    var musculo: String
    var kg: Int
    var pct: Double
    var id: String { musculo }
}

/// Espejo liviano de `HomeMetrics.MuscleVolume`.
nonisolated struct ResumenMusculos: Codable, Sendable, Hashable {
    var filas: [FilaMusculo]
    var totalKg: Int
    var hasData: Bool
}

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

    /// Las mismas cuentas que las tarjetas de "Tus objetivos" en la Home y de
    /// Progreso, calculadas por `HomeMetrics` y traídas acá ya resueltas.
    var calorias: ResumenCalorias
    var series: ResumenSeries
    var musculos: ResumenMusculos

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
        updatedAt: .distantPast,
        // 2000 repite el default de `HomeMetrics.defaultWeeklyCalorieGoal`, que
        // este archivo no puede importar (ver el comentario de `ResumenCalorias`).
        calorias: ResumenCalorias(kcal: 0, meta: 2000, pct: 0, etiqueta: "Vas lento", pesoPorDefecto: true, hasData: false),
        series: ResumenSeries(pct: 0, completadas: 0, totales: 0, etiqueta: "Sin datos", hasData: false),
        musculos: ResumenMusculos(filas: [], totalKg: 0, hasData: false)
    )
}
