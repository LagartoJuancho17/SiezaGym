package com.siezagym.app.Features.Routines

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.CustomExerciseDraft
import com.siezagym.app.Domain.CustomExerciseException
import com.siezagym.app.Models.Equipment
import com.siezagym.app.Models.MovementPattern
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.RegistrationType
import kotlinx.coroutines.launch

/**
 * Crear un ejercicio propio. El reparto muscular va en partes, no en
 * porcentajes: en el gimnasio nadie quiere pelear para que tres campos sumen
 * 100. El link, si se pone, tiene que ser de YouTube.
 */
@Composable
fun HojaEjercicioPropio(
    nombreInicial: String = "",
    onCerrar: () -> Unit,
    onCrear: suspend (CustomExerciseDraft) -> String,
) {
    var draft by remember { mutableStateOf(CustomExerciseDraft(nameEs = nombreInicial)) }
    var error by remember { mutableStateOf("") }
    var guardando by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val musculos = MuscleGroup.entries

    Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
                .padding(top = 12.dp)
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Ejercicio propio",
                    Modifier.weight(1f),
                    color = tema.texto,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                IconButton(onClick = onCerrar, modifier = Modifier.size(44.dp)) {
                    Icon(
                        Icons.Filled.Close,
                        "Cerrar",
                        tint = tema.texto,
                        modifier = Modifier.size(16.dp),
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Nombre")
                CampoTexto(
                    valor = draft.nameEs,
                    onChange = { draft = draft.copy(nameEs = it); error = "" },
                    placeholder = "Ej: Press inclinado en máquina",
                    minHeight = 46.dp,
                    radio = 14.dp,
                    paddingHorizontal = 14.dp,
                    etiqueta = "Nombre del ejercicio",
                )
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Cómo se registra")
                Selector(
                    opciones = RegistrationType.entries,
                    etiqueta = { it.label },
                    elegido = draft.registrationType,
                ) { draft = draft.copy(registrationType = it) }
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Equipamiento")
                Selector(
                    opciones = Equipment.entries,
                    etiqueta = { it.label },
                    elegido = draft.equipment,
                ) { draft = draft.copy(equipment = it) }
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Patrón de movimiento")
                Selector(
                    opciones = MovementPattern.entries,
                    etiqueta = { it.label },
                    elegido = draft.pattern,
                ) { draft = draft.copy(pattern = it) }
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Músculos que trabaja")
                Text(
                    "Repartí en partes. Con dos músculos en 1 y 1 es mitad y mitad.",
                    color = tema.texto2,
                    fontSize = 12.sp,
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(musculos) { musculo ->
                        FilaMusculo(
                            musculo = musculo,
                            partes = draft.shares[musculo] ?: 0,
                            onCambiar = { partes ->
                                val shares = draft.shares.toMutableMap()
                                if (partes <= 0) shares.remove(musculo) else shares[musculo] = partes
                                draft = draft.copy(shares = shares)
                                error = ""
                            },
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionLabel("Link de YouTube (opcional)")
                CampoTexto(
                    valor = draft.videoURL,
                    onChange = { draft = draft.copy(videoURL = it); error = "" },
                    placeholder = "youtube.com/watch?v=…",
                    minHeight = 46.dp,
                    radio = 14.dp,
                    paddingHorizontal = 14.dp,
                    etiqueta = "Link de YouTube",
                )
            }

            Spacer(Modifier.height(16.dp))
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(tema.vidrio(1))
                    .clickable { draft = draft.copy(unilateral = !draft.unilateral) }
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Trabaja un lado por vez",
                    Modifier.weight(1f),
                    color = tema.texto,
                    fontSize = 14.sp,
                )
                Box(
                    Modifier
                        .size(20.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            if (draft.unilateral) tema.solido
                            else androidx.compose.ui.graphics.Color.Transparent
                        )
                        .border(1.dp, tema.borde, RoundedCornerShape(6.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    if (draft.unilateral) {
                        Text(
                            "✓",
                            color = tema.sobreSolido,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            if (error.isNotEmpty()) {
                Spacer(Modifier.height(14.dp))
                Text(error, color = tema.texto, fontSize = 13.sp)
            }

            Spacer(Modifier.height(20.dp))
            SolidButton(if (guardando) "Guardando…" else "Crear ejercicio", enabled = !guardando) {
                scope.launch {
                    error = ""
                    try {
                        draft.validar()
                    } catch (e: CustomExerciseException) {
                        error = e.error.mensaje
                        return@launch
                    }
                    guardando = true
                    try {
                        onCrear(draft)
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo crear el ejercicio."
                        guardando = false
                    }
                }
            }
        Spacer(Modifier.height(20.dp))
    }
}

/** Una tira de opciones: la elegida en el sólido. */
@Composable
private fun <T> Selector(
    opciones: List<T>,
    etiqueta: (T) -> String,
    elegido: T,
    onElegir: (T) -> Unit,
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(opciones) { opcion ->
            val activo = opcion == elegido
            Box(
                Modifier
                    .clip(CircleShape)
                    .background(if (activo) tema.solido else tema.vidrio(1))
                    .then(if (activo) Modifier else Modifier.border(1.dp, tema.borde, CircleShape))
                    .clickable { onElegir(opcion) }
                    .padding(horizontal = 14.dp)
                    .heightIn(min = 36.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    etiqueta(opcion),
                    color = if (activo) tema.sobreSolido else tema.texto2,
                    fontSize = 13.sp,
                )
            }
        }
    }
}

/** Un músculo con su parte, y el – para sacarlo. */
@Composable
private fun FilaMusculo(musculo: MuscleGroup, partes: Int, onCambiar: (Int) -> Unit) {
    val activo = partes > 0
    Row(
        Modifier
            .clip(CircleShape)
            .background(if (activo) tema.solido.copy(alpha = 0.14f) else tema.vidrio(1))
            .then(if (activo) Modifier.border(1.dp, tema.solido, CircleShape)
                 else Modifier.border(1.dp, tema.borde, CircleShape))
            .clickable { onCambiar(if (activo) 0 else 1) }
            .padding(start = 14.dp, end = 6.dp)
            .heightIn(min = 36.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            musculo.label,
            color = if (activo) tema.texto else tema.texto2,
            fontSize = 13.sp,
        )
        if (activo) {
            Spacer(Modifier.width(8.dp))
            Text("×$partes", color = tema.solido, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            IconButton(onClick = { onCambiar(0) }, modifier = Modifier.size(28.dp)) {
                Icon(
                    Icons.Filled.Close,
                    "Sacar ${musculo.label}",
                    tint = tema.texto2,
                    modifier = Modifier.size(13.dp),
                )
            }
        }
    }
}
