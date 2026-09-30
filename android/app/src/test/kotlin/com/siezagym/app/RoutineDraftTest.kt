package com.siezagym.app

import com.siezagym.app.Domain.ExerciseSearch
import com.siezagym.app.Domain.MuscleRegion
import com.siezagym.app.Domain.RoutineCompose
import com.siezagym.app.Domain.RoutineDraftExercise
import com.siezagym.app.Domain.RoutineDraftException
import com.siezagym.app.Domain.RoutineDraftValidationError
import com.siezagym.app.Domain.RoutineDraftValidation
import com.siezagym.app.Domain.ejerciciosOrdenados
import com.siezagym.app.Models.Equipment
import com.siezagym.app.Models.Exercise
import com.siezagym.app.Models.ExerciseSource
import com.siezagym.app.Models.MovementPattern
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.PlannedSet
import com.siezagym.app.Models.RegistrationType
import com.siezagym.app.Models.Routine
import com.siezagym.app.Models.RoutineExercise
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * El borrador de rutina: las dos formas de prescribir de la web (pareja y detallada) y las cuentas
 * del armador. Es lo que tiene que salir igual al documento que espera Firestore.
 */
class RoutineDraftTest {
    private fun ejercicio(
        id: String = "press-banca",
        registration: RegistrationType = RegistrationType.PESO_REPS,
        source: ExerciseSource = ExerciseSource.CATALOG,
        pesos: Map<MuscleGroup, Double> = mapOf(MuscleGroup.PECHO to 1.0),
    ) =
        Exercise(
            id = id,
            nameEs = "Press de banca",
            nameEn = "Bench press",
            equipment = Equipment.BARRA,
            pattern = MovementPattern.EMPUJE_HORIZONTAL,
            muscleWeights = pesos,
            registrationType = registration,
            unilateral = false,
            descriptionEs = "",
            mediaUrl = null,
            source = source,
        )

    // MARK: - Constructores

    @Test
    fun desdeElCatalogoArrancaEnTresPorDiez() {
        val item = RoutineDraftExercise(ejercicio())
        assertEquals(3, item.targetSets)
        assertEquals(10, item.targetReps)
        assertFalse(item.esDetallada)
    }

    @Test
    fun unEjercicioDeTiempoArrancaEnTreintaSegundos() {
        val item = RoutineDraftExercise(ejercicio(registration = RegistrationType.TIEMPO))
        assertEquals(30, item.targetReps)
    }

    @Test
    fun unEjercicioPropioConservaSuOrigenCustom() {
        val item = RoutineDraftExercise(ejercicio(source = ExerciseSource.CUSTOM))
        assertEquals(ExerciseSource.CUSTOM, item.source)
    }

    /** Abrir el editor y guardar sin tocar nada no puede aplastar la rampa que cargó el coach. */
    @Test
    fun editarUnaRutinaNoAplastaLaRampaDelCoach() {
        val rampa =
            RoutineExercise(
                exerciseID = "sentadilla",
                source = RoutineExercise.Source.CATALOG,
                order = 0,
                targetSets = 4,
                targetReps = 10,
                targetRIR = 2,
                targetWeight = 80.0,
                techniqueNote = "al fallo",
                sets =
                    listOf(
                        PlannedSet(1, 60.0, 12, 3),
                        PlannedSet(2, 70.0, 10, 2),
                        PlannedSet(3, 80.0, 8, 1),
                        PlannedSet(4, 85.0, 6, 0),
                    ),
            )
        val item = RoutineDraftExercise(rampa)
        assertTrue(item.esDetallada)
        assertEquals(4, item.cantidadSeries)
        assertEquals(60.0, item.sets!!.first().weight!!, 0.001)
    }

    // MARK: - Pareja ↔ detallada

    @Test
    fun detallarCopiaLaPrescripcionParejaEnTodasLasFilas() {
        val item = RoutineDraftExercise(ejercicio()).apply {
            targetSets = 4
            targetReps = 8
            targetWeight = 70.0
            targetRIR = 2
            detallar()
        }
        assertEquals(4, item.sets!!.size)
        assertTrue(item.sets!!.all { it.weight == 70.0 && it.reps == 8 && it.rir == 2 })
        assertEquals(listOf(1, 2, 3, 4), item.sets!!.map { it.setNumber })
    }

    @Test
    fun detallarGarantizaAlMenosUnaFilaAunqueElCampoEsteEnBlanco() {
        val item = RoutineDraftExercise(ejercicio()).apply { targetSets = 0; detallar() }
        assertEquals(1, item.sets!!.size)
    }

