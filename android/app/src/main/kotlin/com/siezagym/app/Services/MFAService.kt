package com.siezagym.app.Services

import android.util.Log
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.CodigoMFA
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject

/**
 * El segundo factor: el código de seis números que llega por mail.
 *
 * El servidor es el mismo de la web (`/api/mfa/start` y `/api/mfa/verify`), así que el desafío se
 * puede pedir desde cualquiera de los tres clientes y seguir en otro.
 */
class MFAService(private val base: String = PRODUCCION) {

    /** Un desafío abierto: su id, cuánto vive y si el código salió por consola. */
    data class Desafio(val id: String, val venceEnSegundos: Int, val porConsola: Boolean)

    /**
     * Paso 1: comprueba la contraseña contra el servidor y hace que salga el mail.
     *
     * No crea ninguna sesión, y ése es el punto: con la contraseña correcta y sin el código, la app
     * sigue afuera.
     */
    suspend fun iniciar(form: AuthForm): Desafio {
        val cuerpo =
            JSONObject()
                .put("email", form.emailNormalizado)
                .put("password", form.password)
                .put("modo", form.modo.parametro)
                .put("displayName", form.nombreLimpio)
        val respuesta = pedir("/api/mfa/start", cuerpo)
        return Desafio(
            id = respuesta.getString("desafio"),
            venceEnSegundos = respuesta.optInt("venceEnSegundos", 600),
            porConsola = respuesta.optString("transporte") == "consola",
        )
    }

    /**
     * Paso 2: canjea el código por un custom token. Recién con ese token Firebase abre la sesión.
     */
    suspend fun verificar(desafio: String, codigo: CodigoMFA): String =
        pedir(
                "/api/mfa/verify",
                JSONObject().put("desafio", desafio).put("codigo", codigo.digitos),
            )
            .getString("token")

    private suspend fun pedir(ruta: String, cuerpo: JSONObject): JSONObject =
        withContext(Dispatchers.IO) {
            val conexion =
                try {
                    (URL(base + ruta).openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 20_000
                        readTimeout = 20_000
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json")
                    }
                } catch (e: IOException) {
                    Log.w(TAG, "mfa sin red: ${e.message}")
                    throw MFAError(motivo = "red", message = "Sin conexión. Revisá internet.")
                }

            try {
                conexion.outputStream.use { it.write(cuerpo.toString().toByteArray()) }
                val codigo = conexion.responseCode
                val texto =
                    (if (codigo in 200..299) conexion.inputStream else conexion.errorStream)
                        ?.bufferedReader()
                        ?.use { it.readText() }
                        ?: ""
                if (codigo !in 200..299) {
                    val fallo = leerError(texto)
                    Log.w(TAG, "mfa $codigo: ${fallo?.motivo ?: "sin motivo"}")
                    throw fallo ?: MFAError(motivo = "servidor", message = "El servidor no respondió bien. Probá de nuevo.")
                }
                try {
                    JSONObject(texto)
                } catch (e: JSONException) {
                    Log.w(TAG, "mfa respuesta ilegible: ${e.message}")
                    throw MFAError(
                        motivo = "formato",
                        message = "El servidor contestó algo que no entendimos.",
                    )
                }
            } finally {
                conexion.disconnect()
            }
        }

    private fun leerError(texto: String): MFAError? =
        runCatching {
            val json = JSONObject(texto)
            val motivo = json.optString("motivo", "servidor")
            val mensaje =
                json.optString("mensaje").takeIf { it.isNotBlank() }
                    ?: "El servidor no respondió bien. Probá de nuevo."
            MFAError(
                motivo = motivo,
                message = mensaje,
                restantes = if (json.has("restantes")) json.optInt("restantes") else null,
            )
        }
            .getOrNull()

    companion object {
        private const val TAG = "MFAService"

        const val PRODUCCION = "https://sieza-gym.vercel.app"
    }
}

/**
 * Un fallo del servidor del MFA, con el motivo por el que conviene pedir otro código en vez de
 * insistir con el mismo.
 */
class MFAError(val motivo: String, override val message: String, val restantes: Int? = null) :
    Exception(message) {

    val hayQuePedirOtro: Boolean
        get() = motivo in listOf("vencido", "quemado", "inexistente")
}
