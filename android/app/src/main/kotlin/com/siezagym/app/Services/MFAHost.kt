package com.siezagym.app.Services

import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.CodigoMFA
import kotlinx.coroutines.flow.StateFlow

/**
 * Lo que el formulario y la pantalla del código necesitan del servicio de sesión.
 *
 * Existe para que la UI no dependa de Firebase: la regla del segundo factor se puede probar entera
 * — que la contraseña sola no entra, que el código completo sí, que un código malo sacude y limpia —
 * sin una sesión de verdad ni una sola llamada de red.
 */
interface MFAHost {
    val isWorking: StateFlow<Boolean>

    val errorMessage: StateFlow<String?>

    /**
     * Paso 1: comprueba la contraseña contra el servidor y hace que salga el mail. No crea sesión.
     *
     * Devuelve `null` si algo falló; el motivo queda en [errorMessage].
     */
    suspend fun pedirCodigo(form: AuthForm): MFAService.Desafio?

    /**
     * Paso 2: canjea el código por la sesión. `true` si entró.
     */
    suspend fun entrarConCodigo(desafio: String, codigo: CodigoMFA): Boolean

    fun clearError()
}
