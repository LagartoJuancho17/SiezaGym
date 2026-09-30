package com.siezagym.app.Services

import android.content.Context
import androidx.glance.appwidget.updateAll
import com.siezagym.app.Domain.WidgetSnapshot
import com.siezagym.app.Widget.SiezaWidget
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Lo que la app le deja escrito al widget, igual que el `WidgetBridge` de iOS.
 *
 * En iOS el widget corre en otro proceso y hay que pedirle a `WidgetCenter` que recargue. En
 * Android se guarda el snapshot en `SharedPreferences` y se le pide a Glance que vuelva a componer
 * el widget. Si esto no se llama, el widget muestra lo último que vio.
 */
object WidgetBridge {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun publicar(context: Context, snapshot: WidgetSnapshot) {
        val app = context.applicationContext
        WidgetSnapshotStore(app).escribir(snapshot)
        refrescar(app)
    }

    /**
     * Cambiar de tema tiene que repintar el widget en el momento, sin esperar a la próxima carga de
     * datos.
     */
    fun actualizarTema(context: Context, id: String) {
        val app = context.applicationContext
        val store = WidgetSnapshotStore(app)
        val snapshot = store.leer() ?: return
        if (snapshot.themeID == id) return
        store.escribir(snapshot.copy(themeID = id))
        refrescar(app)
    }

    /**
     * Al cerrar sesión: el widget no puede seguir mostrando la racha del usuario anterior en la
     * pantalla de inicio.
     */
    fun limpiar(context: Context) {
        val app = context.applicationContext
        WidgetSnapshotStore(app).borrar()
        refrescar(app)
    }

    private fun refrescar(context: Context) {
        scope.launch { SiezaWidget().updateAll(context) }
    }
}
