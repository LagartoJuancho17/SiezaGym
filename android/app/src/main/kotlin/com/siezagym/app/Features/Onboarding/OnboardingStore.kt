package com.siezagym.app.Features.Onboarding

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

private const val PREFS = "sieza-onboarding"
private const val CLAVE_TERMINADO = "recorrido-terminado-v1"

/**
 * Si el recorrido ya se vio en este teléfono.
 *
 * Es una preferencia del aparato y no de la cuenta, como el tema: a la cuenta nueva le conviene
 * verlo, pero no tiene sentido repetirlo cada vez que se entra. En iOS esto es un `@AppStorage`.
 */
class OnboardingStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private val estado: MutableState<Boolean> = mutableStateOf(false)

    /** `true` cuando hay que mostrar el recorrido. */
    val pendiente: Boolean get() = !estado.value

    /** Se marca recién al terminar: abandonar a la mitad lo deja para la próxima. */
    fun marcarCompletado() {
        estado.value = true
        prefs.edit().putBoolean(CLAVE_TERMINADO, true).apply()
    }

    companion object {
        fun completado(context: Context): Boolean =
            context
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getBoolean(CLAVE_TERMINADO, false)
    }
}
