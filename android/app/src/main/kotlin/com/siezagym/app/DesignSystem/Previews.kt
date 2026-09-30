package com.siezagym.app.DesignSystem

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

/** El contenido de ejemplo que se ve en los seis temas. */
@Composable
private fun EjemplosDelTema(theme: Theme) {
    Pantalla(titulo = "SIEZA", rotulo = "Gimnasio") {
        Text("Hoy")
        PageTitle("Entrenamiento")
        StatsCard(listOf("48" to "Series", "12.4 t" to "Volumen", "1" to "Rutinas"))
        GlassCard {
            FilaLista(
                nombre = "Press banca",
                detalle = "4 × 8 · 82 kg",
                miniatura = "https://media.example/press-banca.gif",
                valor = "82",
                unidad = "kg",
            )
        }
        PanelLista {
            FilaLista("Entrenamiento", "Rutinas")
            Separador()
            FilaLista("Historial", "Sesiones", valor = "24")
        }
        SolidButton("Empezar") {}
        Vacio("Todavía no entrenaste", accionTitulo = "Armar rutina") {}
        CreditoGifs()
    }
}

/**
 * Los seis temas de design2. `@Preview` no itera listas, así que se repite el
 * bloque a mano: si agregás un tema, agregá un bloque acá también.
 */
private fun tema(id: String) = Theme.conId(id)

@Preview(name = "SIEZA", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun SiezaPreview() {
    val t = tema("sieza")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}

@Preview(name = "Noche", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun NochePreview() {
    val t = tema("noche")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}

@Preview(name = "Plata", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun PlataPreview() {
    val t = tema("plata")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}

@Preview(name = "Brasa", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun BrasaPreview() {
    val t = tema("brasa")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}

@Preview(name = "Eléctrico", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun ElectricoPreview() {
    val t = tema("electrico")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}

@Preview(name = "Pliegues", showBackground = true, widthDp = 390, heightDp = 844)
@Composable
private fun PlieguesPreview() {
    val t = tema("pliegues")
    SiezaTheme(t) { Backdrop { EjemplosDelTema(t) } }
}
