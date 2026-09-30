package com.siezagym.app.Services

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.Query
import com.siezagym.app.Domain.CustomExerciseDraft
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.RoutineDraftValidation
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.LoggedExercise
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.UserProfile
import com.siezagym.app.Models.WorkoutSession
import com.siezagym.app.Models.firestoreMap
import java.time.Instant
import java.util.Date
import kotlinx.coroutines.tasks.await

/**
 * Acceso a Firestore. Es el mismo proyecto y las mismas colecciones que usa la web y la app de
 * iPhone, así que lo que se registra en el gimnasio aparece en los tres lados. No hay una segunda
 * base de datos que mantener.
 */
class GymRepository {
    private val db: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    // MARK: - Catálogo

    /**
     * Los 94 ejercicios cambian muy poco: se cachean por proceso para no pagar lecturas de
     * Firestore en cada pantalla.
     */
    private object CatalogCache {
        @Volatile var value: Map<String, Exercise>? = null
    }

    suspend fun exercises(): Map<String, Exercise> {
        CatalogCache.value?.let {
            return it
        }
        val snapshot = db.collection("exercises").get().await()
        val catalog =
            snapshot.documents.associate {
                it.id to Exercise.fromRawValue(it.id, it.data?.firestoreMap() ?: emptyMap())
            }
        CatalogCache.value = catalog
        return catalog
    }

    // MARK: - Perfil

    suspend fun profile(uid: String): UserProfile? {
        val document = db.collection("users").document(uid).get().await()
        val data = document.data ?: return null
        return UserProfile.fromFirestore(uid, data.firestoreMap())
    }

    /**
     * Mismo comportamiento que `ensureUserProfile` en la web: la primera vez escribe el perfil
     * entero; después solo refresca los datos del proveedor y las fechas de acceso. `createdAt` y
     * `provider` no se pisan nunca.
     */
    suspend fun ensureProfile(
        uid: String,
        email: String?,
        displayName: String?,
        photoUrl: String? = null,
        provider: String = "password",
    ) {
        val document = db.collection("users").document(uid)
        val existing = document.get().await().data

        if (existing == null) {
            document
                .set(
                    mapOf(
                        "email" to (email ?: ""),
                        "displayName" to (displayName ?: ""),
                        "photoURL" to (photoUrl ?: ""),
                        "provider" to provider,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp(),
                        "lastLoginAt" to FieldValue.serverTimestamp(),
                    )
                )
                .await()
            return
        }

        document
            .set(
                mapOf(
                    "email" to (email ?: existing["email"]),
                    "displayName" to (displayName ?: existing["displayName"]),
                    "photoURL" to (photoUrl ?: existing["photoURL"]),
                    "updatedAt" to FieldValue.serverTimestamp(),
                    "lastLoginAt" to FieldValue.serverTimestamp(),
                ),
                com.google.firebase.firestore.SetOptions.merge(),
            )
            .await()
    }

    suspend fun updateProfile(uid: String, fields: Map<String, Any?>) {
        val payload = fields.toMutableMap()
        payload["updatedAt"] = FieldValue.serverTimestamp()
        // Explicit null clears optional profile values, matching iOS.
        db.collection("users")
            .document(uid)
            .set(payload, com.google.firebase.firestore.SetOptions.merge())
            .await()
    }

    // MARK: - Rutinas

    /** Rutinas propias más las que le asignó un coach, ordenadas por uso. */
    suspend fun routines(uid: String): List<Routine> {
        val ownQuery = db.collection("routines").whereEqualTo("ownerId", uid).get().await()
        val assignedQuery =
            db.collection("assignments").whereEqualTo("studentId", uid).get().await()

        val routines =
            ownQuery.documents.map {
                Routine.fromFirestore(it.id, it.data?.firestoreMap() ?: emptyMap())
            }
        val assigned =
            assignedQuery.documents.map {
                Routine.fromFirestore(
                    it.id,
                    it.data?.firestoreMap() ?: emptyMap(),
                    isAssigned = true,
                )
            }

        return (routines + assigned).sortedByDescending {
            it.lastUsedAt
                ?: it.createdAt
                ?: Instant.EPOCH.atZone(com.siezagym.app.Domain.TrainingCalendar.zone)
        }
    }

