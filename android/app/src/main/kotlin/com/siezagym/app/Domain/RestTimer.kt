package com.siezagym.app.Domain

/**
 * El descanso entre series.
 *
 * Vive acá y no dentro de la vista porque son reglas, no dibujo: cuánto arranca, cómo baja, dónde
 * corta. Metido en la pantalla no se podía probar ninguna sin abrir la app y esperar un minuto y
 * medio.
 */
data class RestTimer(val restantes: Int? = null) {
    companion object {
        /**
         * Lo que arranca al marcar una serie.
         *
         * **No es `RoutineSummary.secondsPerRest` (75) a propósito.** Ese número es el de la web y
         * sólo sirve para estimar cuánto dura una rutina; los dos clientes tienen que decir lo
         * mismo. Este es el descanso real que propone la app.
         */
        const val POR_DEFECTO = 90

        /** Cuánto suma y resta cada botón. */
        const val PASO_MENOS = 15
        const val PASO_MAS = 30
    }

    val corriendo: Boolean get() = (restantes ?: 0) > 0

    /** Texto del reloj, "01:30". */
    val texto: String
        get() {
            val segundos = maxOf(0, restantes ?: 0)
            return "%02d:%02d".format(java.util.Locale.ROOT, segundos / 60, segundos % 60)
        }

    fun arrancar(segundos: Int = POR_DEFECTO) = copy(restantes = maxOf(1, segundos))

    fun saltar() = copy(restantes = null)

    /**
     * Restar nunca lleva a cero: si quedan 10 segundos y tocás −15, el descanso no se termina solo,
     * se termina cuando vos lo saltás.
     */
    fun restar(segundos: Int = PASO_MENOS): RestTimer {
        val actual = restantes ?: return this
        return copy(restantes = maxOf(1, actual - segundos))
    }

    fun sumar(segundos: Int = PASO_MAS): RestTimer {
        val actual = restantes ?: return this
        return copy(restantes = actual + segundos)
    }

    /**
     * Un segundo menos. Devuelve `true` sólo en el segundo en que el descanso se termina, que es
     * cuando hay que sonar el aviso: si devolviera `true` mientras está en cero, sonaría en loop.
     */
    fun tick(): Pair<RestTimer, Boolean> {
        val actual = restantes ?: return this to false
        if (actual <= 1) return copy(restantes = null) to true
        return copy(restantes = actual - 1) to false
    }
}
