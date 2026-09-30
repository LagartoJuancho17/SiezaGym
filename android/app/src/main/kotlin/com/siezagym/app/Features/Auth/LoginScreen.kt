package com.siezagym.app.Features.Auth

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.gms.common.SignInButton
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Services.AuthService
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(auth: AuthService) {
    var signup by rememberSaveable { mutableStateOf(false) }
    var email by rememberSaveable { mutableStateOf("") }
    // Password stays in memory, never in Android's saved-instance-state bundle.
    var password by remember { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var googleError by remember { mutableStateOf<String?>(null) }
    val working by auth.isWorking.collectAsStateWithLifecycle()
    val error by auth.errorMessage.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val canSubmit = email.contains('@') && password.length >= 6 && !working
    fun submit() {
        if (canSubmit)
            scope.launch {
                if (signup) auth.signUp(email, password, name) else auth.signIn(email, password)
            }
    }
    val launcher =
        rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result
            ->
            if (result.data != null)
                scope.launch { auth.completeGoogleSignIn(result.data) }
        }
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(22.dp),
    ) {
        Column(
            Modifier.padding(top = 60.dp, bottom = 6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                "BIENVENIDO",
                color = Theme.accent,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.6.sp,
            )
            Text("SiezaGym", color = Theme.onDark, fontSize = 44.sp, fontWeight = FontWeight.Bold)
            Text(
                "Entrá para ver tus rutinas y registrar tus entrenamientos.",
                color = Theme.onDarkMuted,
                fontSize = 15.sp,
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (signup) LoginField("Nombre", name, { name = it }, KeyboardType.Text)
            LoginField("Email", email, { email = it }, KeyboardType.Email)
            LoginField(
                "Contraseña",
                password,
                { password = it },
                KeyboardType.Password,
                password = true,
                onSubmit = { submit() },
            )
        }
        (error ?: googleError)?.let { Text(it, color = Theme.accentLight, fontSize = 13.sp) }
        AccentButton(
            if (working) "Conectando…" else if (signup) "Crear cuenta" else "Entrar",
            Modifier.fillMaxWidth(),
            enabled = canSubmit,
            onClick = { submit() },
        )
        Row(
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            HorizontalDivider(Modifier.weight(1f), color = Theme.onDark.copy(alpha = .14f))
            Text("o", color = Theme.onDarkFaint, fontSize = 12.sp)
            HorizontalDivider(Modifier.weight(1f), color = Theme.onDark.copy(alpha = .14f))
        }
        AndroidView(
            factory = { context ->
                SignInButton(context).apply {
                    setSize(SignInButton.SIZE_WIDE)
                    setColorScheme(SignInButton.COLOR_LIGHT)
                }
            },
            update = { button ->
                button.isEnabled = !working
                button.setOnClickListener {
                    googleError = null
                    val intent = auth.googleSignInIntent()
                    if (intent != null) launcher.launch(intent)
                    else googleError = "Google no está configurado para esta app. Probá con email."
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
        )
        TextButton(
            onClick = {
                signup = !signup
                auth.clearError()
                googleError = null
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !working,
        ) {
            Text(
                if (signup) "Ya tengo cuenta" else "No tengo cuenta",
                color = Theme.onDarkMuted,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun LoginField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    keyboard: KeyboardType,
    password: Boolean = false,
    onSubmit: () -> Unit = {},
) {
    BasicTextField(
        value,
        onChange,
        Modifier.fillMaxWidth()
            .heightIn(min = 52.dp)
            .background(Theme.onDark.copy(alpha = .08f), RoundedCornerShape(10.dp))
            .border(1.dp, Theme.cardBorder, RoundedCornerShape(10.dp))
            .padding(16.dp),
        textStyle = TextStyle(color = Theme.onDark, fontSize = 16.sp),
        cursorBrush = SolidColor(Theme.accent),
        singleLine = true,
        visualTransformation =
            if (password) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions =
            KeyboardOptions(
                keyboardType = keyboard,
                imeAction = if (password) ImeAction.Done else ImeAction.Next,
            ),
        keyboardActions = KeyboardActions(onDone = { onSubmit() }),
        decorationBox = { inner ->
            Box {
                if (value.isEmpty()) Text(label, color = Theme.onDarkFaint, fontSize = 16.sp)
                inner()
            }
        },
    )
}