    @Test
    fun emparejarTomaLaPrimeraSerieComoReferencia() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets = listOf(PlannedSet(1, 60.0, 12, 3), PlannedSet(2, 70.0, 10, 2))
                emparejar()
            }
        assertFalse(item.esDetallada)
        assertEquals(2, item.targetSets)
        assertEquals(12, item.targetReps)
        assertEquals(60.0, item.targetWeight!!, 0.001)
        assertEquals(3, item.targetRIR)
    }

    // MARK: - Cambiar cantidad

    @Test
    fun unaSerieNuevaCopiaALaUltimaCargada() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets = listOf(PlannedSet(1, 60.0, 12, 3), PlannedSet(2, 70.0, 10, 2))
                cambiarCantidad(4)
            }
        assertEquals(4, item.sets!!.size)
        assertEquals(70.0, item.sets!![3].weight!!, 0.001)
        assertEquals(10, item.sets!![3].reps)
        assertEquals(listOf(1, 2, 3, 4), item.sets!!.map { it.setNumber })
    }

    @Test
    fun achicarRenumeraLasFilasQueQuedan() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets =
                    listOf(
                        PlannedSet(1, 60.0, 12, 3),
                        PlannedSet(2, 70.0, 10, 2),
                        PlannedSet(3, 80.0, 8, 1),
                    )
                cambiarCantidad(2)
            }
        assertEquals(2, item.sets!!.size)
        assertEquals(listOf(1, 2), item.sets!!.map { it.setNumber })
    }

    @Test
    fun borrarElCampoNoFuerzaAUnoAntesDeGuardar() {
        val item = RoutineDraftExercise(ejercicio()).apply { cambiarCantidad(0) }
        assertEquals(0, item.cantidadSeries)
        assertEquals(1, item.firestoreValue(0)["targetSets"])
    }

    // MARK: - Resumen

    @Test
    fun elResumenParejoEsCantidadPorReps() {
        val item = RoutineDraftExercise(ejercicio()).apply { targetSets = 4; targetReps = 8 }
        assertEquals("4 × 8", item.resumen(esDeTiempo = false))
    }

    @Test
    fun elResumenDeTiempoAgregaLaUnidad() {
        val item = RoutineDraftExercise(ejercicio()).apply { targetSets = 3; targetReps = 30 }
        assertEquals("3 × 30s", item.resumen(esDeTiempo = true))
    }

    @Test
    fun elResumenDetalladoListaLaRampaSeriePorSerie() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets = listOf(PlannedSet(1, 60.0, 12, 3), PlannedSet(2, 80.0, 8, 1))
            }
        assertEquals("12 · 8", item.resumen(esDeTiempo = false))
    }

    @Test
    fun elResumenDetalladoUniformeNoRepiteLosValores() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets = listOf(PlannedSet(1, 60.0, 10, 2), PlannedSet(2, 60.0, 10, 2))
            }
        assertEquals("2 × 10", item.resumen(esDeTiempo = false))
    }

    // MARK: - Documento

    @Test
    fun elDocumentoTraeLasClavesQueEsperaFirestore() {
        val valor = RoutineDraftExercise(ejercicio()).firestoreValue(2)
        assertEquals("press-banca", valor["exerciseId"])
        assertEquals("catalog", valor["exerciseSource"])
        assertEquals(2, valor["order"])
        assertEquals(3, valor["targetSets"])
        assertEquals(10, valor["targetReps"])
        assertNull(valor["sets"])
    }

    @Test
    fun lasSeriesEnBlancoSeGuardanComoDiez() {
        val item =
            RoutineDraftExercise(ejercicio()).apply {
                sets = listOf(PlannedSet(1, 60.0, 0, null))
            }
        @Suppress("UNCHECKED_CAST")
        val series = item.firestoreValue(0)["sets"] as List<Map<String, Any?>>
        assertEquals(10, series[0]["reps"])
    }

    @Test
    fun elDocumentoRecortaLosEspaciosDeLaNotaYElBloque() {
        val valor =
            RoutineDraftExercise(ejercicio()).apply {
                techniqueNote = "  al fallo  "
                group = "  Fuerza  "
            }
                .firestoreValue(0)
        assertEquals("al fallo", valor["techniqueNote"])
        assertEquals("Fuerza", valor["group"])
    }

    // MARK: - Validación

    @Test
    fun sinNombreNoSeGuarda() {
        val error =
            assertThrows(RoutineDraftException::class.java) {
                RoutineDraftValidation.validate("   ", listOf(RoutineDraftExercise(ejercicio())))
            }
        assertEquals(RoutineDraftValidationError.MISSING_NAME, error.error)
    }

    @Test
    fun sinEjerciciosNoSeGuarda() {
        val error =
            assertThrows(RoutineDraftException::class.java) {
                RoutineDraftValidation.validate("Mi rutina", emptyList())
            }
        assertEquals(RoutineDraftValidationError.MISSING_EXERCISES, error.error)
    }

    // MARK: - Mover

    @Test
    fun moverReordenaSinPerderLaPrescripcion() {
        val a = RoutineDraftExercise(ejercicio(id = "a")).apply { targetWeight = 50.0 }
        val b = RoutineDraftExercise(ejercicio(id = "b"))
        val c = RoutineDraftExercise(ejercicio(id = "c"))
        val movida = RoutineCompose.mover(listOf(a, b, c), origen = 2, destino = 0)
        assertEquals(listOf("c", "a", "b"), movida.map { it.exerciseID })
        assertEquals(50.0, movida[1].targetWeight!!, 0.001)
    }

    @Test
    fun moverFueraDeRangoDevuelveLaListaIgual() {
        val lista = listOf(RoutineDraftExercise(ejercicio(id = "a")))
        assertEquals(lista, RoutineCompose.mover(lista, origen = 5, destino = 0))
        assertEquals(lista, RoutineCompose.mover(lista, origen = 0, destino = 9))
    }

    // MARK: - Reparto muscular

    @Test
    fun elRepartoNormalizaSeriesPorPesoMuscular() {
        val catalogo =
            mapOf(
                "press" to ejercicio(id = "press", pesos = mapOf(MuscleGroup.PECHO to 1.0)),
                "remo" to
                    ejercicio(
                        id = "remo",
                        pesos = mapOf(MuscleGroup.DORSAL to 0.5, MuscleGroup.BICEPS to 0.5),
                    ),
            )
        val items =
            listOf(
                RoutineDraftExercise(catalogo["press"]!!).apply { targetSets = 3 },
                RoutineDraftExercise(catalogo["remo"]!!).apply { targetSets = 1 },
            )
        val reparto = RoutineCompose.reparto(items, catalogo)
        val porMusculo = reparto.associate { it.muscle to it.pct }
        assertEquals(3.0 / 4.0, porMusculo[MuscleGroup.PECHO]!!, 0.001)
        assertEquals(0.5 / 4.0, porMusculo[MuscleGroup.DORSAL]!!, 0.001)
        assertEquals(0.5 / 4.0, porMusculo[MuscleGroup.BICEPS]!!, 0.001)
    }

    @Test
    fun sinCatalogoNoHayReparto() {
        val items = listOf(RoutineDraftExercise(ejercicio(id = "desconocido")))
        assertTrue(RoutineCompose.reparto(items, emptyMap()).isEmpty())
    }

    @Test
    fun elEjercicioSinMediaUsaLaPortadaDelVideo() {
        val item = ejercicio().copy(videoUrl = "https://youtu.be/dQw4w9WgXcQ")
        assertEquals("https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", item.thumbnailUrl)
    }

    // MARK: - Búsqueda y regiones

    @Test
    fun laBusquedaIgnoraTildesYMayusculas() {
        val lista = listOf(ejercicio().copy(nameEs = "Elevación lateral", nameEn = "Lateral raise"))
        assertEquals(1, ExerciseSearch.filtrar(lista, "elevacion", null).size)
        assertEquals(1, ExerciseSearch.filtrar(lista, "RAISE", null).size)
        assertTrue(ExerciseSearch.filtrar(lista, "sentadilla", null).isEmpty())
    }

    @Test
    fun laBusquedaFiltraPorRegionMuscular() {
        val pecho = ejercicio(id = "press", pesos = mapOf(MuscleGroup.PECHO to 1.0))
        val espalda = ejercicio(id = "remo", pesos = mapOf(MuscleGroup.DORSAL to 1.0))
        val lista = listOf(pecho, espalda)
        assertEquals(listOf(pecho), ExerciseSearch.filtrar(lista, "", MuscleRegion.PECHO))
        assertEquals(listOf(espalda), ExerciseSearch.filtrar(lista, "", MuscleRegion.ESPALDA))
    }

    @Test
    fun unaRegionIncluyeAQuienTengaPesoMuscular() {
        val mixto =
            ejercicio(pesos = mapOf(MuscleGroup.TRICEPS to 0.6, MuscleGroup.PECHO to 0.4))
        assertTrue(MuscleRegion.BRAZOS.incluye(mixto))
        assertTrue(MuscleRegion.PECHO.incluye(mixto))
        assertFalse(MuscleRegion.PIERNAS.incluye(mixto))
    }

    @Test
    fun losEjerciciosDeLaRutinaSeOrdenanPorSuOrden() {
        val rutina =
            Routine(
                id = "r1",
                ownerID = "u1",
                name = "Rutina",
                note = "",
                exercises =
                    listOf(
                        rutinaEjercicio("b", order = 1),
                        rutinaEjercicio("a", order = 0),
                    ),
                showOnHome = false,
                lastUsedAt = null,
                createdAt = null,
                updatedAt = null,
                isAssigned = false,
            )
        assertEquals(listOf("a", "b"), rutina.ejerciciosOrdenados().map { it.exerciseID })
    }

    private fun rutinaEjercicio(id: String, order: Int) =
        RoutineExercise(
            exerciseID = id,
            source = RoutineExercise.Source.CATALOG,
            order = order,
            targetSets = 3,
            targetReps = 10,
            targetRIR = null,
            targetWeight = null,
            techniqueNote = "",
            sets = null,
        )
}
