package com.siezagym.app.Features.Profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.ProgressMetrics
import com.siezagym.app.Models.*
import com.siezagym.app.Services.*
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

/**
 * Perfil, con la identidad, tres números, una grilla de accesos al progreso
 * (antes su propia pestaña), los datos de la cuenta y la configuración con el
 * tema adentro.
 */
@Composable
fun ProfileScreen(data: GymData, store: GymStore, auth: AuthService, onOpen: (String) -> Unit) {
    val profile = data.profile
    var weight by
        rememberSaveable(profile?.id) { mutableStateOf(profile?.bodyWeightKg?.toString() ?: "") }
    var height by
        rememberSaveable(profile?.id) { mutableStateOf(profile?.heightCm?.toString() ?: "") }
    var goal by
        rememberSaveable(profile?.id) {
            mutableStateOf(profile?.weeklyCalorieGoalKcal?.toString() ?: "")
        }
    var sex by
        rememberSaveable(profile?.id) { mutableStateOf(profile?.sex ?: Sex.PREFIERO_NO_DECIR) }
    var level by
        rememberSaveable(profile?.id) {
            mutableStateOf(profile?.experienceLevel ?: ExperienceLevel.PRINCIPIANTE)
        }
    var saving by remember { mutableStateOf(false) }
    var saved by rememberSaveable { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val themeStore = rememberThemeStore()
    val totalSeries = data.sessions.sumOf { it.totalSetsCompleted }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, bottom = bottomNavInset),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Identidad(profile)

        StatsCard(
            listOf(
                "${data.sessions.size}" to
                    if (data.sessions.size == 1) "entrenamiento" else "entrenamientos",
                "$totalSeries" to if (totalSeries == 1) "serie" else "series",
                "${data.streak}" to if (data.streak == 1) "día seguido" else "días seguidos",
            )
        )

        Column {
            SectionLabel("Tu progreso")
            Spacer(Modifier.height(10.dp))
            GrillaProgreso(data, onOpen)
        }

        Column {
            SectionLabel("Tus datos")
            Spacer(Modifier.height(10.dp))
            CardDatos(
                weight = weight,
                onWeight = { weight = it; saved = null },
                height = height,
                onHeight = { height = it; saved = null },
                goal = goal,
                onGoal = { goal = it; saved = null },
                sex = sex,
                onSex = { sex = it; saved = null },
                level = level,
                onLevel = { level = it; saved = null },
                saving = saving,
                canSave = data.hasLoaded,
                saved = saved,
                error = error,
                onSave = {
                    error = null
                    saved = null
                    val campos = listOf(weight, height, goal)
                    val invalido =
                        campos.any {
                            it.isNotBlank() &&
                                (it.replace(',', '.').toDoubleOrNull()?.let { n ->
                                    n.isFinite() && n > 0
                                } != true)
                        }
                    if (invalido) {
                        error = "Ingresá valores mayores que cero o dejá el campo vacío."
                    } else {
                        saving = true
                        scope.launch {
                            try {
                                store.updateProfile(
                                    mapOf(
                                        "bodyWeightKg" to weight.replace(',', '.').toDoubleOrNull(),
                                        "heightCm" to height.replace(',', '.').toDoubleOrNull(),
                                        "weeklyCalorieGoalKcal" to
                                            goal.replace(',', '.').toDoubleOrNull(),
                                        "sex" to sex.raw,
                                        "experienceLevel" to level.raw,
                                    )
                                )
                                saved =
                                    "Listo, guardado ${LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))}."
                            } catch (e: CancellationException) {
                                throw e
                            } catch (e: Exception) {
                                error = "No se pudo guardar el perfil. Volvé a intentar."
                            } finally {
                                saving = false
                            }
                        }
                    }
                },
            )
        }

        Column {
            SectionLabel("Configuración")
            Spacer(Modifier.height(10.dp))
            SelectorTema(themeStore.actual) { themeStore.seleccionar(it) }
        }

        GhostButton(
            if (saving) "Guardando…" else "Cerrar sesión",
            Modifier.fillMaxWidth(),
        ) { auth.signOut() }
    }
}