    suspend fun routine(id: String, isAssigned: Boolean): Routine? {
        val collection = if (isAssigned) "assignments" else "routines"
        val document = db.collection(collection).document(id).get().await()
        val data = document.data ?: return null
        return Routine.fromFirestore(id, data.firestoreMap(), isAssigned = isAssigned)
    }

    // MARK: - Escritura de rutinas
    //
    // Las mismas validaciones que `lib/routines/routines.js` en la web, con los
    // mismos textos: quien lee el error tiene que saber que el problema es el
    // mismo en los tres clientes.

    /** Devuelve el id del documento nuevo. */
    suspend fun createRoutine(
        uid: String,
        name: String,
        note: String,
        exercises: List<RoutineDraftExercise>,
    ): String {
        RoutineDraftValidation.validate(name, exercises)
        val ahora = FieldValue.serverTimestamp()
        val referencia =
            db.collection("routines")
                .add(
                    mapOf(
                        "ownerId" to uid,
                        "name" to name.trim(),
                        "note" to note.trim(),
                        "exercises" to exercises.mapIndexed { i, e -> e.firestoreValue(i) },
                        "showOnHome" to true,
                        "lastUsedAt" to null,
                        "createdAt" to ahora,
                        "updatedAt" to ahora,
                    )
                )
                .await()
        return referencia.id
    }

