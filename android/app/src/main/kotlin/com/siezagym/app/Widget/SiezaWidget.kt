package com.siezagym.app.Widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.Domain.WidgetSnapshot
import com.siezagym.app.MainActivity
import com.siezagym.app.Services.WidgetSnapshotStore
import java.util.Locale

/**
 * El widget de la pantalla de inicio: la rutina que toca hoy, la racha y cómo viene la semana.
 *
 * Es el único widget que se publica (en iOS eran cinco): la portada ya es la pantalla donde todo
 * eso convive, y un widget mediano con la tira de la semana es lo que más se mira de un vistazo.
 *
 * La app deja el [WidgetSnapshot] ya calculado en [WidgetSnapshotStore]; el widget no toca
 * Firestore ni el catálogo, sólo lo lee y lo dibuja.
 */
class SiezaWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = WidgetSnapshotStore(context).leer() ?: WidgetSnapshot.vacio
        provideContent { ContenidoHoy(snapshot, context) }
    }
}

class SiezaWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SiezaWidget()
}

@Composable
private fun ContenidoHoy(snapshot: WidgetSnapshot, context: Context) {
    val tema = Theme.conId(snapshot.themeID)
    Row(
        GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(tema.fondoPlano))
            .padding(14.dp)
            .clickable(actionStartActivity(Intent(context, MainActivity::class.java))),
        verticalAlignment = Alignment.Top,
    ) {
        Column(
            GlanceModifier.defaultWeight().fillMaxHeight(),
            verticalAlignment = Alignment.Top,
        ) {
            Text(
                if (snapshot.routineName == null) "SIEZAGYM" else "HOY TOCA",
                style = estilo(tema.solido, 9.sp, FontWeight.Bold),
                maxLines = 1,
            )
            Spacer(GlanceModifier.height(3.dp))
            Text(
                snapshot.routineName ?: "Entrenar libre",
                style = estilo(tema.texto, 19.sp, FontWeight.Bold),
                maxLines = 2,
            )
            if (snapshot.routineName != null) {
                Spacer(GlanceModifier.height(2.dp))
                Text(
                    detalle(snapshot),
                    style = estilo(tema.texto2, 11.sp),
                    maxLines = 1,
                )
            }
            Spacer(GlanceModifier.defaultWeight())
            SemanaTira(snapshot.week, tema)
        }
        Column(
            GlanceModifier.padding(start = 14.dp),
            horizontalAlignment = Alignment.End,
            verticalAlignment = Alignment.Top,
        ) {
            Dato("${snapshot.streak}", if (snapshot.streak == 1) "día" else "días", tema)
            Spacer(GlanceModifier.height(10.dp))
            Dato(volumenCorto(snapshot.weeklyVolumeKg), "semana", tema)
        }
    }
}

/** La tira de lunes a domingo, igual que la de la portada. */
@Composable
private fun SemanaTira(week: List<Boolean>, tema: Theme) {
    val letras = listOf("L", "M", "M", "J", "V", "S", "D")
    Row(verticalAlignment = Alignment.CenterVertically) {
        week.forEachIndexed { indice, entrenado ->
            Column(
                GlanceModifier.padding(end = 6.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    letras.getOrElse(indice) { "" },
                    style = estilo(tema.texto3, 9.sp, FontWeight.Medium),
                    maxLines = 1,
                )
                Spacer(GlanceModifier.height(2.dp))
                Box(
                    GlanceModifier
                        .size(9.dp)
                        .background(
                            ColorProvider(if (entrenado) tema.solido else tema.bordeFuerte)
                        )
                        .cornerRadius(4.5.dp)
                ) {}
            }
        }
    }
}

@Composable
private fun Dato(valor: String, rotulo: String, tema: Theme) {
    Column(horizontalAlignment = Alignment.End) {
        Text(
            valor,
            style = estilo(tema.texto, 21.sp, FontWeight.Bold),
            maxLines = 1,
        )
        Text(rotulo, style = estilo(tema.texto2, 10.sp), maxLines = 1)
    }
}

private fun detalle(snapshot: WidgetSnapshot): String =
    buildList {
            add("${snapshot.routineExercises} ejercicios")
            add("${snapshot.routineSets} series")
            if (snapshot.routineMinutes > 0) add("${snapshot.routineMinutes} min")
        }
        .joinToString(" · ")

/** "12 kg" o "1,2 t": en un widget chico no entran seis dígitos. */
private fun volumenCorto(kg: Double): String {
    val locale = Locale.forLanguageTag("es-AR")
    return if (kg >= 1000) String.format(locale, "%.1f t", kg / 1000)
    else String.format(locale, "%d kg", kg.toInt())
}

private fun estilo(color: Color, size: TextUnit, weight: FontWeight? = null) =
    TextStyle(color = ColorProvider(color), fontSize = size, fontWeight = weight)
