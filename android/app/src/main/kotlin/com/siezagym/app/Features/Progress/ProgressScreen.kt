package com.siezagym.app.Features.Progress

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.DesignSystem.*
import com.siezagym.app.Domain.Epley
import com.siezagym.app.Domain.HomeMetrics
import com.siezagym.app.Services.GymData
import kotlin.math.roundToInt

@Composable
fun ProgressScreen(data: GymData) {
    val rows =
        HomeMetrics.bestOneRepMaxByExercise(data.sessions).entries.sortedByDescending { it.value }
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 12.dp, end = 12.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (rows.isEmpty() && data.hasLoaded)
            item {
                SurfaceCard(padding = 24.dp) {
                    Text(
                        "Registrá entrenamientos con peso para ver tu progreso.",
                        color = Theme.cardMuted,
                        fontSize = 14.sp,
                    )
                }
            }
        items(rows, key = { it.key }) { (id, oneRM) ->
            val sets =
                data.sessions
                    .flatMap { it.exercises }
                    .filter { it.exerciseID == id }
                    .flatMap { it.sets }
                    .filterNot { it.failed }
            val maxWeight = sets.maxOfOrNull { it.weight } ?: 0.0
            val points =
                data.sessions.reversed().mapNotNull { session ->
                    Epley.bestSet(
                            session.exercises.filter { it.exerciseID == id }.flatMap { it.sets }
                        )
                        ?.let { Epley.estimatedOneRepMax(it) }
                }
            SurfaceCard(padding = 12.dp) {
                Text(
                    data.name(id),
                    color = Theme.cardText,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                    Stat(number(oneRM.roundToInt()), "1RM est.")
                    Stat(number(maxWeight), "máximo real")
                    Stat("${points.size}", "sesiones")
                }
                if (points.size > 1) {
                    // El color se lee acá: dentro del DrawScope no hay recomposición.
                    val acento = Theme.accent
                    Canvas(Modifier.fillMaxWidth().height(44.dp)) {
                        val low = points.min()
                        val span = points.max() - low
                        val path = Path()
                        points.forEachIndexed { index, value ->
                            val x = size.width * index / (points.size - 1)
                            val y =
                                size.height *
                                    (1 - (if (span > 0) (value - low) / span else .5)).toFloat()
                            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
                        }
                        drawPath(
                            path,
                            acento,
                            style =
                                Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
                        )
                    }
                }
                Text(
                    "1RM estimado con Epley: peso × (1 + reps/30).",
                    color = Theme.cardMuted,
                    fontSize = 9.sp,
                )
            }
        }
    }
}