    suspend fun updateRoutine(
        uid: String,
        routineId: String,
        name: String,
        note: String,
        exercises: List<RoutineDraftExercise>,
    ) {
        RoutineDraftValidation.validate(name, exercises)
        val documento = db.collection("routines").document(routineId)
        requireOwned(documento, uid)
        documento
            .update(
                mapOf(
                    "name" to name.trim(),
                    "note" to note.trim(),
                    "exercises" to exercises.mapIndexed { i, e -> e.firestoreValue(i) },
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            )
            .await()
    }

    suspend fun deleteRoutine(uid: String, routineId: String) {
        val documento = db.collection("routines").document(routineId)
        requireOwned(documento, uid)
        documento.delete().await()
    }

    /**
     * Copia una rutina con "(copia)" agregado al nombre, como en la web. La copia
     * no aparece en la portada hasta que la actives.
     */
    suspend fun duplicateRoutine(uid: String, routineId: String): String {
        val original = routine(routineId, isAssigned = false)
            ?: throw IllegalStateException("Rutina no encontrada.")
        return createRoutine(
            uid,
            "${original.name} (copia)",
            original.note,
            original.exercises.map { RoutineDraftExercise(it) },
        )
    }

    suspend fun setRoutineShowOnHome(uid: String, routineId: String, showOnHome: Boolean) {
        val documento = db.collection("routines").document(routineId)
        requireOwned(documento, uid)
        documento
            .update(
                mapOf(
                    "showOnHome" to showOnHome,
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            )
            .await()
    }

    /** A qué semana queda asignada la rutina. `null` la saca del calendario. */
    suspend fun setRoutineWeek(uid: String, routineId: String, weekKey: String?) {
        val documento = db.collection("routines").document(routineId)
        requireOwned(documento, uid)
        documento
            .update(
                mapOf(
                    "weekKey" to weekKey,
                    "updatedAt" to FieldValue.serverTimestamp(),
                )
            )
            .await()
    }

    /**
     * Una rutina asignada por un coach no se edita desde la app del alumno, así
     * que antes de tocar nada se verifica que sea suya.
     */
    private suspend fun requireOwned(documento: DocumentReference, uid: String) {
        val data = documento.get().await().data
        require(data != null && data["ownerId"] == uid) { "Rutina no encontrada." }
    }

    // MARK: - Ejercicios propios

    /**
     * Los ejercicios que el usuario crea para sí. Viven bajo su documento de
     * usuario, no en el catálogo compartido: son de esa persona y nadie más los
     * tiene que ver.
     */
    private fun coleccionPropia(uid: String) =
        db.collection("users").document(uid).collection("customExercises")

    suspend fun customExercises(uid: String): List<Exercise> {
        val snapshot =
            runCatching { coleccionPropia(uid).get().await() }.getOrElse { return emptyList() }
        return snapshot.documents
            .map {
                Exercise.fromRawValue(
                    it.id,
                    it.data?.firestoreMap() ?: emptyMap(),
                    ExerciseSource.CUSTOM,
                )
            }
            .sortedBy { it.nameEs }
    }

    suspend fun createCustomExercise(uid: String, draft: CustomExerciseDraft): String {
        val ahora = FieldValue.serverTimestamp()
        val referencia =
            coleccionPropia(uid)
                .add(
                    mapOf(
                        "ownerId" to uid,
                        "nameEs" to draft.nameEs.trim(),
                        "equipment" to draft.equipment?.raw,
                        "pattern" to draft.pattern?.raw,
                        "muscleWeights" to draft.muscleWeights.mapKeys { (m, _) -> m.raw },
                        "registrationType" to draft.registrationType.raw,
                        "unilateral" to draft.unilateral,
                        "searchTextEs" to normalizeSearchText(draft.nameEs),
                        "createdAt" to ahora,
                        "updatedAt" to ahora,
                    )
                )
                .await()
        return referencia.id
    }

    suspend fun deleteCustomExercise(uid: String, exerciseId: String) {
        coleccionPropia(uid).document(exerciseId).delete().await()
    }

    /**
     * La búsqueda del selector de ejercicios no distingue acentos ni mayúsculas,
     * como el `normalizeSearchText` de la web: "press" tiene que encontrar
     * "Press".
     */
    private fun normalizeSearchText(value: String): String =
        java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
            .replace("\\p{InCombiningDiacriticalMarks}+".toRegex(), "")
            .lowercase()

    // MARK: - Sesiones

    suspend fun sessions(uid: String, limit: Long = 50): List<WorkoutSession> {
        val snapshot =
            db.collection("sessions")
                .whereEqualTo("userId", uid)
                .orderBy("finishedAt", Query.Direction.DESCENDING)
                .limit(limit)
                .get()
                .await()
        return snapshot.documents.map {
            WorkoutSession.fromFirestore(it.id, it.data?.firestoreMap() ?: emptyMap())
        }
    }

    /**
     * Guarda una sesión terminada. Devuelve el id del documento nuevo. El volumen y el conteo de
     * series se calculan acá y no en el cliente para que coincidan exactamente con lo que hace la
     * web.
     */
    suspend fun saveSession(
        uid: String,
        routine: Routine?,
        startedAt: Instant,
        exercises: List<LoggedExercise>,
    ): String {
        val logged = exercises.filter { it.sets.isNotEmpty() }
        val totalSets = logged.sumOf { it.sets.size }
        require(logged.isNotEmpty() && totalSets > 0) { "No cargaste ninguna serie." }

        val payload = buildSessionPayload(uid, routine, startedAt, logged, totalSets)
        val reference = db.collection("sessions").document(SessionTotals.documentId(uid, startedAt))
        reference.set(payload).await()

        // Marca la rutina como usada para que suba en la lista y en la Home.
        if (routine != null) {
            val collection = if (routine.isAssigned) "assignments" else "routines"
            runCatching {
                db.collection(collection)
                    .document(routine.id)
                    .update("lastUsedAt", FieldValue.serverTimestamp())
                    .await()
            }
        }
        return reference.id
    }

    private fun buildSessionPayload(
        uid: String,
        routine: Routine?,
        startedAt: Instant,
        logged: List<LoggedExercise>,
        totalSets: Int,
    ): Map<String, Any?> {
        val payload =
            mutableMapOf<String, Any?>(
                "userId" to uid,
                "routineName" to routine?.name,
                "startedAt" to com.google.firebase.Timestamp(Date.from(startedAt)),
                "finishedAt" to FieldValue.serverTimestamp(),
                "durationSeconds" to
                    java.time.Duration.between(startedAt, Instant.now())
                        .seconds
                        .coerceIn(0, Int.MAX_VALUE.toLong())
                        .toInt(),
                "totalVolumeKg" to SessionTotals.volumeKg(logged),
                "totalSetsCompleted" to totalSets,
                "exerciseIds" to logged.map { it.exerciseID }.distinct(),
                "exercises" to
                    logged.map { exercise ->
                        mapOf(
                            "exerciseId" to exercise.exerciseID,
                            "sets" to exercise.sets.map { it.firestoreValue() },
                        )
                    },
                "createdAt" to FieldValue.serverTimestamp(),
            )
        if (routine != null) {
            payload["source"] =
                mapOf(
                    "type" to (if (routine.isAssigned) "assignment" else "routine"),
                    "routineId" to routine.id,
                )
        }
        return payload
    }
}
