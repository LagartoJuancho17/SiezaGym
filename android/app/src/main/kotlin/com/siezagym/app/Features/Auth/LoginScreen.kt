package com.siezagym.app.Features.Auth

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.D2Theme
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.R
import com.siezagym.app.Services.AuthService
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.launch

/** La pantalla de entrada: email y contraseña, o Google. Igual que iOS, que a
 *  su vez es el login de la web. */
@Composable
fun LoginScreen(auth: AuthService) {
    val tema = LocalD2Theme.current
    val contexto = LocalContext.current
    val scope = rememberCoroutineScope()

    var registro by rememberSaveable { mutableStateOf(false) }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var displayName by rememberSaveable { mutableStateOf("") }
    val error by auth.errorMessage.collectAsState()
    val trabajando by auth.isWorking.collectAsState()

    val googleLogin = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { resultado ->
        scope.launch { auth.completeGoogleSignIn(resultado.data) }
    }

    val puedeEnviar = email.contains("@") && password.length >= 6 && !trabajando

    Box(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(24.dp),
        ) {
            Spacer(Modifier.height(54.dp))

            Column {
                Text(
                    "BIENVENIDO",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.6.sp,
                    color = tema.texto,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "SiezaGym",
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Bold,
                    color = tema.texto,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "Entrá para ver tus rutinas y registrar tus entrenamientos.",
                    fontSize = 15.sp,
                    color = tema.texto2,
                )
            }

            Spacer(Modifier.height(28.dp))

            Column(verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(10.dp)) {
                if (registro) {
                    Campo(
                        label = "Nombre",
                        value = displayName,
                        onChange = { displayName = it },
                    )
                }
                Campo(
                    label = "Email",
                    value = email,
                    onChange = { email = it },
                    teclado = KeyboardType.Email,
                    siguiente = true,
                )
                Campo(
                    label = "Contraseña",
                    value = password,
                    onChange = { password = it },
                    contrasena = true,
                    onSubmit = { if (puedeEnviar) enviar(auth, scope, registro, email, password, displayName) },
                )
            }

            if (error != null) {
                Spacer(Modifier.height(14.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.Warning,
                        contentDescription = null,
                        tint = tema.texto,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        error!!,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = tema.texto,
                    )
                }
            }

            Spacer(Modifier.height(18.dp))

            Box {
                SolidButtonText(
                    texto = if (registro) "Crear cuenta" else "Entrar",
                    enabled = puedeEnviar,
                ) {
                    enviar(auth, scope, registro, email, password, displayName)
                }
                if (trabajando) {
                    CircularProgressIndicator(
                        color = tema.sobreSolido,
                        modifier = Modifier
                            .align(Alignment.Center)
                            .size(22.dp),
                        strokeWidth = 2.dp,
                    )
                }
            }

            Separador(tema)

            BotonGoogle(tema, enabled = !trabajando) {
                val intent = auth.googleSignInIntent()
                if (intent != null) {
                    googleLogin.launch(intent)
                } else {
                    Toast.makeText(contexto, "Falta la configuración de Firebase. Se crea con scripts/fetch-google-services-json.mjs", Toast.LENGTH_LONG).show()
                }
            }

            Spacer(Modifier.height(14.dp))

            Text(
                if (registro) "Ya tengo cuenta" else "No tengo cuenta",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = tema.texto2,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        registro = !registro
                        auth.clearError()
                    }
                    .padding(vertical = 8.dp),
            )
        }
    }
}

private fun enviar(
    auth: AuthService,
    scope: kotlinx.coroutines.CoroutineScope,
    registro: Boolean,
    email: String,
    password: String,
    displayName: String,
) {
    if (registro) {
        scope.launch { auth.signUp(email = email, password = password, displayName = displayName) }
    } else {
        scope.launch { auth.signIn(email = email, password = password) }
    }
}

/** El botón principal, con el texto sobre el sólido del tema. */
@Composable
private fun SolidButtonText(
    texto: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val tema = LocalD2Theme.current
    Box(
        Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clipCapecula()
            .background(if (enabled) tema.solido else tema.solido.copy(alpha = 0.5f))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            texto,
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            color = if (enabled) tema.sobreSolido else tema.sobreSolido.copy(alpha = 0.7f),
        )
    }
}

@Composable
private fun Separador(tema: D2Theme) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 18.dp),
    ) {
        Box(Modifier.weight(1f).height(1.dp).background(Color.White.copy(alpha = 0.14f)))
        Spacer(Modifier.width(12.dp))
        Text("o", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = tema.texto3)
        Spacer(Modifier.width(12.dp))
        Box(Modifier.weight(1f).height(1.dp).background(Color.White.copy(alpha = 0.14f)))
    }
}

/** El botón oficial de Google: el logo es el del SDK, la marca de Google no se
 *  dibuja a mano. Fondo claro siempre, como el button del SDK. */
@Composable
private fun BotonGoogle(tema: D2Theme, enabled: Boolean, onGoogle: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .height(50.dp)
            .clipCapecula()
            .background(Color.White)
            .clickable(enabled = enabled, onClick = onGoogle),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                painterResource(R.drawable.ic_google),
                contentDescription = null,
                modifier = Modifier.size(20.dp),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                "Continuar con Google",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF1F1F1F),
            )
        }
    }
}

/** Campo del login: vidrio, con el borde del sólido cuando está enfocado. */
@Composable
private fun Campo(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    contrasena: Boolean = false,
    teclado: KeyboardType = KeyboardType.Text,
    siguiente: Boolean = false,
    onSubmit: (() -> Unit)? = null,
) {
    val tema = LocalD2Theme.current
    TextField(
        value = value,
        onValueChange = onChange,
        singleLine = true,
        label = null,
        placeholder = { Text(label, color = tema.texto3) },
        visualTransformation = if (contrasena) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(
            keyboardType = teclado,
            imeAction = if (siguiente || contrasena) androidx.compose.ui.text.input.ImeAction.Next else androidx.compose.ui.text.input.ImeAction.Done,
        ),
        keyboardActions = KeyboardActions(
            onDone = { onSubmit?.invoke() },
            onNext = { onSubmit?.invoke() },
        ),
        textStyle = androidx.compose.ui.text.TextStyle(
            color = tema.texto,
            fontSize = 16.sp,
        ),
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Color(0x14FFFFFF),
            unfocusedContainerColor = Color(0x14FFFFFF),
            disabledContainerColor = Color(0x14FFFFFF),
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent,
            disabledIndicatorColor = Color.Transparent,
            cursorColor = tema.solido,
            focusedPlaceholderColor = tema.texto3,
            unfocusedPlaceholderColor = tema.texto3,
        ),
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clipCapecula(),
    )
}

private fun Modifier.clipCapecula(): Modifier = clip(RoundedCornerShape(24.dp))