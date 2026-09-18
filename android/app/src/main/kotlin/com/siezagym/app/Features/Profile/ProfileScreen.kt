package com.siezagym.app.Features.Profile

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.siezagym.app.DesignSystem.CapsuleShape
import com.siezagym.app.DesignSystem.D2Theme
import com.siezagym.app.DesignSystem.FilaLista
import com.siezagym.app.DesignSystem.GhostButton
import com.siezagym.app.DesignSystem.GlassCard
import com.siezagym.app.DesignSystem.LocalD2Theme
import com.siezagym.app.DesignSystem.LocalThemeStore
import com.siezagym.app.DesignSystem.PanelLista
import com.siezagym.app.DesignSystem.SectionLabel
import com.siezagym.app.DesignSystem.SolidButton
import com.siezagym.app.DesignSystem.StatsCard
import com.siezagym.app.DesignSystem.TemasTokens
import com.siezagym.app.DesignSystem.Pantalla
import com.siezagym.app.Features.Shared.NavInset
import com.siezagym.app.Models.ExperienceLevel
import com.siezagym.app.Models.Sex
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.R
import com.siezagym.app.Services.AuthService
import com.siezagym.app.Services.GymStore
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.launch

/** Perfil, igual que `/perfil` en la web: la tarjeta de identidad, tres
 *  números, los datos de la cuenta y la configuración con el tema adentro. */
@Composable
fun ProfileScreen(store: GymStore, auth: AuthService) {
    val tema = LocalD2Theme.current
    val perfil by store.profile.collectAsState()
    val sesiones by store.sessions.collectAsState()
    val authError by auth.errorMessage.collectAsState()
    val scope = rememberCoroutineScope()

    var peso by remember { mutableStateOf("") }
    var altura by remember { mutableStateOf("") }
    var meta by remember { mutableStateOf("") }
    var sexo by remember { mutableStateOf<Sex?>(null) }
    var nivel by remember { mutableStateOf<ExperienceLevel?>(null) }
    var guardado by remember { mutableStateOf(false) }
    var cargado by remember { mutableStateOf(false) }

    // Solo la primera vez: después el texto es del usuario, no se pisa.
    LaunchedEffect(perfil) {
        if (!cargado) {
            perfil?.let { p ->
                peso = p.bodyWeightKg?.let(::numeroTexto) ?: ""
                altura = p.heightCm?.let(::numeroTexto) ?: ""
                meta = p.weeklyCalorieGoalKcal?.let(::numeroTexto) ?: ""
                sexo = p.sex
                nivel = p.experienceLevel
                cargado = true
            }
        }
    }

    val totalSeries = sesiones.sumOf { it.totalSetsCompleted }

    // Un cambio vuelve a desactivar el "Listo, guardado." del Swift.
    fun marcarCambio() {
        if (guardado) guardado = false
    }

    Pantalla(titulo = "Perfil") {
        Spacer(Modifier.height(20.dp))
        Identidad(perfil)

        Spacer(Modifier.height(14.dp))
        StatsCard(datos = listOf(
            "${sesiones.size}" to plural(sesiones.size, "entrenamiento", "entrenamientos"),
            "$totalSeries" to plural(totalSeries, "serie", "series"),
            "${store.streak}" to plural(store.streak, "día seguido", "días seguidos"),
        ))

        SectionLabel("Tus datos", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        GlassCard(modifier = Modifier.fillMaxWidth(), paddingInterno = 16.dp) {
            Column {
                Opciones(
                    rotulo = "Sexo",
                    todas = Sex.entries,
                    seleccion = sexo,
                    etiqueta = { it.label },
                    onElegir = { opcion ->
                        sexo = if (sexo == opcion) null else opcion
                        marcarCambio()
                    },
                )
                Spacer(Modifier.height(16.dp))
                Opciones(
                    rotulo = "Experiencia",
                    todas = ExperienceLevel.entries,
                    seleccion = nivel,
                    etiqueta = { it.label },
                    onElegir = { opcion ->
                        nivel = if (nivel == opcion) null else opcion
                        marcarCambio()
                    },
                )
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Campo("Peso (kg)", peso, Modifier.weight(1f)) {
                        peso = it
                        marcarCambio()
                    }
                    Campo("Altura (cm)", altura, Modifier.weight(1f)) {
                        altura = it
                        marcarCambio()
                    }
                }
                Spacer(Modifier.height(16.dp))
                Campo("Meta semanal (kcal)", meta, Modifier.fillMaxWidth()) {
                    meta = it
                    marcarCambio()
                }
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    SolidButton(
                        texto = "Guardar",
                        onClick = {
                            scope.launch {
                                store.updateProfile(
                                    mapOf(
                                        // Vacío se guarda como null y no como cero: son cosas distintas.
                                        "bodyWeightKg" to aNumero(peso),
                                        "heightCm" to aNumero(altura),
                                        "weeklyCalorieGoalKcal" to aNumero(meta),
                                        "sex" to sexo?.raw,
                                        "experienceLevel" to nivel?.raw,
                                    ),
                                )
                                guardado = true
                            }
                        },
                        expands = false,
                    )
                    if (guardado) {
                        Spacer(Modifier.width(12.dp))
                        Text("Listo, guardado.", fontSize = 12.sp, color = tema.texto2)
                    }
                }
                Spacer(Modifier.height(16.dp))
                // El peso no es decorativo: la portada lo usa para estimar las
                // calorías de la semana.
                Text(
                    "El peso se usa para estimar las calorías de cada sesión.",
                    fontSize = 11.sp,
                    color = tema.texto3,
                )
            }
        }

        SectionLabel("Configuración", modifier = Modifier.padding(top = 24.dp, bottom = 10.dp))
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            GlassCard(modifier = Modifier.fillMaxWidth(), paddingInterno = 16.dp) {
                Column {
                    Text("Tema", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = tema.texto)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "El fondo de la app. Se guarda en este teléfono.",
                        fontSize = 11.sp,
                        color = tema.texto2,
                    )
                    Spacer(Modifier.height(12.dp))
                    SelectorTemas()
                }
            }
            PanelLista(modifier = Modifier.fillMaxWidth()) {
                FilaLista(
                    nombre = "Entrenador",
                    detalle = "Quien te asigna rutinas",
                    valor = if (perfil?.isCoach == true) "Sos entrenador" else "Sin vincular",
                    chevron = false,
                )
            }
        }

        GhostButton(
            texto = "Cerrar sesión",
            onClick = { auth.signOut() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp),
        )

        authError?.let { mensaje ->
            Spacer(Modifier.height(12.dp))
            Text(mensaje, fontSize = 13.sp, color = tema.texto2)
        }

        Spacer(Modifier.height(NavInset.bottom.dp))
    }
}

