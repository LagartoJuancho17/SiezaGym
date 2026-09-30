package com.siezagym.app.Domain

/**
 * Entrar o crear la cuenta. Las dos cosas viven en la misma pantalla, como en la web: son el mismo
 * formulario más dos campos.
 */
enum class AuthMode {
    ENTRAR,
    CREAR,
    ;

    /** La etiqueta de la pestaña. Las mismas palabras que la web. */
    val pestana: String
        get() =
            when (this) {
                ENTRAR -> "Iniciar sesión"
                CREAR -> "Crear cuenta"
            }

    val titulo: String
        get() =
            when (this) {
                ENTRAR -> "Bienvenido de nuevo"
                CREAR -> "Creá tu cuenta"
            }

    /** El botón que envía. */
    val accion: String
        get() =
            when (this) {
                ENTRAR -> "Ingresar"
                CREAR -> "Crear mi cuenta"
            }

    val conGoogle: String
        get() =
            when (this) {
                ENTRAR -> "Continuar con Google"
                CREAR -> "Registrarme con Google"
            }

    /**
     * Lo que va al servidor. Tiene que coincidir con lo que espera `/api/mfa/start`, que sólo
     * entiende "signin" y "signup".
     */
    val parametro: String
        get() =
            when (this) {
                ENTRAR -> "signin"
                CREAR -> "signup"
            }
}

/**
 * Lo que hay escrito en el formulario y si alcanza para enviarlo.
 *
 * Es un valor puro a propósito: las reglas de "esto está completo" se prueban sin pantalla y sin
 * red, y son las mismas que revisa el servidor.
 */
data class AuthForm(
    val modo: AuthMode = AuthMode.ENTRAR,
    val email: String = "",
    val password: String = "",
    val repetir: String = "",
    val nombre: String = "",
) {
    companion object {
        /** Seis caracteres, el mínimo de Firebase. */
        const val largoMinimoPassword = 6
    }

    /** Qué falta, en castellano y listo para mostrar. `null` es "está completo". */
    val problema: String?
        get() {
            // El aviso aparece cuando ya escribió algo en el segundo campo, no en la primera letra:
            // si no, dice "no coinciden" desde el primer carácter.
            if (modo != AuthMode.CREAR || repetir.isEmpty() || password == repetir) return null
            return "Las dos contraseñas no coinciden."
        }

    val puedeEnviar: Boolean
        get() {
            if (!emailValido || password.length < largoMinimoPassword) return false
            if (modo != AuthMode.CREAR) return true
            return password == repetir
        }

    /**
     * Un email con arroba y algo a cada lado. No valida más que eso: quién decide de verdad si
     * existe es el mail que llega.
     */
    val emailValido: Boolean
        get() {
            val limpio = email.trim()
            val arroba = limpio.indexOf('@')
            return arroba > 0 && arroba < limpio.length - 1 && !limpio.contains(' ')
        }

    /** El email como se manda: sin espacios y en minúsculas, igual que lo normaliza el servidor. */
    val emailNormalizado: String get() = email.trim().lowercase()

    val nombreLimpio: String get() = nombre.trim()

    /**
     * Al cambiar de pestaña se limpian las contraseñas, no el email: es el mismo de todos modos y
     * volver a escribirlo es la parte molesta.
     */
    fun cambiarA(otro: AuthMode): AuthForm =
        if (otro == modo) this
        else copy(modo = otro, password = "", repetir = "")
}

/**
 * El código de seis dígitos que llega por mail.
 *
 * Las mismas reglas que `limpiarCodigo` en `lib/mfa/challenge.js`: sólo dígitos, y seis.
 */
data class CodigoMFA(val entrada: String = "") {
    companion object {
        const val largo = 6

        /**
         * Se queda con los dígitos y corta en seis.
         *
         * Pegar "Tu código es 123456." tiene que funcionar: el usuario copia del mail y se lleva el
         * texto de alrededor.
         */
        fun limpiar(entrada: String): String {
            // ASCII y no `isDigit`: un dígito índigo pasaría el filtro acá y no en el servidor.
            return entrada.filter { it.isDigit() && it.code < 128 }.take(largo)
        }
    }

    val digitos: String get() = limpiar(entrada)

    val completo: Boolean get() = digitos.length == largo

    val faltan: Int get() = maxOf(0, largo - digitos.length)
}
