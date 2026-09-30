package com.siezagym.app.Features.Shared

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.Backdrop
import com.siezagym.app.DesignSystem.SiezaTheme
import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.DesignSystem.tema

/**
 * La pantalla que Health Connect abre para explicar por qué la app pide leer pasos, distancia y
 * calorías. Es la `ACTION_SHOW_PERMISSIONS_RATIONALE` del manifest, y la que ve el usuario cuando
 * revisa el permiso desde Ajustes.
 */
class PrivacyPolicyActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SiezaTheme(Theme.porDefecto) {
                Backdrop {
                    Column(
                        Modifier
                            .fillMaxSize()
                            .safeDrawingPadding()
                            .verticalScroll(rememberScrollState())
                            .padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        Text(
                            "Actividad de SiezaGym",
                            color = tema.texto,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Medium,
                        )
                        Text(
                            "SiezaGym lee tu actividad de hoy desde Health Connect para mostrarte " +
                                "calorías, pasos y distancia junto a tus entrenamientos.",
                            color = tema.texto2,
                            fontSize = 15.sp,
                        )
                        Text(
                            "Sólo lectura: la app no escribe ni modifica datos en Health Connect. " +
                                "Podés revocar el permiso cuando quieras desde Health Connect.",
                            color = tema.texto2,
                            fontSize = 15.sp,
                        )
                        Text(
                            "Los datos de actividad se usan sólo para mostrarlos en la portada y no " +
                                "se comparten con terceros.",
                            color = tema.texto2,
                            fontSize = 15.sp,
                        )
                    }
                }
            }
        }
    }
}
