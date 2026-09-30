package com.siezagym.app.DesignSystem

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.siezagym.app.R
import java.text.NumberFormat
import java.util.Locale

/** Literal color and spacing tokens from feat/ios-app DesignSystem/Theme.swift. */
object Theme {
    val background = Color(0xFF3B0A0C)
    val deep = Color(0xFF250507)
    val card = Color(0xFFEDE8E1)
    val surface = Color(0xFFE5E1E0)
    val cardBorder = Color(0xFF6B1717)
    val hairline = Color(0xFF5A1215)
    val cardText = Color(0xFF141414)
    val cardMuted = Color(0xFF756C65)
    val accent = Color(0xFFFF5733)
    val accentLight = Color(0xFFFF7352)
    val accentHover = Color(0xFFE84D29)
    val chartLight = Color(0xFFCFC8BE)
    val chartDark = Color(0xFF3A3531)
    val onDark = Color.White
    val onDarkMuted = Color.White.copy(alpha = .72f)
    val onDarkFaint = Color.White.copy(alpha = .52f)
    val radius = 10.dp
}

@Composable
fun SiezaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme =
            lightColorScheme(
                primary = Theme.accent,
                onPrimary = Color.White,
                background = Theme.background,
                onBackground = Color.White,
                surface = Theme.surface,
                onSurface = Theme.cardText,
                surfaceVariant = Theme.card,
                onSurfaceVariant = Theme.cardMuted,
                error = Theme.accentHover,
            ),
        content = {
            // SwiftUI derives line height from each font size. Material's 24 sp
            // body line height otherwise survives even on our 9–12 sp labels.
            CompositionLocalProvider(LocalTextStyle provides TextStyle(fontSize = 14.sp)) {
                content()
            }
        },
    )
}

@Composable
fun SurfaceCard(
    modifier: Modifier = Modifier,
    padding: Dp = 14.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Theme.radius))
            .background(Theme.surface)
            .border(1.dp, Theme.hairline, RoundedCornerShape(Theme.radius))
            .padding(padding),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        content = content,
    )
}

@Composable
fun WidgetHeader(title: String) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(
            title.uppercase(),
            Modifier.weight(1f),
            color = Theme.cardMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = .8.sp,
        )
        Text("↗", color = Theme.cardMuted.copy(alpha = .7f), fontSize = 12.sp)
    }
}

@Composable
fun WidgetValue(value: String, unit: String = "") {
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(value, color = Theme.cardText, fontSize = 30.sp, fontWeight = FontWeight.Bold)
        Text(unit, Modifier.padding(bottom = 4.dp), color = Theme.cardMuted, fontSize = 13.sp)
    }
}

@Composable
fun WidgetMeter(value: Double) {
    Box(
        Modifier.fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(50))
            .background(Theme.chartLight)
    ) {
        Box(
            Modifier.fillMaxWidth(value.toFloat().coerceIn(0f, 1f))
                .fillMaxHeight()
                .clip(RoundedCornerShape(50))
                .background(Theme.chartDark)
        )
        Box(
            Modifier.fillMaxWidth(value.toFloat().coerceIn(0f, .35f))
                .fillMaxHeight()
                .clip(RoundedCornerShape(50))
                .background(Theme.accent)
        )
    }
}

@Composable
fun AccentButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Button(
        onClick,
        modifier.heightIn(min = 50.dp),
        enabled = enabled,
        shape = RoundedCornerShape(Theme.radius),
        colors = ButtonDefaults.buttonColors(containerColor = Theme.accent),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
    ) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun HeroImage(modifier: Modifier = Modifier) {
    Image(painterResource(R.drawable.hero_gym), null, modifier, contentScale = ContentScale.Crop)
}

@Composable
fun Hero(height: Dp, content: @Composable ColumnScope.() -> Unit) {
    Box(Modifier.fillMaxWidth().height(height)) {
        HeroImage(Modifier.matchParentSize())
        Box(
            Modifier.matchParentSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Black.copy(alpha = .15f), Color.Black.copy(alpha = .75f))
                    )
                )
        )
        Column(
            Modifier.align(Alignment.BottomStart).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content,
        )
    }
}

@Composable
fun Stat(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier) {
        Text(value, color = Theme.cardText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(label, color = Theme.cardMuted, fontSize = 10.sp)
    }
}

@Composable
fun EmptyWidget(message: String) {
    Text(
        message,
        Modifier.fillMaxWidth().heightIn(min = 44.dp),
        color = Theme.cardMuted,
        fontSize = 11.sp,
    )
}

fun number(value: Number): String =
    NumberFormat.getNumberInstance(Locale.forLanguageTag("es-AR"))
        .apply { maximumFractionDigits = 1 }
        .format(value)