@Composable
private fun Identidad(profile: UserProfile?) {
    GlassCard(radius = 26f) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(tema.vidrio(2))
                    .border(1.dp, tema.borde, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    profile?.initial ?: "T",
                    color = tema.texto,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
            Column(
                Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    profile?.displayName ?: "Sin nombre",
                    color = tema.texto,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                profile?.email?.let {
                    Text(it, color = tema.texto2, fontSize = 12.sp, maxLines = 1)
                }
                Text(
                    if (profile?.isCoach == true) "Entrenador" else "Atleta",
                    color = tema.texto3,
                    fontSize = 11.sp,
                )
            }
        }
    }
}

/**
 * Antes era su propia pestaña. Con la pantalla de inicio limitada a cuatro
 * lugares, y estos números leyéndose más como "cómo vengo" que como algo del
 * día a día, viven acá adentro: una grilla de accesos con el dato más
 * importante de cada uno.
 */
@Composable
private fun GrillaProgreso(data: GymData, onOpen: (String) -> Unit) {
    if (data.sessions.isEmpty()) {
        Vacio(
            "Todavía no terminaste ningún entrenamiento. Cuando termines el primero, " +
                "acá vas a ver tu volumen, tus músculos y tu balance de empuje y tracción."
        )
        return
    }
    val musculo = data.muscleVolume.rows.firstOrNull()?.label ?: "Sin datos todavía"
    val porEjercicio = ProgressMetrics.byExercise(data.sessions, limit = 99).size
    val accesos =
        listOf(
            Tarjeta(
                Icons.Filled.ShowChart,
                "Volumen",
                "${ProgressMetrics.formatKg(data.weeklyVolumeKg)} esta semana",
                "progreso/volume",
            ),
            Tarjeta(
                Icons.Filled.CalendarMonth,
                "Días entrenados",
                "${data.trainedDayKeys.size} en total",
                "progreso/dias",
            ),
            Tarjeta(Icons.Filled.FitnessCenter, "Músculos", musculo, "progreso/musculos"),
            Tarjeta(
                Icons.Filled.SwapHoriz,
                "Empuje y tracción",
                data.pushPull.label,
                "progreso/empuje-traccion",
            ),
            Tarjeta(
                Icons.AutoMirrored.Filled.List,
                "Por ejercicio",
                "$porEjercicio entrenados",
                "progreso/ejercicio",
            ),
        )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        accesos.chunked(2).forEach { fila ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                fila.forEach { t ->
                    Box(Modifier.weight(1f)) {
                        TarjetaProgreso(t.icono, t.titulo, t.valor) { onOpen(t.destino) }
                    }
                }
                if (fila.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

private data class Tarjeta(
    val icono: ImageVector,
    val titulo: String,
    val valor: String,
    val destino: String,
)

@Composable
private fun CardDatos(
    weight: String,
    onWeight: (String) -> Unit,
    height: String,
    onHeight: (String) -> Unit,
    goal: String,
    onGoal: (String) -> Unit,
    sex: Sex,
    onSex: (Sex) -> Unit,
    level: ExperienceLevel,
    onLevel: (ExperienceLevel) -> Unit,
    saving: Boolean,
    canSave: Boolean,
    saved: String?,
    error: String?,
    onSave: () -> Unit,
) {
    GlassCard {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Opciones("Sexo", Sex.entries, sex, onSex) { it.label }
            Opciones("Experiencia", ExperienceLevel.entries, level, onLevel) { it.label }

            Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Campo("Peso (kg)", weight, onWeight, Modifier.weight(1f), !saving)
                    Campo("Altura (cm)", height, onHeight, Modifier.weight(1f), !saving)
                }
                Text(
                    "El peso se usa para estimar las calorías de cada sesión.",
                    color = tema.texto3,
                    fontSize = 11.sp,
                )
            }

            Campo("Meta semanal (kcal)", goal, onGoal, Modifier.fillMaxWidth(), !saving)

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SolidButton(
                    if (saving) "Guardando…" else "Guardar",
                    expands = false,
                    enabled = canSave && !saving,
                    onClick = onSave,
                )
                if (saved != null) Text(saved, color = tema.texto2, fontSize = 12.sp)
            }
            error?.let { Text(it, color = tema.texto3, fontSize = 12.sp) }
        }
    }
}

