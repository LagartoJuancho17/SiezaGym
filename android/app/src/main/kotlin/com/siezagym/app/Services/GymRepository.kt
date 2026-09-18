package com.siezagym.app.Services

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.RoutineDraftValidation
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.LoggedSet
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Models.firestoreMap
import kotlinx.coroutines.tasks.await
import java.time.Instant
import java.util.Date

/** Acceso a Firestore. Es el mismo proyecto y las mismas colecciones que usa la
 *  web y la app de iPhone, así que lo que se registra en el gimnasio aparece en
 *  los tres lados. No hay una segunda base de datos que mantener. */
class GymRepository {
    private val db: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    // MARK: - Catálogo

    /** Los 94 ejercicios cambian muy poco: se cachean por proceso para no pagar
     *  lecturas de Firestore en cada pantalla. */
    private object CatalogCache {
        @Volatile var value: Map<String, Exercise>? = null
    }

    suspend fun exercises(): Map<String, Exercise> {
        CatalogCache.value?.let { return it }
        val snapshot = db.collection("exercises").get().await()
        val catalog = snapshot.documents
            .associate { it.id to Exercise.fromRawValue(it.id, it.data?.firestoreMap() ?: emptyMap()) }
        CatalogCache.value = catalog
        return catalog
    }

    /** Combina el catálogo global con los ejercicios propios del usuario. Los
     *  últimos viven en una subcolección protegida por las reglas de Firestore. */
    suspend fun exercises(uid: String): Map<String, Exercise> {
        val all = exercises().toMutableMap()
        try {
            val custom = db.collection("users").document(uid)
                .collection("customExercises").orderBy("nameEs").get().await()
            for (doc in custom.documents) {
                all[doc.id] = Exercise.fromRawValue(
                    doc.id,
                    doc.data?.firestoreMap() ?: emptyMap(),
                    ExerciseSource.CUSTOM,
                )
            }
        } catch (e: Exception) {
            // Una regla o índice roto en la subcolección propia no puede dejar la
            // lista entera vacía.
            android.util.Log.w("GymRepository", "ejercicios propios no disponibles: ${e.message}")
        }
        return all
    }

    // MARK: - Perfil

    suspend fun profile(uid: String): UserProfile? {
        val document = db.collection("users").document(uid).get().await()
        val data = document.data ?: return null
        return UserProfile.fromFirestore(uid, data.firestoreMap())
    }

    /** Mismo comportamiento que `ensureUserProfile` en la web: la primera vez
     *  escribe el perfil entero; después solo refresca los datos del proveedor y
     *  las fechas de acceso. `createdAt` y `provider` no se pisan nunca. */
    suspend fun ensureProfile(
        uid: String,
        email: String?,
        displayName: String?,
        photoUrl: String? = null,
        provider: String = "password",
    ) {
        val document = db.collection("users").document(uid)
        val existing = runCatching { document.get().await().data }.getOrNull()

        if (existing == null) {
            document.set(
                mapOf(
                    "email" to (email ?: ""),
                    "displayName" to (displayName ?: ""),
                    "photoURL" to (photoUrl ?: ""),
                    "provider" to provider,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp(),
                    "lastLoginAt" to FieldValue.serverTimestamp(),
                ),
            ).await()
            return
        }

        document.set(
            mapOf(
                "email" to (email ?: existing["email"]),
                "displayName" to (displayName ?: existing["displayName"]),
                "photoURL" to (photoUrl ?: existing["photoURL"]),
                "updatedAt" to FieldValue.serverTimestamp(),
                "lastLoginAt" to FieldValue.serverTimestamp(),
            ),
            setOptions = com.google.firebase.firestore.SetOptions.merge(),
        ).await()
    }

    suspend fun updateProfile(uid: String, fields: Map<String, Any?>) {
        val payload = fields.toMutableMap()
        payload["updatedAt"] = FieldValue.serverTimestamp()
        // Firestore rechaza valores null en update: no mandarlos.
        payload.entries.removeIf { it.value == null }
        db.collection("users").document(uid).set(payload, com.google.firebase.firestore.SetOptions.merge()).await()
    }

    // MARK: - Rutinas

