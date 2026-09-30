package com.siezagym.app

import com.siezagym.app.Domain.CustomExerciseDraft
import com.siezagym.app.Domain.CustomExerciseError
import com.siezagym.app.Domain.CustomExerciseException
import com.siezagym.app.Domain.YouTubeLink
import com.siezagym.app.Models.Equipment
import com.siezagym.app.Models.MuscleGroup
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * El ejercicio propio: el link de YouTube y el reparto de músculos, que son las dos partes donde un
 * error no se ve hasta que la web rechaza el documento.
 */
class CustomExerciseTest {
    private fun draft(shares: Map<MuscleGroup, Int>) =
        CustomExerciseDraft(nameEs = "Press raro", shares = shares)

    // MARK: - YouTube

    @Test
    fun sacaElIdDeTodasLasFormasDeCompartir() {
        val formas =
            listOf(
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "https://www.youtube.com/shorts/dQw4w9WgXcQ",
                "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
                "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
                "https://www.youtube.com/live/dQw4w9WgXcQ",
                "dQw4w9WgXcQ",
            )
        formas.forEach { assertEquals(it, "dQw4w9WgXcQ", YouTubeLink.id(it)) }
    }

    @Test
    fun ignoraLosParametrosDeMas() {
        val conBasura =
            listOf(
                "https://youtu.be/dQw4w9WgXcQ?si=abc&t=42",
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz&index=3",
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s",
            )
        conBasura.forEach { assertEquals("dQw4w9WgXcQ", YouTubeLink.id(it)) }
    }

    @Test
    fun loQueNoEsDeYouTubeNoDevuelveId() {
        val ajenos =
            listOf(
                "",
                "   ",
                "https://vimeo.com/123456",
                "https://www.instagram.com/reel/abc",
                "no es un link",
                "https://www.youtube.com/watch?v=corto",
            )
        ajenos.forEach { assertNull(it, YouTubeLink.id(it)) }
    }

    @Test
    fun guardaLaUrlLimpiaYLaMiniaturaSaleDelId() {
        assertEquals(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            YouTubeLink.urlParaId("dQw4w9WgXcQ"),
        )
        assertEquals(
            "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
            YouTubeLink.miniaturaParaId("dQw4w9WgXcQ"),
        )
    }

    // MARK: - Reparto de músculos

    @Test
    fun unSoloMusculoSeLlevaTodo() {
        assertEquals(mapOf(MuscleGroup.PECHO to 1.0), draft(mapOf(MuscleGroup.PECHO to 1)).muscleWeights)
    }

    @Test
    fun partesIgualesRepartenMitadYMitad() {
        val pesos = draft(mapOf(MuscleGroup.PECHO to 1, MuscleGroup.TRICEPS to 1)).muscleWeights
        assertEquals(0.5, pesos[MuscleGroup.PECHO]!!, 0.001)
        assertEquals(0.5, pesos[MuscleGroup.TRICEPS]!!, 0.001)
    }

    @Test
    fun lasPartesSonRelativas() {
        val pesos = draft(mapOf(MuscleGroup.PECHO to 3, MuscleGroup.TRICEPS to 1)).muscleWeights
        assertEquals(0.75, pesos[MuscleGroup.PECHO]!!, 0.001)
        assertEquals(0.25, pesos[MuscleGroup.TRICEPS]!!, 0.001)
    }

    /** Tres músculos iguales redondean a 0.33 cada uno y dan 0.99: el resto se lo come el mayor. */
    @Test
    fun siempreSumaUnoExactoAunqueNoSeaRedondo() {
        val pesos =
            draft(
                    mapOf(
                        MuscleGroup.PECHO to 1,
                        MuscleGroup.TRICEPS to 1,
                        MuscleGroup.DELTOIDE_ANTERIOR to 1,
                    )
                )
                .muscleWeights
        assertEquals(1.0, pesos.values.sum(), 0.0)
    }

