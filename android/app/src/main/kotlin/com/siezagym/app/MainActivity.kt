package com.siezagym.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.LocalThemeStore
import com.siezagym.app.Features.Shared.RootView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as SiezaGymApplication
        setContent {
            // El tema vive afuera de la Activity: el selector de Perfil lo cambia
            // y acá se refleja sin recargar nada.
            CompositionLocalProvider(
                LocalThemeStore provides app.themeStore,
                LocalD2Theme provides app.themeStore.actual,
            ) {
                val auth = app.authService
                if (auth != null) {
                    RootView(auth = auth)
                } else {
                    MissingConfigView()
                }
            }
        }
    }
}

/** Sin `google-services.json` la app no puede autenticar ni tocar Firestore:
 *  se explica qué hacer, como `MissingConfigView` en iOS. */
@Composable
private fun MissingConfigView() {
    val tema = LocalD2Theme.current
    Box(Modifier.fillMaxSize().background(tema.fondoPlano), contentAlignment = androidx.compose.ui.Alignment.Center) {
        Column(
            Modifier.padding(24.dp),
        ) {
            Text(
                "Falta google-services.json",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = tema.solido,
            )
            Text(
                "No está en el repo porque es público. Generalo desde la raíz del proyecto:",
                fontSize = 14.sp,
                color = tema.texto2,
                modifier = Modifier.padding(top = 14.dp, bottom = 14.dp),
            )
            Text(
                "node --env-file=.env --env-file=.env.local \\\nandroid/scripts/fetch-google-services-json.mjs",
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                color = tema.texto,
                modifier = Modifier
                    .padding(12.dp)
                    .background(androidx.compose.ui.graphics.Color.White.copy(alpha = 0.08f), RoundedCornerShape(24.dp)),
            )
        }
    }
}