    /** Rutinas propias más las que le asignó un coach, ordenadas por uso. */
    suspend fun routines(uid: String): List<Routine> {
        val ownQuery = db.collection("routines").whereEqualTo("ownerId", uid).get().await()
        val assignedQuery = db.collection("assignments").whereEqualTo("studentId", uid).get().await()

        val routines = ownQuery.documents.map { Routine.fromFirestore(it.id, it.data?.firestoreMap() ?: emptyMap()) }
        val assigned = assignedQuery.documents.map {
            Routine.fromFirestore(it.id, it.data?.firestoreMap() ?: emptyMap(), isAssigned = true)
        }

        return (routines + assigned).sortedByDescending {
            it.lastUsedAt ?: it.createdAt ?: Instant.EPOCH.atZone(com.siezagym.app.Domain.TrainingCalendar.zone)
        }
    }

    suspend fun routine(id: String, isAssigned: Boolean): Routine? {
        val collection = if (isAssigned) "assignments" else "routines"
        val document = db.collection(collection).document(id).get().await()
        val data = document.data ?: return null
        return Routine.fromFirestore(id, data.firestoreMap(), isAssigned = isAssigned)
    }

    /** Crea una rutina propia con exactamente el contrato que usa la web. */
    suspend fun createRoutine(uid: String, name: String, note: String, exercises: List<RoutineDraftExercise>): String {
        RoutineDraftValidation.validate(name, exercises)

        val now = FieldValue.serverTimestamp()
        val payload = mapOf(
            "ownerId" to uid,
            "name" to name.trim(),
            "note" to note.trim(),
            "exercises" to exercises.mapIndexed { index, exercise -> exercise.firestoreValue(index) },
            "lastUsedAt" to null,
            "createdAt" to now,
            "updatedAt" to now,
        )
        return db.collection("routines").add(payload).await().id
    }

    // MARK: - Sesiones

    suspend fun sessions(uid: String, limit: Long = 50): List<WorkoutSession> {
        val snapshot = db.collection("sessions")
            .whereEqualTo("userId", uid)
            .orderBy("finishedAt", Query.Direction.DESCENDING)
            .limit(limit)
            .get().await()
        return snapshot.documents.map { WorkoutSession.fromFirestore(it.id, it.data?.firestoreMap() ?: emptyMap()) }
    }

    /** Guarda una sesión terminada. Devuelve el id del documento nuevo.
     *  El volumen y el conteo de series se calculan acá y no en el cliente para
     *  que coincidan exactamente con lo que hace la web. */
    suspend fun saveSession(uid: String, routine: Routine?, startedAt: Instant, exercises: List<LoggedExercise>): String {
        val logged = exercises.filter { it.sets.isNotEmpty() }
        val totalVolume = logged.sumOf { it.volumeKg }
        val totalSets = logged.sumOf { it.sets.size }
        require(logged.isNotEmpty() && totalSets > 0) { "No cargaste ninguna serie." }

        val payload = buildSessionPayload(uid, routine, startedAt, logged, totalVolume, totalSets)
        val reference = db.collection("sessions").add(payload).await()

        // Marca la rutina como usada para que suba en la lista y en la Home.
        if (routine != null) {
            val collection = if (routine.isAssigned) "assignments" else "routines"
            runCatching {
                db.collection(collection).document(routine.id)
                    .update("lastUsedAt", FieldValue.serverTimestamp()).await()
            }
        }
        return reference.id
    }

    private fun buildSessionPayload(
        uid: String,
        routine: Routine?,
        startedAt: Instant,
        logged: List<LoggedExercise>,
        totalVolume: Double,
        totalSets: Int,
    ): Map<String, Any> {
        val payload = mutableMapOf<String, Any>(
            "userId" to uid,
            "routineName" to (routine?.name ?: ""),
            "startedAt" to com.google.firebase.Timestamp(Date.from(startedAt)),
            "finishedAt" to FieldValue.serverTimestamp(),
            "durationSeconds" to (System.currentTimeMillis() - startedAt.toEpochMilli()).toInt() / 1000,
            "totalVolumeKg" to (totalVolume * 100).roundToHundredth(),
            "totalSetsCompleted" to totalSets,
            "exerciseIds" to logged.map { it.exerciseID }.distinct(),
            "exercises" to logged.map { exercise ->
                mapOf("exerciseId" to exercise.exerciseID, "sets" to exercise.sets.map { it.firestoreValue() })
            },
            "createdAt" to FieldValue.serverTimestamp(),
        )
        if (routine != null) {
            payload["source"] = mapOf("type" to (if (routine.isAssigned) "assignment" else "routine"), "routineId" to routine.id)
        }
        return payload
    }

    private fun Double.roundToHundredth(): Double = (this * 100).let { Math.round(it).toDouble() } / 100
}