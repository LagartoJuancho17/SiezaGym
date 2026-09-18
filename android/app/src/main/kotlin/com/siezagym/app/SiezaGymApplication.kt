package com.siezagym.app

import android.app.Application
import com.google.firebase.FirebaseApp
import com.siezagym.app.DesignSystem.ThemeStore
import com.siezagym.app.Services.AuthService

/** Lo que se crea una sola vez y sobrevive a cada Activity. */
class SiezaGymApplication : Application() {
    /** El tema elegido no depende de Firebase: siempre está disponible. */
    val themeStore: ThemeStore by lazy {
        ThemeStore(getSharedPreferences(ThemeStore.CLAVE_PREFERENCIAS, MODE_PRIVATE))
    }

    /**
     * La sesión necesita Firebase. Sin `google-services.json` (no está en el
     * repo porque es público) no se configura Firebase y la app muestra cómo
     * generarla, como la pantalla de config faltante de iOS.
     */
    val authService: AuthService? by lazy {
        if (FirebaseApp.initializeApp(this) != null) AuthService(this) else null
    }
}