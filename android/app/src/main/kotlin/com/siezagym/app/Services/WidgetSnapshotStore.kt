package com.siezagym.app.Services

import android.content.Context
import com.siezagym.app.Domain.WidgetSnapshot
import com.siezagym.app.Domain.WidgetSnapshotJson

/**
 * Deja el snapshot del widget en `SharedPreferences`.
 *
 * En iOS el widget corre en otro proceso y no puede leer el `UserDefaults` de la app, así que el
 * snapshot viaja por un llavero compartido. En Android el widget comparte proceso y preferencias
 * con la app, así que el mismo archivo alcanza; lo que se mantiene es el formato: el widget lee
 * valores ya resueltos y nunca toca Firestore ni el catálogo.
 */
class WidgetSnapshotStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun leer(): WidgetSnapshot? = WidgetSnapshotJson.leer(prefs.getString(CLAVE, null))

    fun escribir(snapshot: WidgetSnapshot) {
        prefs.edit().putString(CLAVE, WidgetSnapshotJson.escribir(snapshot)).apply()
    }

    fun borrar() {
        prefs.edit().remove(CLAVE).apply()
    }

    companion object {
        private const val PREFS = "sieza-widget"
        private const val CLAVE = "snapshot"
    }
}
