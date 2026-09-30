package com.siezagym.app.Features.Onboarding

/**
 * Las tres escenas del recorrido de bienvenida.
 *
 * El recorrido es local al teléfono: no crea cuenta ni escribe en Firestore, y no se repite una
 * vez que la cuenta está creada. Vive en un valor puro para poder probar el avance sin pantalla.
 */
enum class OnboardingPage {
    RUTINAS,
    ENTRENO,
    PROGRESO,
    ;

    val eyebrow: String
        get() =
            when (this) {
                RUTINAS -> "BIENVENIDO A SIEZAGYM"
                ENTRENO -> "REGISTRÁ CADA ENTRENO"
                PROGRESO -> "MIRÁ TU AVANCE"
            }

    /** La parte fina del titular. */
    val headline: String
        get() =
            when (this) {
                RUTINAS -> "Entrená"
                ENTRENO -> "Cada serie"
                PROGRESO -> "Tu progreso"
            }

    /** La parte con peso, que va debajo en la misma línea. */
    val headlineEmphasis: String
        get() =
            when (this) {
                RUTINAS -> "a tu manera."
                ENTRENO -> "cuenta."
                PROGRESO -> "a la vista."
            }

    val detail: String
        get() =
            when (this) {
                RUTINAS -> "Armá tus rutinas con ejercicios y series a tu medida."
                ENTRENO ->
                    "Registrá peso y repeticiones mientras entrenás. Todo queda en tu historial."
                PROGRESO ->
                    "Seguí tu volumen y tus marcas. Si conectás Apple Salud, sumá pasos, distancia y calorías."
            }
}

/**
 * Dónde va el recorrido y qué botones hacen falta.
 *
 * `advance()` devuelve `true` sólo en la última pantalla: es la señal de "terminó", y de ahí
 * sale el cierre. Igual que en iOS.
 */
data class OnboardingFlow(val indice: Int = 0) {
    val page: OnboardingPage
        get() = OnboardingPage.entries[indice.coerceIn(0, OnboardingPage.entries.lastIndex)]

    val canGoBack: Boolean
        get() = indice > 0

    val isLastPage: Boolean
        get() = indice == OnboardingPage.entries.lastIndex

    fun goBack(): OnboardingFlow =
        if (canGoBack) copy(indice = indice - 1) else this

    /** `true` sólo cuando se pulsa continuar en la última pantalla. */
    fun advance(): Pair<OnboardingFlow, Boolean> {
        if (isLastPage) return this to true
        return copy(indice = indice + 1) to false
    }

    companion object {
        val primera = OnboardingFlow()
        val ultima = OnboardingFlow(OnboardingPage.entries.lastIndex)
    }
}
