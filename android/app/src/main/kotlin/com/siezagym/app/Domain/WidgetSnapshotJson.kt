package com.siezagym.app.Domain

import java.time.ZonedDateTime
import org.json.JSONArray
import org.json.JSONObject

/**
 * El snapshot del widget en JSON para dejarlo en `SharedPreferences`. En iOS el mismo trabajo lo
 * hace `Codable` sobre un item del llavero; acá es `org.json` para no meter otra librería.
 *
 * Es puro: no toca Android, así que la ida y vuelta se puede testear en una JVM común.
 */
object WidgetSnapshotJson {
    fun escribir(snapshot: WidgetSnapshot): String =
        JSONObject()
            .apply {
                put("themeID", snapshot.themeID)
                put("streak", snapshot.streak)
                put("week", JSONArray(snapshot.week))
                put("weeklyVolumeKg", snapshot.weeklyVolumeKg)
                put("weeklySessions", snapshot.weeklySessions)
                put("routineName", snapshot.routineName ?: JSONObject.NULL)
                put("routineExercises", snapshot.routineExercises)
                put("routineSets", snapshot.routineSets)
                put("routineMinutes", snapshot.routineMinutes)
                put("lastSessionAt", snapshot.lastSessionAt?.toString() ?: JSONObject.NULL)
                put("updatedAt", snapshot.updatedAt.toString())
                put("calorias", calorias(snapshot.calorias))
                put("series", series(snapshot.series))
                put("musculos", musculos(snapshot.musculos))
            }
            .toString()

    fun leer(json: String?): WidgetSnapshot? {
        if (json.isNullOrBlank()) return null
        return try {
            val raiz = JSONObject(json)
            val calorias = raiz.getJSONObject("calorias")
            val series = raiz.getJSONObject("series")
            val musculos = raiz.getJSONObject("musculos")
            WidgetSnapshot(
                themeID = raiz.optString("themeID", ""),
                streak = raiz.optInt("streak", 0),
                week = raiz.optJSONArray("week").aBooleans(7),
                weeklyVolumeKg = raiz.optDouble("weeklyVolumeKg", 0.0),
                weeklySessions = raiz.optInt("weeklySessions", 0),
                routineName =
                    if (raiz.isNull("routineName")) null else raiz.getString("routineName"),
                routineExercises = raiz.optInt("routineExercises", 0),
                routineSets = raiz.optInt("routineSets", 0),
                routineMinutes = raiz.optInt("routineMinutes", 0),
                lastSessionAt =
                    if (raiz.isNull("lastSessionAt")) null
                    else ZonedDateTime.parse(raiz.getString("lastSessionAt")),
                updatedAt = ZonedDateTime.parse(raiz.getString("updatedAt")),
                calorias =
                    ResumenCalorias(
                        kcal = calorias.optInt("kcal", 0),
                        meta = calorias.optInt("meta", HomeMetrics.defaultWeeklyCalorieGoal.toInt()),
                        pct = calorias.optInt("pct", 0),
                        etiqueta = calorias.optString("etiqueta", "Vas lento"),
                        pesoPorDefecto = calorias.optBoolean("pesoPorDefecto", true),
                        hasData = calorias.optBoolean("hasData", false),
                    ),
                series =
                    ResumenSeries(
                        pct = series.optInt("pct", 0),
                        completadas = series.optInt("completadas", 0),
                        totales = series.optInt("totales", 0),
                        etiqueta = series.optString("etiqueta", "Sin datos"),
                        hasData = series.optBoolean("hasData", false),
                    ),
                musculos =
                    ResumenMusculos(
                        filas = musculos.optJSONArray("filas").aFilas(),
                        totalKg = musculos.optInt("totalKg", 0),
                        hasData = musculos.optBoolean("hasData", false),
                    ),
            )
        } catch (e: Exception) {
            null
        }
    }

    private fun calorias(resumen: ResumenCalorias) =
        JSONObject()
            .apply {
                put("kcal", resumen.kcal)
                put("meta", resumen.meta)
                put("pct", resumen.pct)
                put("etiqueta", resumen.etiqueta)
                put("pesoPorDefecto", resumen.pesoPorDefecto)
                put("hasData", resumen.hasData)
            }

    private fun series(resumen: ResumenSeries) =
        JSONObject()
            .apply {
                put("pct", resumen.pct)
                put("completadas", resumen.completadas)
                put("totales", resumen.totales)
                put("etiqueta", resumen.etiqueta)
                put("hasData", resumen.hasData)
            }

    private fun musculos(resumen: ResumenMusculos) =
        JSONObject()
            .apply {
                put(
                    "filas",
                    JSONArray(
                        resumen.filas.map { fila ->
                            JSONObject()
                                .apply {
                                    put("musculo", fila.musculo)
                                    put("kg", fila.kg)
                                    put("pct", fila.pct)
                                }
                        }
                    ),
                )
                put("totalKg", resumen.totalKg)
                put("hasData", resumen.hasData)
            }

    private fun JSONArray?.aBooleans(tamano: Int): List<Boolean> =
        (0 until tamano).map { indice -> this?.optBoolean(indice, false) ?: false }

    private fun JSONArray?.aFilas(): List<FilaMusculo> {
        if (this == null) return emptyList()
        return (0 until length()).map { indice ->
            val fila = optJSONObject(indice)
            FilaMusculo(
                musculo = fila.optString("musculo", ""),
                kg = fila.optInt("kg", 0),
                pct = fila.optDouble("pct", 0.0),
            )
        }
    }
}
