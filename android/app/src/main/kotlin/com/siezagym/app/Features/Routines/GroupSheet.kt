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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.GroupColor
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.groupPresets

private const val MAX_NOMBRE_GRUPO = 30

/** A qué ejercicios aplica el grupo, con qué nombre y color. */
data class GrupoModal(
    val targetIndices: List<Int>,
    val groupName: String,
    val groupColor: GroupColor,
    val batchCount: Int,
    val applyBatch: Boolean,
    val hasExisting: Boolean,
) {
    companion object {
        /**
         * Agrupar un ejercicio suelto. Cuenta cuántos de los que vienen
         * después siguen sin grupo, para ofrecer "aplicar también a los
         * siguientes N": es la forma de llenar un bloque entero de una vez.
         */
        fun paraEjercicio(
            indice: Int,
            items: List<RoutineDraftExercise>,
        ): GrupoModal {
            val item = items[indice]
            var siguientes = 0
            var i = indice + 1
            while (i < items.size && items[i].group.isBlank()) {
                siguientes++
                i++
            }
            return GrupoModal(
                targetIndices = listOf(indice),
                groupName = item.group,
                groupColor = GroupColor.resuelto(item.groupColor, item.group) ?: GroupColor.TEAL,
                batchCount = siguientes,
                applyBatch = siguientes > 0,
                hasExisting = item.group.isNotBlank(),
            )
        }

        /** Editar el bloque entero del encabezado. */
        fun paraSeccion(
            seccion: com.siezagym.app.Domain.RoutineSection<RoutineDraftExercise>,
            items: List<RoutineDraftExercise>,
        ): GrupoModal {
            val ids = seccion.items.map { it.exerciseID }.toSet()
            return GrupoModal(
                targetIndices = items.indices.filter { items[it].exerciseID in ids },
                groupName = seccion.nombreGrupo,
                groupColor = seccion.color ?: GroupColor.TEAL,
                batchCount = 0,
                applyBatch = false,
                hasExisting = true,
            )
        }
    }
}

/** La hoja para nombrar y colorear un bloque. */
@Composable
fun HojaGrupo(
    modal: GrupoModal,
    onCerrar: () -> Unit,
    onAplicar: (nombre: String, color: GroupColor, aplicarLote: Boolean) -> Unit,
    onQuitar: () -> Unit,
) {
    var nombre by remember { mutableStateOf(modal.groupName) }
    var color by remember { mutableStateOf(modal.groupColor) }
    var aplicarLote by remember { mutableStateOf(modal.applyBatch) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
            .padding(top = 12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                if (modal.hasExisting) "Editar grupo" else "Agrupar ejercicios",
                Modifier.weight(1f),
                color = tema.texto,
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
            )
            IconButton(onClick = onCerrar, modifier = Modifier.size(44.dp)) {
                Icon(Icons.Filled.Close, "Cerrar", tint = tema.texto, modifier = Modifier.size(16.dp))
            }
        }

        Spacer(Modifier.height(20.dp))
        Text(
            "Organizá tu rutina en bloques como Movilidad, Fuerza o Descanso.",
            color = tema.texto2,
            fontSize = 13.sp,
        )

        Spacer(Modifier.height(20.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(groupPresets) { preset ->
                val seleccionado = nombre == preset.name
                val tono = if (seleccionado) preset.color.color else tema.texto3
                Row(
                    Modifier
                        .clip(CircleShape)
                        .background(tono.copy(alpha = if (seleccionado) 0.16f else 0.08f))
                        .border(
                            if (seleccionado) 1.5.dp else 1.dp,
                            if (seleccionado) preset.color.color else tema.borde,
                            CircleShape,
                        )
                        .clickable {
                            nombre = preset.name
                            color = preset.color
                        }
                        .padding(horizontal = 12.dp)
                        .heightIn(min = 36.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        preset.name,
                        color = if (seleccionado) preset.color.color else tema.texto2,
                        fontSize = 13.sp,
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionLabel("Nombre personalizado")
            CampoTexto(
                valor = nombre,
                onChange = { nombre = it.take(MAX_NOMBRE_GRUPO) },
                placeholder = "Ej: Movilidad, Fuerza, Descanso...",
                radio = 14.dp,
                paddingHorizontal = 14.dp,
                minHeight = 46.dp,
                etiqueta = "Nombre del grupo",
            )
        }

        Spacer(Modifier.height(20.dp))
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionLabel("Color del bloque")
            GroupColor.entries.forEach { opcion ->
                Box(
                    Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(opcion.color)
                        .border(
                            if (color == opcion) 2.dp else 0.dp,
                            tema.texto,
                            CircleShape,
                        )
                        .clickable { color = opcion }
                        .semantics { contentDescription = opcion.label },
                )
            }
        }

        if (modal.batchCount > 0) {
            Spacer(Modifier.height(20.dp))
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable { aplicarLote = !aplicarLote }
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    Modifier
                        .size(20.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (aplicarLote) tema.solido else androidx.compose.ui.graphics.Color.Transparent)
                        .border(1.dp, tema.borde, RoundedCornerShape(6.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    if (aplicarLote) {
                        Text(
                            "✓",
                            color = tema.sobreSolido,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
                Text(
                    "Aplicar también a los siguientes ${modal.batchCount} ejercicios",
                    color = tema.texto,
                    fontSize = 13.sp,
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        SolidButton("Aplicar grupo") { onAplicar(nombre, color, aplicarLote) }

        if (modal.hasExisting) {
            Spacer(Modifier.height(10.dp))
            GhostButton("Quitar del grupo", onClick = onQuitar)
        }
        Spacer(Modifier.height(20.dp))
    }
}
