package com.siezagym.app.DesignSystem

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.SubcomposeAsyncImage
import coil3.request.ImageRequest

/**
 * El marco de una pantalla: rótulo opcional arriba, título, y una acción a la derecha. Es el
 * `PageShell` de la web.
 */
@Composable
fun Pantalla(
    titulo: String,
    modifier: Modifier = Modifier,
    rotulo: String? = null,
    volver: Boolean = false,
    onVolver: (() -> Unit)? = null,
    accion: @Composable () -> Unit = {},
    contenido: @Composable () -> Unit,
) {
    Column(
        modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 8.dp)
            .padding(bottom = bottomNavInset + 24.dp),
        horizontalAlignment = Alignment.Start,
    ) {
        Row(
            Modifier.padding(bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (volver) {
                Box(
                    Modifier.size(44.dp).clickable { onVolver?.invoke() },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        "Volver",
                        tint = tema.texto,
                        modifier = Modifier.size(17.dp),
                    )
                }
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (rotulo != null) {
                    Text(rotulo, color = tema.texto2, fontSize = 13.sp, lineHeight = 17.sp)
                }
                Text(
                    titulo,
                    color = tema.texto,
                    fontSize = if (volver) 24.sp else 30.sp,
                    lineHeight = if (volver) 28.sp else 34.sp,
                    fontWeight = if (tema.plano) FontWeight.Bold else FontWeight.ExtraBold,
                    letterSpacing = tracking(-0.7f, 30f).sp,
                    maxLines = 2,
                )
            }
            accion()
        }
        contenido()
    }
}

/**
 * Deja libre abajo el lugar que ocupa la barra flotante. Sin esto el contenido termina tapado: la
 * barra va por encima, no dentro del layout.
 */
val bottomNavInset: Dp
    get() = bottomNavHeight + bottomNavGap + 12.dp

val bottomNavHeight: Dp
    get() = 52.dp
val bottomNavGap: Dp
    get() = 16.dp

