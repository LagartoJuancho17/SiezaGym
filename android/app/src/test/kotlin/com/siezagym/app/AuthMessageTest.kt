package com.siezagym.app

import com.google.firebase.auth.FirebaseAuthException
import com.siezagym.app.Services.CODE_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL
import com.siezagym.app.Services.CODE_EMAIL_ALREADY_IN_USE
import com.siezagym.app.Services.CODE_INVALID_CREDENTIAL
import com.siezagym.app.Services.CODE_INVALID_EMAIL
import com.siezagym.app.Services.CODE_NETWORK_REQUEST_FAILED
import com.siezagym.app.Services.CODE_TOO_MANY_ATTEMPTS
import com.siezagym.app.Services.CODE_USER_DISABLED
import com.siezagym.app.Services.CODE_USER_NOT_FOUND
import com.siezagym.app.Services.CODE_WEAK_PASSWORD
import com.siezagym.app.Services.CODE_WRONG_PASSWORD
import com.siezagym.app.Services.readableAuthError
import org.junit.Assert.assertEquals
import org.junit.Test

class AuthMessageTest {
    private fun firebaseError(code: String): FirebaseAuthException = FirebaseAuthException(code, "msg")

    @Test
    fun traduceLosCodigosDeFirebaseAlCastellano() {
        assertEquals("Ese email no es válido.", readableAuthError(firebaseError(CODE_INVALID_EMAIL)))
        assertEquals("Ya hay una cuenta con ese email.", readableAuthError(firebaseError(CODE_EMAIL_ALREADY_IN_USE)))
        assertEquals("La contraseña necesita al menos 6 caracteres.", readableAuthError(firebaseError(CODE_WEAK_PASSWORD)))
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(CODE_WRONG_PASSWORD)))
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(CODE_INVALID_CREDENTIAL)))
        assertEquals("No encontramos una cuenta con ese email.", readableAuthError(firebaseError(CODE_USER_NOT_FOUND)))
        assertEquals("Sin conexión. Revisá internet.", readableAuthError(firebaseError(CODE_NETWORK_REQUEST_FAILED)))
        assertEquals("Demasiados intentos. Esperá un momento.", readableAuthError(firebaseError(CODE_TOO_MANY_ATTEMPTS)))
    }

    @Test
    fun avisaCuandoLaCuentaYaExisteCreadaDeOtraForma() {
        assertEquals(
            "Ya tenés una cuenta con ese email creada de otra forma.",
            readableAuthError(firebaseError(CODE_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL)),
        )
    }

    @Test
    fun unUsuarioDeshabilitadoEntraEnCredencialesIncorrectas() {
        assertEquals("Email o contraseña incorrectos.", readableAuthError(firebaseError(CODE_USER_DISABLED)))
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