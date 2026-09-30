package com.siezagym.app.Features.Profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Models.*
import com.siezagym.app.Services.*
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(data: GymData, store: GymStore, auth: AuthService) {
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
    var menu by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var saved by rememberSaveable { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    Column(
        Modifier.fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SurfaceCard {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(
                    Modifier.size(52.dp).background(Theme.accent, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        profile?.initial ?: "?",
                        color = Theme.onDark,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
                Column {
                    Text(
                        profile?.displayName ?: "Sin nombre",
                        color = Theme.cardText,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(profile?.email ?: "", color = Theme.cardMuted, fontSize = 12.sp)
                }
            }
        }
        SurfaceCard {
            WidgetHeader("Tus datos")
            ProfileNumber(
                "Peso corporal",
                weight,
                {
                    weight = it
                    saved = null
                },
                "kg",
                !saving,
            )
            ProfileNumber(
                "Altura",
                height,
                {
                    height = it
                    saved = null
                },
                "cm",
                !saving,
            )
            ProfileNumber(
                "Meta semanal",
                goal,
                {
                    goal = it
                    saved = null
                },
                "kcal",
                !saving,
            )
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Sexo", Modifier.weight(1f), color = Theme.cardText, fontSize = 14.sp)
                Box {
                    TextButton(onClick = { menu = true }, enabled = !saving) {
                        Text(sex.label, color = Theme.accent)
                    }
                    DropdownMenu(menu, { menu = false }) {
                        Sex.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.label) },
                                onClick = {
                                    sex = option
                                    menu = false
                                    saved = null
                                },
                            )
                        }
                    }
                }
            }
            Text("Nivel", color = Theme.cardText, fontSize = 14.sp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ExperienceLevel.entries.forEach { option ->
                    FilterChip(
                        selected = level == option,
                        onClick = {
                            level = option
                            saved = null
                        },
                        enabled = !saving,
                        label = { Text(option.label, fontSize = 10.sp) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            Text(
                "El peso se usa para estimar las calorías de cada sesión.",
                color = Theme.cardMuted,
                fontSize = 10.sp,
            )
            AccentButton(
                if (saving) "Guardando…" else "Guardar",
                Modifier.fillMaxWidth(),
                enabled = !saving && data.hasLoaded,
            ) {
                error = null
                saved = null
                val inputs = listOf(weight, height, goal)
                if (
                    inputs.any {
                        it.isNotBlank() &&
                            (it.replace(',', '.').toDoubleOrNull()?.let { n ->
                                n.isFinite() && n > 0
                            } != true)
                    }
                ) {
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
                                "Guardado ${LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))}"
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Exception) {
                            error = "No se pudo guardar el perfil. Volvé a intentar."
                        } finally {
                            saving = false
                        }
                    }
                }
            }
            saved?.let { Text("✓ $it", color = Theme.accent, fontSize = 11.sp) }
            error?.let { Text(it, color = Theme.accentHover, fontSize = 12.sp) }
        }
        TextButton(
            onClick = { auth.signOut() },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = !saving,
        ) {
            Text(
                "Cerrar sesión",
                color = Theme.accentLight,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun ProfileNumber(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    unit: String,
    enabled: Boolean,
) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = 44.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(label, Modifier.weight(1f), color = Theme.cardText, fontSize = 14.sp)
        BasicTextField(
            value,
            onChange,
            Modifier.width(70.dp),
            enabled = enabled,
            singleLine = true,
            textStyle =
                TextStyle(
                    color = Theme.cardText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.End,
                ),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            cursorBrush = SolidColor(Theme.accent),
            decorationBox = { inner ->
                Box {
                    if (value.isEmpty())
                        Text(
                            "—",
                            Modifier.fillMaxWidth(),
                            textAlign = TextAlign.End,
                            color = Theme.cardMuted,
                        )
                    inner()
                }
            },
        )
        Text(unit, Modifier.width(30.dp), color = Theme.cardMuted, fontSize = 11.sp)
    }
}
