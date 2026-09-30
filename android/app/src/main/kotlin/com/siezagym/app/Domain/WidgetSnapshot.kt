package com.siezagym.app.Domain

import java.time.ZonedDateTime

/**
 * Espejo liviano de [HomeMetrics.CalorieGoal], que es lo que dibuja el widget de la pantalla de
 * inicio. En iOS son tipos aparte porque la extensión del widget no ve el target de la app; acá se
 * mantienen separados igual para que el día que el widget corra en otro proceso no arrastre los
 * tipos de `HomeMetrics`.
 */
data class ResumenCalorias(
    val kcal: Int,
    val meta: Int,
    val pct: Int,
    val etiqueta: String,
    /** true cuando se usó el peso por defecto porque el perfil no lo tiene. */
    val pesoPorDefecto: Boolean,
    val hasData: Boolean,
)

/** Espejo liviano de [HomeMetrics.Completion]. */
data class ResumenSeries(
    val pct: Int,
    val completadas: Int,
    val totales: Int,
    val etiqueta: String,
    val hasData: Boolean,
)

/** Espejo liviano de [HomeMetrics.MuscleVolumeRow], con el músculo ya resuelto a su etiqueta. */
data class FilaMusculo(val musculo: String, val kg: Int, val pct: Double)

/** Espejo liviano de [HomeMetrics.MuscleVolume]. */
data class ResumenMusculos(val filas: List<FilaMusculo>, val totalKg: Int, val hasData: Boolean)

/**
 * Lo que el widget de la pantalla de inicio muestra, ya calculado.
 *
 * En iOS el widget corre en otro proceso, no puede leer Firestore y deja el resumen en el llavero
 * compartido. En Android el widget y la app comparten `SharedPreferences`, pero el snapshot se
 * piensa igual: valores ya resueltos, no ids, para que el widget no necesite el catálogo.
 */
data class WidgetSnapshot(
    /** El tema elegido. El widget no lee el `ThemeStore` de la app: viaja acá. */
    val themeID: String,
    val streak: Int,
    /** Lunes a domingo de la semana en curso. `true` = entrenaste ese día. */
    val week: List<Boolean>,
    val weeklyVolumeKg: Double,
    val weeklySessions: Int,
    val routineName: String?,
    val routineExercises: Int,
    val routineSets: Int,
    val routineMinutes: Int,
    val lastSessionAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime,
    val calorias: ResumenCalorias,
    val series: ResumenSeries,
    val musculos: ResumenMusculos,
) {
    val trainedThisWeek: Int get() = week.count { it }

    /** El estado vacío de verdad: nunca entrenó y no tiene rutinas. */
    val isEmpty: Boolean get() = streak == 0 && trainedThisWeek == 0 && routineName == null

    companion object {
        /**
         * Sin id de tema, `Theme.conId` cae en el de por defecto: el widget de alguien que nunca
         * abrió la app se ve como la app recién instalada.
         */
        val vacio =
            WidgetSnapshot(
                themeID = "",
                streak = 0,
                week = List(7) { false },
                weeklyVolumeKg = 0.0,
                weeklySessions = 0,
                routineName = null,
                routineExercises = 0,
                routineSets = 0,
                routineMinutes = 0,
                lastSessionAt = null,
                updatedAt = ZonedDateTime.ofInstant(java.time.Instant.EPOCH, TrainingCalendar.zone),
                calorias =
                    ResumenCalorias(
                        kcal = 0,
                        meta = HomeMetrics.defaultWeeklyCalorieGoal.toInt(),
                        pct = 0,
                        etiqueta = "Vas lento",
                        pesoPorDefecto = true,
                        hasData = false,
                    ),
                series = ResumenSeries(0, 0, 0, "Sin datos", hasData = false),
                musculos = ResumenMusculos(emptyList(), 0, hasData = false),
            )
    }
}