    @Test
    fun losMusculosEnCeroNoEntran() {
        val item = draft(mapOf(MuscleGroup.PECHO to 1, MuscleGroup.TRICEPS to 0))
        assertEquals(listOf(MuscleGroup.PECHO), item.musculos)
        assertEquals(mapOf(MuscleGroup.PECHO to 1.0), item.muscleWeights)
    }

    // MARK: - Validación

    @Test
    fun sinMusculosNoHayPesosYNoSePuedeGuardar() {
        val item = draft(emptyMap())
        assertTrue(item.muscleWeights.isEmpty())
        val error = assertThrows(CustomExerciseException::class.java) { item.validar() }
        assertEquals(CustomExerciseError.SIN_MUSCULOS, error.error)
    }

    @Test
    fun sinNombreNoSePuedeGuardar() {
        listOf("", "   ").forEach { nombre ->
            val item = CustomExerciseDraft(nameEs = nombre, shares = mapOf(MuscleGroup.PECHO to 1))
            val error = assertThrows(CustomExerciseException::class.java) { item.validar() }
            assertEquals(CustomExerciseError.SIN_NOMBRE, error.error)
        }
    }

    @Test
    fun unLinkQueNoEsDeYouTubeFrenaElGuardado() {
        val item = draft(mapOf(MuscleGroup.PECHO to 1)).apply { videoURL = "https://vimeo.com/1" }
        assertTrue(item.linkInvalido)
        val error = assertThrows(CustomExerciseException::class.java) { item.validar() }
        assertEquals(CustomExerciseError.LINK_INVALIDO, error.error)
    }

    @Test
    fun sinLinkSeGuardaIgualPorqueElVideoEsOpcional() {
        val item = draft(mapOf(MuscleGroup.PECHO to 1))
        assertFalse(item.linkInvalido)
        item.validar()
        assertNull(item.firestoreValue("u1")["videoUrl"])
    }

    // MARK: - Documento

    @Test
    fun escribeLasClavesQueExigenLasReglas() {
        val valor = draft(mapOf(MuscleGroup.PECHO to 1)).firestoreValue("u1")
        assertEquals("u1", valor["ownerId"])
        assertEquals("Press raro", valor["nameEs"])
        assertTrue(valor["equipment"] is String)
        assertTrue(valor["pattern"] is String)
        assertTrue(valor["registrationType"] is String)
        assertTrue((valor["muscleWeights"] as Map<*, *>).isNotEmpty())
    }

    @Test
    fun losMusculosSeGuardanConLasClavesDeFirestore() {
        val valor = draft(mapOf(MuscleGroup.ESPALDA_ALTA_TRAPECIO to 1)).firestoreValue("u1")
        @Suppress("UNCHECKED_CAST")
        val pesos = valor["muscleWeights"] as Map<String, Double>
        assertEquals(1.0, pesos["espaldaAltaTrapecio"]!!, 0.001)
    }

    @Test
    fun elNombreSeGuardaSinEspaciosDeMas() {
        val valor =
            CustomExerciseDraft(nameEs = "  Press raro  ", shares = mapOf(MuscleGroup.PECHO to 1))
                .firestoreValue("u1")
        assertEquals("Press raro", valor["nameEs"])
        assertEquals("Press raro", valor["nameEn"])
    }

    @Test
    fun guardaElTextoDeBusquedaSinTildesNiMayusculas() {
        val valor =
            CustomExerciseDraft(
                    nameEs = "Elevación lateral",
                    shares = mapOf(MuscleGroup.PECHO to 1),
                )
                .firestoreValue("u1")
        assertEquals("elevacion lateral", valor["searchTextEs"])
    }

    @Test
    fun elLinkSeGuardaLimpio() {
        val item =
            draft(mapOf(MuscleGroup.PECHO to 1)).apply {
                videoURL = "https://youtu.be/dQw4w9WgXcQ?si=abc"
            }
        assertEquals("https://www.youtube.com/watch?v=dQw4w9WgXcQ", item.firestoreValue("u1")["videoUrl"])
    }
}
