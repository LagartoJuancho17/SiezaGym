package com.siezagym.app

import android.app.Application
import com.google.firebase.FirebaseApp
import com.siezagym.app.Services.AuthService

class SiezaGymApplication : Application() {
    val authService: AuthService? by lazy {
        if (FirebaseApp.initializeApp(this) != null) AuthService(this) else null
    }
}
