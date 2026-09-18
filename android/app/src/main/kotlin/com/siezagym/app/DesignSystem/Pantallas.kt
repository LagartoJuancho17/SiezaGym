package com.siezagym.app.DesignSystem

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
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
import coil3.compose.AsyncImage

/** El marco de una pantalla: rótulo opcional arriba, título, y una acción a la
 * derecha. Es el `PageShell` de la web. */
@Composable
fun Pantalla(
    titulo: String,
    rotulo: String? = null,
    volver: Boolean = false,
    onVolver: () -> Unit = {},
    accion: @Composable RowScope.() -> Unit = {},
    contenido: @Composable ColumnScope.() -> Unit,
) {
    val tema = LocalD2Theme.current
    Box(Modifier.fillMaxSize()) {
        Backdrop()
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp, bottom = 24.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (volver) {
                    IconButton(
                        onClick = onVolver,
                        modifier = Modifier.size(44.dp),
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver",
                            tint = tema.texto,
                        )
                    }
                }
                Column(Modifier.weight(1f)) {
                    if (rotulo != null) {
                        Text(rotulo, fontSize = 13.sp, color = tema.texto2)
                    }
                    Text(
                        titulo,
                        fontSize = if (volver) 24.sp else 30.sp,
                        fontWeight = FontWeight.Heavy,
                        letterSpacing = (-0.7).sp,
                        color = tema.texto,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                accion()
            }
            Spacer(Modifier.height(4.dp))
            contenido()
        }
    }
}

/** Tres números en una tarjeta, separados por líneas. El `d2-stats` de la web. */
@Composable
fun StatsCard(datos: List<Pair<String, String>>, modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    Row(modifier = modifier.fillMaxWidth()) {
        datos.forEachIndexed { indice, dato ->
            if (indice > 0) {
                Box(
                    Modifier
                        .height(34.dp)
                        .width(1.dp)
                        .background(tema.borde),
                )
            }
            Column(
                Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(Modifier.height(16.dp))
                Text(
                    dato.first,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = (-0.7).sp,
                    color = tema.texto,
                    maxLines = 1,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    dato.second,
                    fontSize = 10.sp,
                    color = tema.texto2,
                    textAlign = TextAlign.Center,
                )
            }
        }
        Spacer(Modifier.height(16.dp))
    }
}

/** Panel de vidrio con filas separadas por una línea fina, como
 * `.d2-routine-list`: la lista se lee como un objeto y no como una pila. */
@Composable
fun PanelLista(
    modifier: Modifier = Modifier,
    contenido: @Composable ColumnScope.() -> Unit,
) {
    val tema = LocalD2Theme.current
    Column(
        modifier
            .clip(RoundedCornerShape(24.dp))
            .background(tema.vidrio(1))
            .border(1.dp, tema.borde, RoundedCornerShape(24.dp)),
        content = contenido,
    )
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
    val tema = LocalD2Theme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .clickable(enabled = onClick != null, onClick = { onClick?.invoke() })
            .padding(horizontal = 18.dp, vertical = 13.dp),
    ) {
        if (miniatura != null) {
            Miniatura(url = miniatura, lado = 40.dp)
            Spacer(Modifier.width(12.dp))
        }

        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    nombre,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = (-0.2).sp,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (etiqueta != null) {
                    Spacer(Modifier.width(8.dp))
                    Text(etiqueta, fontSize = 10.sp, color = tema.texto2)
                }
            }
            Spacer(Modifier.height(5.dp))
            Text(
                detalle,
                fontSize = 11.sp,
                color = tema.texto2,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if (valor != null) {
            Spacer(Modifier.width(12.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    valor,
                    fontSize = 13.sp,
                    color = tema.texto,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (unidad != null) {
                    Text(unidad, fontSize = 9.sp, color = tema.texto3)
                }
            }
        }

        if (chevron) {
            Spacer(Modifier.width(12.dp))
            Icon(
                Icons.Filled.ChevronRight,
                contentDescription = null,
                tint = tema.texto3,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

/** La animación del ejercicio. Fondo claro siempre: son trazos negros sobre
 * blanco y sobre el vidrio de un tema oscuro no se ven.
 *
 * Coil ya viene con el decodificador de GIF, así que los gifs remotos animan
 * solos. */
@Composable
fun Miniatura(url: String?, lado: Dp = 54.dp, modifier: Modifier = Modifier) {
    Box(
        modifier
            .size(lado)
            .clip(RoundedCornerShape(lado * 0.3f))
            .background(Color(0xFFF2F2F2)),
        contentAlignment = Alignment.Center,
    ) {
        if (!url.isNullOrBlank()) {
            AsyncImage(
                model = url,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }
        Icon(
            Icons.Filled.FitnessCenter,
            contentDescription = null,
            tint = Color(0xFF999999),
            modifier = Modifier.size(lado * 0.38f),
        )
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
    val tema = LocalD2Theme.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .fillMaxWidth()
            .padding(28.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(tema.vidrio(1))
            .border(1.dp, tema.borde, RoundedCornerShape(24.dp)),
    ) {
        Spacer(Modifier.height(16.dp))
        Text(
            texto,
            fontSize = 14.sp,
            color = tema.texto2,
            textAlign = TextAlign.Center,
        )
        if (accionTitulo != null && onAccion != null) {
            Spacer(Modifier.height(16.dp))
            GhostButton(texto = accionTitulo, onClick = onAccion)
        }
        Spacer(Modifier.height(16.dp))
    }
}

/** La atribución de los gifs. Es condición de la licencia: donde se ven las
 * animaciones tiene que estar el crédito. */
@Composable
fun CreditoGifs(modifier: Modifier = Modifier) {
    val tema = LocalD2Theme.current
    val contexto = LocalContext.current
    Text(
        "Animaciones de ejercicios © Gym visual",
        fontSize = 10.sp,
        color = tema.texto3,
        textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline,
        textAlign = TextAlign.Center,
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 14.dp)
            .clickable {
                contexto.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://gymvisual.com/")),
                )
            },
    )
}