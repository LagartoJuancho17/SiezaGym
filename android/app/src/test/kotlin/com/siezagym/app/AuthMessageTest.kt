package com.siezagym.app

import com.google.firebase.auth.AuthErrorCodes
import com.google.firebase.auth.FirebaseAuthException
import org.junit.Assert.assertEquals
import org.junit.Test

class AuthMessageTest {
    private fun firebaseError(code: String): FirebaseAuthException = FirebaseAuthException(code, "msg")

    @Test
    fun traduceLosCodigosDeFirebaseAlCastellano() {
        assertEquals("Ese email no es válido.", readableAuthError(firebaseError(AuthErrorCodes.INVALID_EMAIL)))
        assertEquals("Ya hay una cuenta con ese email.", readableAuthError(firebaseError(AuthErrorCodes.EMAIL_ALREADY_IN_USE)))
        assertEquals("La contraseña necesita al menos 6 caracteres.", readableAuthError(firebaseError(AuthErrorCodes.WEAK_PASSWORD)))
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(AuthErrorCodes.WRONG_PASSWORD)))
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(AuthErrorCodes.INVALID_CREDENTIAL)))
        assertEquals("No encontramos una cuenta con ese email.", readableAuthError(firebaseError(AuthErrorCodes.USER_NOT_FOUND)))
        assertEquals("Sin conexión. Revisá internet.", readableAuthError(firebaseError(AuthErrorCodes.NETWORK_REQUEST_FAILED)))
        assertEquals("Demasiados intentos. Esperá un momento.", readableAuthError(firebaseError(AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER)))
    }

    @Test
    fun avisaCuandoLaCuentaYaExisteCreadaDeOtraForma() {
        assertEquals(
            "Ya tenés una cuenta con ese email creada de otra forma.",
            readableAuthError(firebaseError(AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL)),
        )
    }

    @Test
    fun unUsuarioDeshabilitadoEntraEnCredencialesIncorrectas() {
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(AuthErrorCodes.USER_DISABLED)))
    }

    @Test
    fun unCodigoDesconocidoCaeEnElMensajeGenerico() {
        assertEquals("Algo salió mal. Probá de nuevo.", readableAuthError(firebaseError("ERROR_ALGO_RARO")))
    }

    @Test
    fun unErrorDeOtroOrigenNoSeTraduce() {
        assertEquals("Algo salió mal. Probá de nuevo.", readableAuthError(IllegalStateException("no token")))
    }
}