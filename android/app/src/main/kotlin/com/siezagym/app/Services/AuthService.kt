package com.siezagym.app.Services

import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes
import com.google.android.gms.common.api.ApiException
import com.siezagym.app.Domain.AuthForm
import com.siezagym.app.Domain.CodigoMFA
import com.siezagym.app.Features.Workout.WorkoutNotification
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

/** Sesión del usuario. Envuelve FirebaseAuth y expone solo lo que la UI necesita. */
class AuthService(private val appContext: Context) : MFAHost {
    private val auth = FirebaseAuth.getInstance()
    private val repository = GymRepository()
    private val authScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    sealed interface State {
        data object Loading : State

        data object SignedOut : State

        data class SignedIn(val uid: String, val email: String?) : State
    }

    private val _state = MutableStateFlow<State>(State.Loading)
    private val _errorMessage = MutableStateFlow<String?>(null)
    private val _isWorking = MutableStateFlow(false)

    val state: StateFlow<State> = _state.asStateFlow()
    override val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    override val isWorking: StateFlow<Boolean> = _isWorking.asStateFlow()

    init {
        auth.addAuthStateListener { firebaseAuth ->
            if (_isWorking.value) return@addAuthStateListener
            val user = firebaseAuth.currentUser
            _state.value =
                if (user != null) State.SignedIn(user.uid, user.email) else State.SignedOut
        }
    }

    val uid: String?
        get() = (_state.value as? State.SignedIn)?.uid

    // MARK: - Email / Contraseña

    /**
     * El proveedor del segundo factor. Se puede cambiar en los tests.
     */
    var mfa: MFAService = MFAService()

    /**
     * Paso 1 del login con código: comprueba la contraseña contra el servidor y hace que salga el
     * mail. No crea sesión; con la contraseña correcta y sin el código, la app sigue afuera.
     *
     * Devuelve `null` si algo falló; el motivo queda en [errorMessage].
     */
    override suspend fun pedirCodigo(form: AuthForm): MFAService.Desafio? = attempt { mfa.iniciar(form) }

    /**
     * Paso 2: canjea el código por la sesión. El servidor devuelve un custom token y recién con
     * eso Firebase abre la sesión. El listener de [init] se encarga del resto.
     */
    override suspend fun entrarConCodigo(desafio: String, codigo: CodigoMFA): Boolean {
        val token = attempt { mfa.verificar(desafio, codigo) } ?: return false
        val entro =
            attempt {
                auth.signInWithCustomToken(token).await()
                val user = auth.currentUser
                if (user != null)
                    repository.ensureProfile(
                        uid = user.uid,
                        email = user.email,
                        displayName = user.displayName,
                        photoUrl = user.photoUrl?.toString(),
                        provider = "password",
                    )
            }
        return entro != null
    }

    suspend fun signIn(email: String, password: String) = attempt {
        val user =
            auth.signInWithEmailAndPassword(email.trim(), password).await().user
                ?: throw IllegalStateException("Firebase no devolvió el usuario.")
        repository.ensureProfile(
            uid = user.uid,
            email = user.email,
            displayName = user.displayName,
            photoUrl = user.photoUrl?.toString(),
            provider = "password",
        )
    }

    suspend fun signUp(email: String, password: String, displayName: String) = attempt {
        val user =
            auth.createUserWithEmailAndPassword(email.trim(), password).await().user
                ?: throw IllegalStateException("Firebase no devolvió el usuario.")
        val name = displayName.trim()
        if (name.isNotEmpty()) {
            user
                .updateProfile(UserProfileChangeRequest.Builder().setDisplayName(name).build())
                .await()
        }
        repository.ensureProfile(
            uid = user.uid,
            email = user.email,
            displayName = name.ifEmpty { null },
            photoUrl = user.photoUrl?.toString(),
            provider = "password",
        )
    }

    // MARK: - Google

    /**
     * El intent del flujo de Google. Sin `default_web_client_id` (falta la config de Firebase)
     * devuelve null y la UI muestra cómo generarla.
     */
    fun googleSignInIntent(): Intent? {
        val webClientId = stringByIdentifier("default_web_client_id") ?: return null
        return googleClient(webClientId).signInIntent
    }

    /**
     * Termina el flujo de Google con el resultado que devolvió la Activity. Termina en la misma
     * cuenta de Firebase que usa la web: si entraste con Google en sieza-gym.vercel.app, es el
     * mismo uid.
     */
    suspend fun completeGoogleSignIn(data: Intent?) = attempt {
        val account: GoogleSignInAccount =
            try {
                GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException::class.java)
            } catch (e: ApiException) {
                if (e.statusCode == GoogleSignInStatusCodes.SIGN_IN_CANCELLED)
                    throw GoogleCanceledException()
                throw e
            }

        val idToken =
            account.idToken
                ?: throw IllegalStateException("Google no devolvió el token de la cuenta.")
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val user =
            auth.signInWithCredential(credential).await().user
                ?: throw IllegalStateException("Firebase no devolvió el usuario.")

