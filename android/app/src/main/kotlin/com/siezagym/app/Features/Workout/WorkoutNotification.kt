package com.siezagym.app.Features.Workout

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.compose.ui.graphics.toArgb
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.siezagym.app.DesignSystem.Theme
import com.siezagym.app.DesignSystem.ThemeStore
import com.siezagym.app.Domain.WorkoutActivityContent
import com.siezagym.app.MainActivity
import com.siezagym.app.R
import java.text.NumberFormat
import java.time.Instant
import java.util.Locale

/**
 * El entrenamiento en curso en la barra de notificaciones: el equivalente Android de la Live
 * Activity de iOS. Una sola notificación fija, con el cronómetro que corre el sistema y el avance
 * de series, para mirar el reloj sin abrir la app.
 *
 * No es un foreground service: el entrenamiento no corre en segundo plano, así que alcanza con una
 * notificación fija. Si el proceso muere, la notificación se queda hasta que la app vuelva a
 * tocarla o el sistema la limpie.
 */
object WorkoutNotification {
    private const val CANAL = "entrenamiento-en-curso"
    private const val ID = 0xE17

    /** Publica o actualiza la notificación. Repetirla no suena ni vibra: es la misma. */
    fun mostrar(
        context: Context,
        nombreRutina: String,
        startedAt: Instant,
        contenido: WorkoutActivityContent,
    ) {
        val app = context.applicationContext
        crearCanal(app)
        val tema = Theme.conId(ThemeStore.temaGuardado(app))

        val abrir =
            PendingIntent.getActivity(
                app,
                0,
                Intent(app, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val builder =
            NotificationCompat.Builder(app, CANAL)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setColor(tema.solido.toArgb())
                .setContentTitle(nombreRutina)
                .setContentText(contenido.exerciseName ?: "Entrenamiento terminado")
                .setSubText(
                    "${contenido.completedSets} de ${contenido.totalSets} series · " +
                        "${numero(contenido.volumeKg)} kg"
                )
                .setContentIntent(abrir)
                .setWhen(startedAt.toEpochMilli())
                .setUsesChronometer(true)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)

        if (contenido.totalSets > 0)
            builder.setProgress(contenido.totalSets, contenido.completedSets, false)

        try {
            NotificationManagerCompat.from(app).notify(ID, builder.build())
        } catch (e: SecurityException) {
            // Sin POST_NOTIFICATIONS (Android 13+) el sistema la descarta; el entrenamiento sigue.
            android.util.Log.w("SiezaGym", "no se pudo mostrar la notificación: ${e.message}")
        }
    }

    /** Al terminar, descartar o cerrar sesión: la notificación ya no dice nada útil. */
    fun cancelar(context: Context) {
        NotificationManagerCompat.from(context.applicationContext).cancel(ID)
    }

    private fun crearCanal(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        val canal =
            NotificationChannel(CANAL, "Entrenamiento en curso", NotificationManager.IMPORTANCE_LOW)
                .apply {
                    description = "El tiempo y las series del entrenamiento que está en curso."
                    setShowBadge(false)
                }
        manager.createNotificationChannel(canal)
    }

    private fun numero(valor: Double): String =
        NumberFormat.getIntegerInstance(Locale.forLanguageTag("es-AR")).format(valor.toInt())
}
