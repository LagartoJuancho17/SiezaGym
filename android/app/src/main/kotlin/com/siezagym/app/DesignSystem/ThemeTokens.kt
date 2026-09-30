package com.siezagym.app.DesignSystem

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.siezagym.app.R

/**
 * Tokens de los temas del diseño, espejo de
 * `ios/SiezaGymCompartido/ThemeTokens.swift` de `feat/ios-design2`. Ahí los
 * genera `ios/scripts/sync-theme.mjs` desde `app/design2.css`, que es la fuente
 * de verdad de los dos clientes.
 *
 * Cada tema trae: tres niveles de tinta para el vidrio, los bordes, tres
 * escalones de texto, el sólido con su color de texto encima, las tres luces
 * que se apoyan sobre el degradado, tres manchas desenfocadas y el degradado
 * de fondo. SIEZA es el único plano: superficies opacas, sin desenfoque.
 */

private fun rgba(r: Int, g: Int, b: Int, a: Double = 1.0) = Color(r / 255f, g / 255f, b / 255f, a.toFloat())

/** Los seis temas del diseño, en el mismo orden que la web. */
val temasDesign2: List<Theme> =
    listOf(
        Theme(
            id = "noche",
            nombre = "Noche",
            plano = false,
            glass1 = 0.07,
            glass2 = 0.11,
            glass3 = 0.16,
            superficie1 = null,
            superficie2 = null,
            superficie3 = null,
            borde = rgba(255, 255, 255, 0.11),
            bordeFuerte = rgba(255, 255, 255, 0.2),
            texto = rgba(255, 255, 255),
            texto2 = rgba(255, 255, 255, 0.66),
            texto3 = rgba(255, 255, 255, 0.42),
            solido = rgba(244, 245, 247),
            sobreSolido = rgba(11, 12, 14),
            luzA = rgba(35, 38, 44),
            luzB = rgba(22, 24, 28),
            luzC = rgba(0, 0, 0),
            mancha1 = rgba(96, 108, 128, 0.5),
            mancha2 = rgba(210, 220, 236, 0.12),
            mancha3 = rgba(20, 22, 27, 0.9),
            fondoInicio = Offset(0.396f, 0.0109f),
            fondoFin = Offset(0.604f, 0.9891f),
            fondo =
                listOf(
                    0f to rgba(26, 29, 34),
                    0.52f to rgba(11, 12, 14),
                    1f to rgba(0, 0, 0),
                ),
            obra = null,
        ),
        Theme(
            id = "plata",
            nombre = "Plata",
            plano = false,
            glass1 = 0.19,
            glass2 = 0.16,
            glass3 = 0.24,
            superficie1 = null,
            superficie2 = null,
            superficie3 = null,
            borde = rgba(255, 255, 255, 0.22),
            bordeFuerte = rgba(255, 255, 255, 0.3),
            texto = rgba(250, 252, 252),
            texto2 = rgba(247, 250, 253, 0.65),
            texto3 = rgba(247, 250, 253, 0.57),
            solido = rgba(35, 34, 30),
            sobreSolido = rgba(247, 253, 253),
            luzA = rgba(170, 176, 183, 0.22),
            luzB = rgba(178, 183, 189, 0.14),
            luzC = rgba(59, 62, 70, 0.68),
            mancha1 = rgba(187, 193, 199, 0.2),
            mancha2 = rgba(182, 186, 193, 0.22),
            mancha3 = rgba(42, 45, 53, 0.7),
            fondoInicio = Offset(0.5f, 0f),
            fondoFin = Offset(0.5f, 1f),
            fondo =
                listOf(
                    0f to rgba(127, 132, 139),
                    0.22f to rgba(133, 138, 145),
                    0.6f to rgba(104, 108, 116),
                    1f to rgba(99, 102, 110),
                ),
            obra = null,
        ),
        Theme(
            id = "brasa",
            nombre = "Brasa",
            plano = false,
            glass1 = 0.09,
            glass2 = 0.14,
            glass3 = 0.2,
            superficie1 = null,
            superficie2 = null,
            superficie3 = null,
            borde = rgba(255, 255, 255, 0.13),
            bordeFuerte = rgba(255, 176, 150, 0.28),
            texto = rgba(255, 255, 255),
            texto2 = rgba(255, 236, 232, 0.7),
            texto3 = rgba(255, 236, 232, 0.45),
            solido = rgba(255, 87, 51),
            sobreSolido = rgba(255, 255, 255),
            luzA = rgba(82, 15, 19),
            luzB = rgba(44, 7, 9),
            luzC = rgba(18, 2, 3),
            mancha1 = rgba(255, 87, 51, 0.24),
            mancha2 = rgba(255, 190, 170, 0.1),
            mancha3 = rgba(60, 10, 13, 0.85),
            fondoInicio = Offset(0.396f, 0.0109f),
            fondoFin = Offset(0.604f, 0.9891f),
            fondo =
                listOf(
                    0f to rgba(59, 10, 12),
                    0.55f to rgba(30, 4, 5),
                    1f to rgba(11, 1, 2),
                ),
            obra = null,
        ),
        Theme(
            id = "pliegues",
            nombre = "Pliegues",
            plano = false,
            glass1 = 0.07,
            glass2 = 0.12,
            glass3 = 0.18,
            superficie1 = null,
            superficie2 = null,
            superficie3 = null,
            borde = rgba(255, 219, 199, 0.12),
            bordeFuerte = rgba(255, 186, 140, 0.3),
            texto = rgba(253, 244, 238),
            texto2 = rgba(253, 236, 226, 0.7),
            texto3 = rgba(253, 236, 226, 0.46),
            solido = rgba(223, 123, 71),
            sobreSolido = rgba(28, 10, 5),
            luzA = rgba(217, 221, 227),
            luzB = rgba(196, 201, 209),
            luzC = rgba(155, 162, 173),
            mancha1 = rgba(122, 131, 145, 0.55),
            mancha2 = rgba(232, 236, 241, 0.6),
            mancha3 = rgba(104, 112, 126, 0.5),
            fondoInicio = Offset(0.5f, 0f),
            fondoFin = Offset(0.5f, 1f),
            fondo = listOf(0f to rgba(0, 0, 0)),
            obra = R.drawable.fondo_pliegues,
        ),
        Theme(
            id = "electrico",
            nombre = "Eléctrico",
            plano = false,
            glass1 = 0.1,
            glass2 = 0.15,
            glass3 = 0.22,
            superficie1 = null,
            superficie2 = null,
            superficie3 = null,
            borde = rgba(214, 224, 255, 0.16),
            bordeFuerte = rgba(198, 212, 255, 0.34),
            texto = rgba(242, 245, 255),
            texto2 = rgba(234, 239, 255, 0.74),
            texto3 = rgba(234, 239, 255, 0.5),
            solido = rgba(229, 69, 135),
            sobreSolido = rgba(26, 2, 16),
            luzA = rgba(217, 221, 227),
            luzB = rgba(196, 201, 209),
            luzC = rgba(155, 162, 173),
            mancha1 = rgba(122, 131, 145, 0.55),
            mancha2 = rgba(232, 236, 241, 0.6),
            mancha3 = rgba(104, 112, 126, 0.5),
            fondoInicio = Offset(0.5f, 0f),
            fondoFin = Offset(0.5f, 1f),
            fondo = listOf(0f to rgba(0, 0, 0)),
            obra = R.drawable.fondo_electrico,
        ),
        Theme(
            id = "sieza",
            nombre = "SIEZA",
            plano = true,
            glass1 = 1.0,
            glass2 = 1.0,
            glass3 = 1.0,
            superficie1 = rgba(26, 29, 34),
            superficie2 = rgba(26, 29, 34),
            superficie3 = rgba(26, 29, 34),
            borde = rgba(133, 138, 145, 0.28),
            bordeFuerte = rgba(99, 102, 110),
            texto = rgba(244, 245, 247),
            texto2 = rgba(244, 245, 247, 0.76),
            texto3 = rgba(133, 138, 145),
            solido = rgba(255, 87, 51),
            sobreSolido = rgba(11, 12, 14),
            luzA = rgba(11, 12, 14),
            luzB = rgba(11, 12, 14),
            luzC = rgba(11, 12, 14),
            mancha1 = rgba(0, 0, 0, 0.0),
            mancha2 = rgba(0, 0, 0, 0.0),
            mancha3 = rgba(0, 0, 0, 0.0),
            fondoInicio = Offset(0.5f, 0f),
            fondoFin = Offset(0.5f, 1f),
            fondo = listOf(0f to rgba(11, 12, 14)),
            obra = null,
        ),
    )

/**
 * El degradado de fondo del tema. Las paradas de SwiftUI son fraccionarias
 * del alto y del ancho, así que acá hay que traducirlas a píxeles con el
 * tamaño real de la pantalla.
 */
internal fun Theme.fondoBrush(width: Float, height: Float): Brush =
    Brush.linearGradient(
        *fondo.toTypedArray(),
        start = Offset(width * fondoInicio.x, height * fondoInicio.y),
        end = Offset(width * fondoFin.x, height * fondoFin.y),
    )