// MARK: - Identidad

@Composable
private fun Identidad(perfil: UserProfile?) {
    val tema = LocalD2Theme.current
    GlassCard(modifier = Modifier.fillMaxWidth(), paddingInterno = 16.dp, radius = 26.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(tema.vidrio(2))
                    .border(1.dp, tema.borde, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    perfil?.initial ?: "T",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                )
                // La inicial queda atrás y actúa de placeholder como en iOS.
                if (!perfil?.photoUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = perfil?.photoUrl,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    perfil?.displayName ?: "Sin nombre",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                perfil?.email?.let { email ->
                    Text(
                        email,
                        fontSize = 12.sp,
                        color = tema.texto2,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    if (perfil?.isCoach == true) "Entrenador" else "Atleta",
                    fontSize = 11.sp,
                    color = tema.texto3,
                )
            }
        }
    }
}

// MARK: - Datos

/** Opciones en línea. Volver a tocar la elegida la desmarca: nada es
 *  obligatorio. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun <T : Any> Opciones(
    rotulo: String,
    todas: List<T>,
    seleccion: T?,
    etiqueta: (T) -> String,
    onElegir: (T) -> Unit,
) {
    val tema = LocalD2Theme.current
    Column {
        Text(rotulo, fontSize = 11.sp, color = tema.texto2)
        Spacer(Modifier.height(8.dp))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            todas.forEach { opcion ->
                val activa = seleccion == opcion
                Box(
                    Modifier
                        .clip(CapsuleShape)
                        .background(if (activa) tema.solido else tema.vidrio(1))
                        .border(
                            width = 1.dp,
                            color = if (activa) Color.Transparent else tema.borde,
                            shape = CapsuleShape,
                        )
                        .clickable { onElegir(opcion) }
                        .heightIn(min = 38.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        etiqueta(opcion),
                        fontSize = 13.sp,
                        color = if (activa) tema.sobreSolido else tema.texto2,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    )
                }
            }
        }
    }
}

/** Campo numérico en vidrio: rótulo chico arriba y el número centrado. */
@Composable
private fun Campo(
    rotulo: String,
    valor: String,
    modifier: Modifier = Modifier,
    onChange: (String) -> Unit,
) {
    val tema = LocalD2Theme.current
    Column {
        Text(rotulo, fontSize = 11.sp, color = tema.texto2)
        Spacer(Modifier.height(8.dp))
        TextField(
            value = valor,
            onValueChange = onChange,
            singleLine = true,
            placeholder = { Text("—", color = tema.texto3) },
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = androidx.compose.ui.text.TextStyle(
                color = tema.texto,
                fontSize = 16.sp,
                textAlign = TextAlign.Center,
            ),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = tema.vidrio(1),
                unfocusedContainerColor = tema.vidrio(1),
                disabledContainerColor = tema.vidrio(1),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                cursorColor = tema.solido,
                focusedPlaceholderColor = tema.texto3,
                unfocusedPlaceholderColor = tema.texto3,
                disabledPlaceholderColor = tema.texto3,
            ),
            modifier = modifier
                .clip(RoundedCornerShape(14.dp))
                .border(1.dp, tema.borde, RoundedCornerShape(14.dp))
                .height(46.dp),
        )
    }
}

