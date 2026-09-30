package com.siezagym.app

import com.siezagym.app.Domain.FilaMusculo
import com.siezagym.app.Domain.ResumenCalorias
import com.siezagym.app.Domain.ResumenMusculos
import com.siezagym.app.Domain.ResumenSeries
import com.siezagym.app.Domain.WidgetSnapshot
import com.siezagym.app.Services.WidgetSnapshotStore
import java.time.Instant
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/** La ida y vuelta del snapshot que la app le deja al widget. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class WidgetSnapshotStoreTest {
    private val context = RuntimeEnvironment.getApplication()

    private val snapshot =
        WidgetSnapshot(
            themeID = "sieza",
            streak = 4,
            week = listOf(true, false, true, true, false, false, false),
            weeklyVolumeKg = 1234.56,
            weeklySessions = 3,
            routineName = "Tren superior",
            routineExercises = 6,
            routineSets = 18,
            routineMinutes = 55,
            lastSessionAt = ZonedDateTime.parse("2026-09-28T19:30:00-03:00"),
            updatedAt = ZonedDateTime.parse("2026-09-30T09:00:00-03:00"),
            calorias =
                ResumenCalorias(
                    kcal = 512,
                    meta = 2000,
                    pct = 26,
                    etiqueta = "Vas lento",
                    pesoPorDefecto = false,
                    hasData = true,
                ),
            series =
                ResumenSeries(
                    pct = 72,
                    completadas = 18,
                    totales = 25,
                    etiqueta = "Bien",
                    hasData = true,
                ),
            musculos =
                ResumenMusculos(
                    filas =
                        listOf(
                            FilaMusculo("Pecho", 420, 0.34),
                            FilaMusculo("Espalda", 380, 0.31),
                        ),
                    totalKg = 800,
                    hasData = true,
                ),
        )

    @Test
    fun laIdaYVueltaConservaTodosLosCampos() {
        val store = WidgetSnapshotStore(context)
        store.escribir(snapshot)
        assertEquals(snapshot, store.leer())
    }

    @Test
    fun sinSnapshotLeerDevuelveNull() {
        assertNull(WidgetSnapshotStore(context).leer())
    }

    @Test
    fun borrarSacaElSnapshot() {
        val store = WidgetSnapshotStore(context)
        store.escribir(snapshot)
        store.borrar()
        assertNull(store.leer())
    }

    @Test
    fun elVacioDeLaAppTambienSobreviveALaIdaYVuelta() {
        val store = WidgetSnapshotStore(context)
        store.escribir(WidgetSnapshot.vacio)
        assertEquals(WidgetSnapshot.vacio, store.leer())
    }

    @Test
    fun laZonaDeLaSesionSeConserva() {
        val store = WidgetSnapshotStore(context)
        store.escribir(snapshot)
        val leido = store.leer()!!
        assertEquals(Instant.parse("2026-09-28T22:30:00Z"), leido.lastSessionAt!!.toInstant())
    }
}
