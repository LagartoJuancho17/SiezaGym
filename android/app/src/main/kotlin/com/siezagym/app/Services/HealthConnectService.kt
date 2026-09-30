package com.siezagym.app.Services

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.siezagym.app.Domain.HealthMetrics
import com.siezagym.app.Domain.TrainingCalendar
import java.time.Instant
import java.time.ZonedDateTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/** El estado que la portada dibuja en la tarjeta "Actividad de hoy". */
data class HealthUiState(
    val summary: HealthMetrics = HealthMetrics.empty,
    val isConnected: Boolean = false,
    val isRequesting: Boolean = false,
    val errorMessage: String? = null,
)

/**
 * Lo que la UI necesita del lector de salud. Existe para poder sustituirlo en los tests, igual que
 * [MFAHost]: la pantalla no depende de Health Connect ni de Android.
 */
interface HealthSource {
    val state: StateFlow<HealthUiState>
    val isAvailable: Boolean

    /** Los permisos que hay que pedirle al sistema. */
    val permissions: Set<String>

    /** Lee el resumen del día si el usuario ya conectó la app. */
    suspend fun refreshIfConnected()

    /** Lo que el sistema respondió al pedido de permisos. */
    fun onPermissionResult(granted: Set<String>)
}

/**
 * Lee el resumen del día desde Health Connect, el equivalente de Apple Salud en Android. Sólo pide
 * permisos de lectura: SiezaGym no escribe entrenamientos, pasos ni calorías en Health Connect.
 *
 * A diferencia de iOS, el permiso no se concede con una llamada: hay que lanzar el contrato de
 * `PermissionController` desde la activity. Por eso [onPermissionResult] recibe el resultado y acá
 * sólo se guarda el estado.
 */
class HealthConnectService(private val context: Context) : HealthSource {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private val cliente: HealthConnectClient?
        get() = if (isAvailable) HealthConnectClient.getOrCreate(context) else null

    private val mutableState =
        MutableStateFlow(
            HealthUiState(isConnected = prefs.getBoolean(CLAVE_CONECTADO, false)),
        )

    override val state: StateFlow<HealthUiState> = mutableState.asStateFlow()

    override val isAvailable: Boolean
        get() = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE

    override val permissions: Set<String> =
        setOf(
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(DistanceRecord::class),
            HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        )

    override suspend fun refreshIfConnected() {
        val cliente = cliente ?: return
        if (!mutableState.value.isConnected) return

        mutableState.update { it.copy(isRequesting = true, errorMessage = null) }
        try {
            val inicio =
                ZonedDateTime.now(TrainingCalendar.zone)
                    .toLocalDate()
                    .atStartOfDay(TrainingCalendar.zone)
                    .toInstant()
            val respuesta =
                cliente.aggregate(
                    AggregateRequest(
                        metrics =
                            setOf(
                                StepsRecord.COUNT_TOTAL,
                                DistanceRecord.DISTANCE_TOTAL,
                                ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
                            ),
                        timeRangeFilter = TimeRangeFilter.between(inicio, Instant.now()),
                    )
                )

            val pasos = respuesta[StepsRecord.COUNT_TOTAL] ?: 0L
            val metros = respuesta[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0
            val kcal = respuesta[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0
            mutableState.update {
                it.copy(
                    summary = HealthMetrics.fromDailyTotals(pasos, metros, kcal),
                    errorMessage = null,
                )
            }
        } catch (e: SecurityException) {
            mutableState.update { it.copy(errorMessage = ERROR_PERMISOS) }
        } catch (e: Exception) {
            mutableState.update { it.copy(errorMessage = ERROR_LECTURA) }
        } finally {
            mutableState.update { it.copy(isRequesting = false) }
        }
    }

    override fun onPermissionResult(granted: Set<String>) {
        val completo = granted.containsAll(permissions)
        mutableState.update {
            it.copy(isConnected = completo, errorMessage = if (completo) null else ERROR_PERMISOS)
        }
        prefs.edit().putBoolean(CLAVE_CONECTADO, completo).apply()
    }

    companion object {
        private const val PREFS = "sieza-salud"
        private const val CLAVE_CONECTADO = "healthConnect.connected"

        const val ERROR_PERMISOS =
            "No se pudo conectar con Health Connect. Revisá el permiso en la app Health Connect."
        const val ERROR_LECTURA =
            "No pudimos leer tus datos de actividad. Revisá los permisos en Health Connect."
    }
}