// MARK: - Configuración

/** La grilla de temas del selector, como la `LazyVGrid` de iOS: tres por fila
 *  y la elegida marcada con el vidrio. */
@Composable
private fun SelectorTemas() {
    val tema = LocalD2Theme.current
    val temas = LocalThemeStore.current
    val filas = TemasTokens.chunked(3)
    Column {
        filas.forEachIndexed { indice, fila ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                fila.forEach { opcion ->
                    val activa = opcion.id == temas.actual.id
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (activa) tema.vidrio(1) else Color.Transparent)
                            .border(
                                width = if (activa) 1.dp else 0.dp,
                                color = if (activa) tema.bordeFuerte else Color.Transparent,
                                shape = RoundedCornerShape(18.dp),
                            )
                            .clickable { temas.elegir(opcion.id) }
                            .padding(vertical = 10.dp),
                    ) {
                        MuestraTema(opcion)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            opcion.nombre,
                            fontSize = 12.sp,
                            color = if (activa) tema.texto else tema.texto2,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                repeat(3 - fila.size) { Spacer(Modifier.weight(1f)) }
            }
            if (indice < filas.lastIndex) {
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}

/** El fondo real del tema en un círculo: la obra si la trae, o su degradado. */
@Composable
private fun MuestraTema(opcion: D2Theme) {
    val tema = LocalD2Theme.current
    Box(
        Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(
                Brush.linearGradient(
                    colorStops = *opcion.fondo.map { it.location to it.color }.toTypedArray(),
                    start = Offset(46f * opcion.fondoInicio.first, 46f * opcion.fondoInicio.second),
                    end = Offset(46f * opcion.fondoFin.first, 46f * opcion.fondoFin.second),
                ),
            )
            .border(1.dp, tema.bordeFuerte, CircleShape),
    ) {
        val obra = when (opcion.obra) {
            "pliegues" -> R.drawable.fondo_pliegues
            "electrico" -> R.drawable.fondo_electrico
            else -> null
        }
        if (obra != null) {
            Image(
                painter = painterResource(obra),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}

// MARK: - Utilidades

private fun plural(cantidad: Int, uno: String, varios: String): String =
    if (cantidad == 1) uno else varios

/** Número del perfil a texto, sin decimales cuando no los tiene. */
private fun numeroTexto(valor: Double): String =
    if (valor % 1.0 == 0.0) valor.toLong().toString() else valor.toString()

/** Lo que escribe el usuario a número. La coma decimal también se acepta. */
private fun aNumero(texto: String): Double? = texto.replace(',', '.').toDoubleOrNull()