        // La web crea el perfil del lado del servidor al iniciar sesión; en
        // Android no hay servidor, así que lo hace la app con los mismos campos.
        repository.ensureProfile(
            uid = user.uid,
            email = user.email,
            displayName = user.displayName,
            photoUrl = user.photoUrl?.toString(),
            provider = "google.com",
        )
    }

    // MARK: - Cerrar sesión

    fun signOut() {
        // El widget no puede seguir mostrando la racha del usuario anterior.
        WidgetBridge.limpiar(appContext)
        // La notificación del entrenamiento tampoco: si quedó en standby, se va con la sesión.
        WorkoutNotification.cancelar(appContext)
        // Sin esto Google recuerda la cuenta y el próximo login entra solo, sin
        // dejar elegir otra. El cierre de Google corre async y no bloquea el de
        // Firebase: fallar ahí no debería impedir salir.
        webClientIdOrNull?.let { googleClient(it).signOut().addOnFailureListener {} }
        try {
            auth.signOut()
            _errorMessage.value = null
        } catch (e: Exception) {
            Log.w(TAG, "signOut fallo: ${e.message}")
            _errorMessage.value = "No se pudo cerrar la sesión."
        }
    }

    override fun clearError() {
        _errorMessage.value = null
    }

    // MARK: - Implementación

    /** El usuario cerró la ventana de Google a propósito: no es un error. */
    private class GoogleCanceledException : RuntimeException()

    private suspend fun <T> attempt(block: suspend () -> T): T? =
        withContext(authScope.coroutineContext) {
            _isWorking.value = true
            _errorMessage.value = null
            try {
                val resultado = block()
                val user = auth.currentUser
                _state.value =
                    if (user != null) State.SignedIn(user.uid, user.email) else State.SignedOut
                resultado
            } catch (e: CancellationException) {
                throw e
            } catch (e: GoogleCanceledException) {
                // Silencioso.
                null
            } catch (e: Exception) {
                Log.w(TAG, "auth fallo: ${e.message}")
                _errorMessage.value = readableAuthError(e)
                null
            } finally {
                _isWorking.value = false
            }
        }

    private fun stringByIdentifier(name: String): String? {
        val id = appContext.resources.getIdentifier(name, "string", appContext.packageName)
        return if (id == 0) null else appContext.getString(id).takeIf { it.isNotBlank() }
    }

    private val webClientIdOrNull: String?
        get() = stringByIdentifier("default_web_client_id")

    private fun googleClient(webClientId: String): GoogleSignInClient {
        val options =
            GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .build()
        return GoogleSignIn.getClient(appContext, options)
    }

    companion object {
        private const val TAG = "AuthService"
    }
}

/**
 * Los mensajes de FirebaseAuth vienen en inglés y son técnicos. Función pura: así los unit tests la
 * prueban sin necesidad de una sesión real.
 */
internal fun readableAuthError(error: Exception): String {
    return when (error) {
        is MFAError -> error.message
        is FirebaseAuthUserCollisionException ->
            when (error.errorCode) {
                CODE_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL,
                "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL" ->
                    "Ya tenés una cuenta con ese email creada de otra forma."
                else -> "Ya hay una cuenta con ese email."
            }
        is FirebaseAuthWeakPasswordException -> "La contraseña necesita al menos 6 caracteres."
        is FirebaseAuthInvalidCredentialsException ->
            when (error.errorCode) {
                CODE_INVALID_EMAIL,
                "INVALID_EMAIL" -> "Ese email no es válido."
                else -> "Email o contraseña incorrectos."
            }
        is FirebaseAuthInvalidUserException ->
            when (error.errorCode) {
                CODE_USER_DISABLED,
                "USER_DISABLED" -> "Email o contraseña incorrectos."
                else -> "No encontramos una cuenta con ese email."
            }
        is FirebaseAuthException ->
            when (error.errorCode) {
                CODE_INVALID_EMAIL,
                "INVALID_EMAIL" -> "Ese email no es válido."
                CODE_EMAIL_ALREADY_IN_USE,
                "EMAIL_ALREADY_IN_USE" -> "Ya hay una cuenta con ese email."
                CODE_WEAK_PASSWORD,
                "WEAK_PASSWORD" -> "La contraseña necesita al menos 6 caracteres."
                CODE_WRONG_PASSWORD,
                CODE_INVALID_CREDENTIAL,
                CODE_USER_DISABLED,
                "WRONG_PASSWORD",
                "INVALID_CREDENTIAL",
                "INVALID_LOGIN_CREDENTIALS",
                "ERROR_INVALID_LOGIN_CREDENTIALS",
                "USER_DISABLED" -> "Email o contraseña incorrectos."
                CODE_USER_NOT_FOUND,
                "USER_NOT_FOUND" -> "No encontramos una cuenta con ese email."
                CODE_NETWORK_REQUEST_FAILED,
                "NETWORK_REQUEST_FAILED" -> "Sin conexión. Revisá internet."
                CODE_TOO_MANY_ATTEMPTS,
                "TOO_MANY_ATTEMPTS_TRY_LATER" -> "Demasiados intentos. Esperá un momento."
                CODE_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL,
                "ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL" ->
                    "Ya tenés una cuenta con ese email creada de otra forma."
                else -> "Algo salió mal. Probá de nuevo."
            }
        else -> "Algo salió mal. Probá de nuevo."
    }
}

internal const val CODE_INVALID_EMAIL = "ERROR_INVALID_EMAIL"
internal const val CODE_EMAIL_ALREADY_IN_USE = "ERROR_EMAIL_ALREADY_IN_USE"
internal const val CODE_WEAK_PASSWORD = "ERROR_WEAK_PASSWORD"
internal const val CODE_WRONG_PASSWORD = "ERROR_WRONG_PASSWORD"
internal const val CODE_INVALID_CREDENTIAL = "ERROR_INVALID_CREDENTIAL"
internal const val CODE_USER_DISABLED = "ERROR_USER_DISABLED"
internal const val CODE_USER_NOT_FOUND = "ERROR_USER_NOT_FOUND"
internal const val CODE_NETWORK_REQUEST_FAILED = "ERROR_NETWORK_REQUEST_FAILED"
internal const val CODE_TOO_MANY_ATTEMPTS = "ERROR_TOO_MANY_ATTEMPTS_TRY_LATER"
internal const val CODE_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL =
    "ERROR_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL"