@Composable
private fun Campo(
    rotulo: String,
    valor: String,
    onChange: (String) -> Unit,
    modifier: Modifier,
    enabled: Boolean,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(rotulo, color = tema.texto2, fontSize = 11.sp)
        BasicTextField(
            valor,
            onChange,
            Modifier
                .fillMaxWidth()
                .heightIn(min = 46.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(tema.vidrio(1))
                .border(1.dp, tema.borde, RoundedCornerShape(14.dp))
                .padding(horizontal = 14.dp),
            enabled = enabled,
            singleLine = true,
            textStyle =
                TextStyle(
                    color = tema.texto,
                    fontSize = 15.sp,
                    textAlign = TextAlign.Center,
                ),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            cursorBrush = SolidColor(tema.solido),
            decorationBox = { inner ->
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    if (valor.isEmpty()) Text("—", color = tema.texto3)
                    inner()
                }
            },
        )
    }
}

/** Opciones en línea. Volver a tocar la elegida la desmarca. */
@Composable
private fun <T> Opciones(
    rotulo: String,
    todas: List<T>,
    seleccion: T,
    elegir: (T) -> Unit,
    etiqueta: (T) -> String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(rotulo, color = tema.texto2, fontSize = 11.sp)
        FlowRow(spacing = 8.dp) {
            todas.forEach { opcion ->
                val activa = seleccion == opcion
                Box(
                    Modifier
                        .clip(CircleShape)
                        .background(if (activa) tema.solido else tema.vidrio(1))
                        .then(
                            if (activa) Modifier
                            else Modifier.border(1.dp, tema.borde, CircleShape)
                        )
                        .clickable { elegir(opcion) }
                        .padding(horizontal = 14.dp)
                        .heightIn(min = 38.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        etiqueta(opcion),
                        color = if (activa) tema.sobreSolido else tema.texto2,
                        fontSize = 13.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectorTema(actual: Theme, onSelect: (Theme) -> Unit) {
    GlassCard {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Tema", color = tema.texto, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Text(
                    "La apariencia de la app. Se guarda en este teléfono.",
                    color = tema.texto2,
                    fontSize = 11.sp,
                )
            }
            temasDesign2.chunked(3).forEach { fila ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    fila.forEach { opcion ->
                        MuestraTema(opcion, opcion.id == actual.id, Modifier.weight(1f)) {
                            onSelect(opcion)
                        }
                    }
                    repeat(3 - fila.size) { Spacer(Modifier.weight(1f)) }
                }
            }
        }
    }
}

@Composable
private fun MuestraTema(opcion: Theme, elegido: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val esquina = RoundedCornerShape(18.dp)
    Column(
        modifier
            .clip(esquina)
            .background(if (elegido) tema.vidrio(1) else androidx.compose.ui.graphics.Color.Transparent)
            .then(
                if (elegido) Modifier.border(1.dp, tema.bordeFuerte, esquina) else Modifier
            )
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        *opcion.fondo.toTypedArray()
                    )
                ),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(opcion.solido)
            )
        }
        Text(
            opcion.nombre,
            color = if (elegido) tema.texto else tema.texto2,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/**
 * Fila que envuelve: "Prefiero no decir" no entra en un tercio de pantalla.
 * Compose no trae un FlowRow, así que se arma acá.
 */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun FlowRow(
    spacing: androidx.compose.ui.unit.Dp = 8.dp,
    content: @Composable androidx.compose.foundation.layout.FlowRowScope.() -> Unit,
) {
    androidx.compose.foundation.layout.FlowRow(
        horizontalArrangement = Arrangement.spacedBy(spacing),
        verticalArrangement = Arrangement.spacedBy(spacing),
        content = content,
    )
}
