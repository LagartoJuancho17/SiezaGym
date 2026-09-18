// GENERADO por android/scripts/sync-theme.mjs — no editar a mano.
//
// Los colores salen de app/design2.css, que es la fuente de verdad de los dos
// clientes. Si cambia un tema en la web, correr:
//
//     node android/scripts/sync-theme.mjs --css ../SiezaGym/app/design2.css
//
// Temas encontrados: noche, plata, brasa, pliegues, electrico

package com.siezagym.app.DesignSystem

import androidx.compose.ui.graphics.Color

/** El tema elegido por defecto cuando no hay preferencia guardada. */
val TemaPorDefecto: D2Theme = TemasTokens.firstOrNull { it.id == "plata" } ?: TemasTokens[0]

/** Todos los temas del diseño, en el mismo orden que el selector de la web. */
val TemasTokens: List<D2Theme> = listOf(
    D2Theme(
        id = "noche",
        nombre = "Noche",
        glass1 = 0.07f,
        glass2 = 0.11f,
        glass3 = 0.16f,
        borde = Color(255, 255, 255, 28),
        bordeFuerte = Color(255, 255, 255, 51),
        texto = Color(255, 255, 255, 255),
        texto2 = Color(255, 255, 255, 168),
        texto3 = Color(255, 255, 255, 107),
        solido = Color(244, 245, 247, 255),
        sobreSolido = Color(11, 12, 14, 255),
        luzA = Color(35, 38, 44, 255),
        luzB = Color(22, 24, 28, 255),
        luzC = Color(0, 0, 0, 255),
        mancha1 = Color(96, 108, 128, 128),
        mancha2 = Color(210, 220, 236, 31),
        mancha3 = Color(20, 22, 27, 230),
        fondoInicio = 0.3960f to 0.0109f,
        fondoFin = 0.6040f to 0.9891f,
        fondo = listOf(
        ColorStop(Color(26, 29, 34, 255), 0.000f),
        ColorStop(Color(11, 12, 14, 255), 0.520f),
        ColorStop(Color(0, 0, 0, 255), 1.000f)
        ),
        obra = null
    ),
    D2Theme(
        id = "plata",
        nombre = "Plata",
        glass1 = 0.19f,
        glass2 = 0.16f,
        glass3 = 0.24f,
        borde = Color(255, 255, 255, 56),
        bordeFuerte = Color(255, 255, 255, 77),
        texto = Color(250, 252, 252, 255),
        texto2 = Color(247, 250, 253, 166),
        texto3 = Color(247, 250, 253, 145),
        solido = Color(35, 34, 30, 255),
        sobreSolido = Color(247, 253, 253, 255),
        luzA = Color(170, 176, 183, 56),
        luzB = Color(178, 183, 189, 36),
        luzC = Color(59, 62, 70, 173),
        mancha1 = Color(187, 193, 199, 51),
        mancha2 = Color(182, 186, 193, 56),
        mancha3 = Color(42, 45, 53, 179),
        fondoInicio = 0.5000f to 0.0000f,
        fondoFin = 0.5000f to 1.0000f,
        fondo = listOf(
        ColorStop(Color(127, 132, 139, 255), 0.000f),
        ColorStop(Color(133, 138, 145, 255), 0.220f),
        ColorStop(Color(104, 108, 116, 255), 0.600f),
        ColorStop(Color(99, 102, 110, 255), 1.000f)
        ),
        obra = null
    ),
    D2Theme(
        id = "brasa",
        nombre = "Brasa",
        glass1 = 0.09f,
        glass2 = 0.14f,
        glass3 = 0.2f,
        borde = Color(255, 255, 255, 33),
        bordeFuerte = Color(255, 176, 150, 71),
        texto = Color(255, 255, 255, 255),
        texto2 = Color(255, 236, 232, 179),
        texto3 = Color(255, 236, 232, 115),
        solido = Color(255, 87, 51, 255),
        sobreSolido = Color(255, 255, 255, 255),
        luzA = Color(82, 15, 19, 255),
        luzB = Color(44, 7, 9, 255),
        luzC = Color(18, 2, 3, 255),
        mancha1 = Color(255, 87, 51, 61),
        mancha2 = Color(255, 190, 170, 26),
        mancha3 = Color(60, 10, 13, 217),
        fondoInicio = 0.3960f to 0.0109f,
        fondoFin = 0.6040f to 0.9891f,
        fondo = listOf(
        ColorStop(Color(59, 10, 12, 255), 0.000f),
        ColorStop(Color(30, 4, 5, 255), 0.550f),
        ColorStop(Color(11, 1, 2, 255), 1.000f)
        ),
        obra = null
    ),
    D2Theme(
        id = "pliegues",
        nombre = "Pliegues",
        glass1 = 0.07f,
        glass2 = 0.12f,
        glass3 = 0.18f,
        borde = Color(255, 219, 199, 31),
        bordeFuerte = Color(255, 186, 140, 77),
        texto = Color(253, 244, 238, 255),
        texto2 = Color(253, 236, 226, 179),
        texto3 = Color(253, 236, 226, 117),
        solido = Color(223, 123, 71, 255),
        sobreSolido = Color(28, 10, 5, 255),
        luzA = Color(217, 221, 227, 255),
        luzB = Color(196, 201, 209, 255),
        luzC = Color(155, 162, 173, 255),
        mancha1 = Color(122, 131, 145, 140),
        mancha2 = Color(232, 236, 241, 153),
        mancha3 = Color(104, 112, 126, 128),
        fondoInicio = 0.5000f to 0.0000f,
        fondoFin = 0.5000f to 1.0000f,
        fondo = listOf(
        ColorStop(Color(0, 0, 0, 255), 0f)
        ),
        obra = "pliegues"
    ),
    D2Theme(
        id = "electrico",
        nombre = "Eléctrico",
        glass1 = 0.1f,
        glass2 = 0.15f,
        glass3 = 0.22f,
        borde = Color(214, 224, 255, 41),
        bordeFuerte = Color(198, 212, 255, 87),
        texto = Color(242, 245, 255, 255),
        texto2 = Color(234, 239, 255, 189),
        texto3 = Color(234, 239, 255, 128),
        solido = Color(229, 69, 135, 255),
        sobreSolido = Color(26, 2, 16, 255),
        luzA = Color(217, 221, 227, 255),
        luzB = Color(196, 201, 209, 255),
        luzC = Color(155, 162, 173, 255),
        mancha1 = Color(122, 131, 145, 140),
        mancha2 = Color(232, 236, 241, 153),
        mancha3 = Color(104, 112, 126, 128),
        fondoInicio = 0.5000f to 0.0000f,
        fondoFin = 0.5000f to 1.0000f,
        fondo = listOf(
        ColorStop(Color(0, 0, 0, 255), 0f)
        ),
        obra = "electrico"
    )
)
