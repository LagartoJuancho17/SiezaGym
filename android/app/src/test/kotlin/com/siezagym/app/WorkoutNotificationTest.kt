package com.siezagym.app

import android.app.Notification
import android.app.NotificationManager
import androidx.compose.ui.graphics.toArgb
import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.Domain.WorkoutActivityContent
import com.siezagym.app.Features.Workout.WorkoutNotification
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

/** La notificación del entrenamiento en curso: se publica una sola, fija, y se cancela al salir. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class WorkoutNotificationTest {
    private val context = RuntimeEnvironment.getApplication()
    private val manager = context.getSystemService(NotificationManager::class.java)
    private val startedAt = Instant.parse("2026-09-30T12:00:00Z")

    private val contenido =
        WorkoutActivityContent(
            exerciseName = "Press banca",
            setNumber = 2,
            setsInExercise = 4,
            completedSets = 5,
            totalSets = 18,
            volumeKg = 1234.0,
        )

    @Test
    fun mostrarPublicaUnaNotificacionFijaConElAvance() {
        WorkoutNotification.mostrar(context, "Tren superior", startedAt, contenido)

        val notificacion = shadowOf(manager).allNotifications.single()
        assertEquals("Tren superior", notificacion.extras.getString(Notification.EXTRA_TITLE))
        assertEquals("Press banca", notificacion.extras.getString(Notification.EXTRA_TEXT))
        assertTrue(
            notificacion.extras.getString(Notification.EXTRA_SUB_TEXT)!!.contains("5 de 18 series")
        )
        assertTrue(notificacion.extras.getString(Notification.EXTRA_SUB_TEXT)!!.contains("1.234 kg"))
        assertEquals(18, notificacion.extras.getInt(Notification.EXTRA_PROGRESS_MAX))
        assertEquals(5, notificacion.extras.getInt(Notification.EXTRA_PROGRESS))
        assertEquals(startedAt.toEpochMilli(), notificacion.`when`)
        assertTrue(notificacion.flags and Notification.FLAG_ONGOING_EVENT != 0)
        assertEquals(Theme.porDefecto.solido.toArgb(), notificacion.color)
    }

    @Test
    fun elCanalEsDeBajaImportanciaYSinBadge() {
        WorkoutNotification.mostrar(context, "Tren superior", startedAt, contenido)

        val canal = manager.getNotificationChannel("entrenamiento-en-curso")
        assertNotNull(canal)
        assertEquals(NotificationManager.IMPORTANCE_LOW, canal.importance)
    }

    @Test
    fun repetirlaActualizaLaMismaSinDuplicar() {
        WorkoutNotification.mostrar(context, "Tren superior", startedAt, contenido)
        WorkoutNotification.mostrar(
            context,
            "Tren superior",
            startedAt,
            contenido.copy(completedSets = 6, exerciseName = "Remo"),
        )

        val notificacion = shadowOf(manager).allNotifications.single()
        assertEquals("Remo", notificacion.extras.getString(Notification.EXTRA_TEXT))
        assertEquals(6, notificacion.extras.getInt(Notification.EXTRA_PROGRESS))
    }

    @Test
    fun cancelarLaDesaparece() {
        WorkoutNotification.mostrar(context, "Tren superior", startedAt, contenido)
        WorkoutNotification.cancelar(context)

        assertEquals(0, shadowOf(manager).size())
    }
}
