package com.siezagym.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Features.Shared.RootView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
        )
        setContent {
            SiezaTheme {
                Box(
                    Modifier.fillMaxSize()
                        .background(Theme.background)
                        .safeDrawingPadding()
                        .imePadding()
                ) {
                    val auth = (application as SiezaGymApplication).authService
                    if (auth != null) RootView(auth)
                    else
                        Column(
                            Modifier.padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            Text("Falta configurar Firebase", color = Theme.onDark)
                            Text(
                                "Agregá google-services.json en android/app y volvé a compilar.",
                                color = Theme.onDarkMuted,
                            )
                        }
                }
            }
        }
    }
}
