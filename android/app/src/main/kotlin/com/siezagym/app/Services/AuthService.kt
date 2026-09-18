package com.siezagym.app.Services

import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.firebase.auth.AuthErrorCodes
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

/** Sesión del usuario. Envuelve FirebaseAuth y expone solo lo que la UI necesita. */
class AuthService(private val appContext: Context) {
    private val auth = FirebaseAuth.getInstance()
    private val repository = GymRepository()

    sealed interface State {
        data object Loading : State
        data object SignedOut : State
        data class SignedIn(val uid: String, val email: String?) : State
    }

    private val _state = MutableStateFlow<State>(State.Loading)
    private val _errorMessage = MutableStateFlow<String?>(null)
    private val _isWorking = MutableStateFlow(false)

    val state: StateFlow<State> = _state.asStateFlow()
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    val isWorking: StateFlow<Boolean> = _isWorking.asStateFlow()

    init {
        auth.addAuthStateListener { firebaseAuth ->
            val user = firebaseAuth.currentUser
            _state.value = if (user != null) State.SignedIn(user.uid, user.email) else State.SignedOut
        }
    }

    val uid: String?
        get() = (_state.value as? State.SignedIn)?.uid

    // MARK: - Email / Contraseña

    suspend fun signIn(email: String, password: String) = attempt {
        val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
        repository.ensureProfile(
            uid = result.user.uid,
            email = result.user.email,
            displayName = result.user.displayName,
            photoUrl = result.user.photoUrl?.toString(),
            provider = "password",
        )
    }

    suspend fun signUp(email: String, password: String, displayName: String) = attempt {
        val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
        val name = displayName.trim()
        if (name.isNotEmpty()) {
            result.user.updateProfile(
                UserProfileChangeRequest.Builder().setDisplayName(name).build()
            ).await()
        }
        repository.ensureProfile(
            uid = result.user.uid,
            email = result.user.email,
            displayName = name.ifEmpty { null },
            photoUrl = result.user.photoUrl?.toString(),
            provider = "password",
        )
    }

    // MARK: - Google

    /** El intent del flujo de Google. Sin `default_web_client_id` (falta la
     *  config de Firebase) devuelve null y la UI muestra cómo generarla. */
    fun googleSignInIntent(): Intent? {
        val webClientId = stringByIdentifier("default_web_client_id") ?: return null
        val client = googleClient(webClientId)
        return client.signInIntent
    }

    /** Termina el flujo de Google con el resultado que devolvió la Activity.
     *  Termina en la misma cuenta de Firebase que usa la web: si entraste con
     *  Google en sieza-gym.vercel.app, es el mismo uid. */
    suspend fun completeGoogleSignIn(data: Intent?) = attempt {
        val account: GoogleSignInAccount = try {
            GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException::class.java)
        } catch (e: ApiException) {
            if (e.statusCode == CommonStatusCodes.SIGN_IN_CANCELLED) throw GoogleCanceledException()
            throw e
        }

        val idToken = account.idToken
            ?: throw IllegalStateException("Google no devolvió el token de la cuenta.")
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = auth.signInWithCredential(credential).await()

        // La web crea el perfil del lado del servidor al iniciar sesión; en
        // Android no hay servidor, así que lo hace la app con los mismos campos.
        repository.ensureProfile(
            uid = result.user.uid,
            email = result.user.email,
            displayName = result.user.displayName,
            photoUrl = result.user.photoUrl?.toString(),
            provider = "google.com",
        )
    }

    // MARK: - Cerrar sesión

    fun signOut() {
        // Sin esto Google recuerda la cuenta y el próximo login entra solo, sin
        // dejar elegir otra. El cierre de Google corre async y no bloquea el de
        // Firebase: fallar ahí no debería impedir salir.
        webClientIdOrNull()?.let { googleClient(it).signOut().addOnFailureListener { } }
        try {
            auth.signOut()
            _errorMessage.value = null
        } catch (e: Exception) {
            Log.w(TAG, "signOut fallo: ${e.message}")
            _errorMessage.value = "No se pudo cerrar la sesión."
        }
    }

    fun clearError() { _errorMessage.value = null }

    // MARK: - Implementación

    /** El usuario cerró la ventana de Google a propósito: no es un error. */
    private class GoogleCanceledException : RuntimeException()

    private suspend fun attempt(block: suspend () -> Unit) {
        _isWorking.value = true
        _errorMessage.value = null
        try {
            block()
        } catch (e: GoogleCanceledException) {
            // Silencioso.
        } catch (e: Exception) {
            Log.w(TAG, "auth fallo: ${e.message}")
            _errorMessage.value = readableAuthError(e)
        } finally {
            _isWorking.value = false
        }
    }

    private fun stringByIdentifier(name: String): String? {
        val id = appContext.resources.getIdentifier(name, "string", appContext.packageName)
        return if (id == 0) null else appContext.getString(id)
    }

    private val webClientIdOrNull: String?
        get() = stringByIdentifier("default_web_client_id")

    private fun googleClient(webClientId: String): GoogleSignInClient {
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
        return GoogleSignIn.getClient(appContext, options)
    }

    companion object {
        private const val TAG = "AuthService"
    }
}

/** Los mensajes de FirebaseAuth vienen en inglés y son técnicos. Función pura:
 *  así los unit tests la prueban sin necesidad de una sesión real. */
internal fun readableAuthError(error: Exception): String {
    return when (error) {
        is FirebaseAuthException -> when (error.errorCode) {
            AuthErrorCodes.INVALID_EMAIL -> "Ese email no es válido."
            AuthErrorCodes.EMAIL_ALREADY_IN_USE -> "Ya hay una cuenta con ese email."
            AuthErrorCodes.WEAK_PASSWORD -> "La contraseña necesita al menos 6 caracteres."
            AuthErrorCodes.WRONG_PASSWORD,
            AuthErrorCodes.INVALID_CREDENTIAL,
            AuthErrorCodes.USER_DISABLED,
            -> "Email o contraseña incorrectos."
            AuthErrorCodes.USER_NOT_FOUND -> "No encontramos una cuenta con ese email."
            AuthErrorCodes.NETWORK_REQUEST_FAILED -> "Sin conexión. Revisá internet."
            AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER -> "Demasiados intentos. Esperá un momento."
            AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL ->
                "Ya tenés una cuenta con ese email creada de otra forma."
            else -> "Algo salió mal. Probá de nuevo."
        }
        else -> "Algo salió mal. Probá de nuevo."
    }
}