/** Tres números en una tarjeta, separados por líneas. El `d2-stats` de la web. */
@Composable
fun StatsCard(datos: List<Pair<String, String>>, modifier: Modifier = Modifier) {
    val theme = LocalTheme.current
    val esquina = RoundedCornerShape(theme.esquina(26f))
    Row(
        modifier
            .fillMaxWidth()
            .clip(esquina)
            .background(theme.vidrio(1))
            .border(BorderStroke(1.dp, theme.borde), esquina)
            .padding(vertical = 16.dp, horizontal = 10.dp)
    ) {
        datos.forEachIndexed { indice, dato ->
            if (indice > 0) Box(Modifier.width(1.dp).height(34.dp).background(theme.borde))
            Column(
                Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    dato.first,
                    color = theme.texto,
                    fontSize = 22.sp,
                    lineHeight = 26.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = tracking(-0.7f, 22f).sp,
                    maxLines = 1,
                )
                Text(
                    dato.second,
                    color = theme.texto2,
                    fontSize = 10.sp,
                    lineHeight = 14.sp,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

/**
 * Panel de vidrio con filas separadas por una línea fina, como `.d2-routine-list`: la lista se lee
 * como un objeto y no como una pila.
 */
@Composable
fun PanelLista(modifier: Modifier = Modifier, contenido: @Composable () -> Unit) {
    val theme = LocalTheme.current
    val esquina = RoundedCornerShape(theme.esquina(24f))
    Column(
        modifier
            .fillMaxWidth()
            .clip(esquina)
            .background(theme.vidrio(1))
            .border(BorderStroke(1.dp, theme.borde), esquina)
    ) {
        contenido()
    }
}

/** Divisor de una línea entre filas de [PanelLista]. */
@Composable
fun Separador() {
    Box(Modifier.fillMaxWidth().height(1.dp).background(tema.borde))
}

/** Una fila de lista: nombre, detalle abajo, y un valor opcional a la derecha. */
@Composable
fun FilaLista(
    nombre: String,
    detalle: String,
    modifier: Modifier = Modifier,
    etiqueta: String? = null,
    valor: String? = null,
    unidad: String? = null,
    miniatura: String? = null,
    chevron: Boolean = true,
    onClick: (() -> Unit)? = null,
) {
    val theme = LocalTheme.current
    Row(
        modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(horizontal = 18.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (miniatura != null) {
            Miniatura(miniatura, lado = 40.dp, modifier = Modifier.padding(end = 2.dp))
        }
        Column(
            Modifier.weight(1f).padding(end = 8.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    nombre,
                    color = theme.texto,
                    fontSize = 15.sp,
                    lineHeight = 20.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = tracking(-0.2f, 15f).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false),
                )
                if (etiqueta != null)
                    Text(etiqueta, color = theme.texto2, fontSize = 10.sp, lineHeight = 14.sp)
            }
            Text(
                detalle,
                color = theme.texto2,
                fontSize = 11.sp,
                lineHeight = 15.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (valor != null) {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Text(valor, color = theme.texto, fontSize = 13.sp, lineHeight = 17.sp, maxLines = 1)
                if (unidad != null)
                    Text(unidad, color = theme.texto3, fontSize = 9.sp, lineHeight = 13.sp)
            }
        }
        if (chevron) {
            Icon(
                Icons.Filled.ChevronRight,
                null,
                tint = theme.texto3,
                modifier = Modifier.size(13.dp),
            )
        }
    }
}

/**
 * La animación del ejercicio. Fondo claro siempre: son trazos negros sobre blanco y sobre el vidrio
 * de un tema oscuro no se ven.
 */
@Composable
fun Miniatura(url: String?, lado: Dp = 54.dp, modifier: Modifier = Modifier) {
    Box(
        modifier.size(lado).clip(RoundedCornerShape(lado * 0.3f)).background(Color(0xFFF2F2F2)),
        contentAlignment = Alignment.Center,
    ) {
        val marcador =
            @Composable { Icon(Icons.Filled.FitnessCenter, null, tint = Color(0xFF999999)) }
        if (url != null) {
            SubcomposeAsyncImage(
                model = ImageRequest.Builder(LocalContext.current).data(url).build(),
                contentDescription = null,
                contentScale =
                    if (url.substringBefore('?').endsWith(".gif", ignoreCase = true))
                        ContentScale.Fit
                    else ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                loading = { marcador() },
                error = { marcador() },
            )
        } else {
            marcador()
        }
    }
}

/** Estado vacío: qué falta y cómo salir de ahí. */
@Composable
fun Vacio(
    texto: String,
    modifier: Modifier = Modifier,
    accionTitulo: String? = null,
    onAccion: (() -> Unit)? = null,
) {
    val theme = LocalTheme.current
    val esquina = RoundedCornerShape(24f.dp)
    Column(
        modifier
            .fillMaxWidth()
            .clip(esquina)
            .background(theme.vidrio(1))
            .border(BorderStroke(1.dp, theme.borde), esquina)
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            texto,
            color = theme.texto2,
            fontSize = 14.sp,
            lineHeight = 20.sp,
            textAlign = TextAlign.Center,
        )
        if (accionTitulo != null && onAccion != null) {
            SolidButton(accionTitulo, expands = false, onClick = onAccion)
        }
    }
}

/**
 * La atribución de los gifs. Es condición de la licencia: donde se ven las animaciones tiene que
 * estar el crédito.
 */
@Composable
fun CreditoGifs(modifier: Modifier = Modifier) {
    Text(
        "Animaciones de ejercicios © Gym visual",
        modifier.fillMaxWidth().padding(top = 14.dp),
        color = tema.texto3,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        textAlign = TextAlign.Center,
    )
}

/** El ícono de reintentar, para el banner de error de carga. */
@Composable
fun Pill(valor: String, color: Color = tema.solido) {
    Box(Modifier.clip(CircleShape).background(color).padding(horizontal = 10.dp, vertical = 5.dp)) {
        Text(
            valor,
            color = tema.sobreSolido,
            fontSize = 11.sp,
            lineHeight = 15.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}
