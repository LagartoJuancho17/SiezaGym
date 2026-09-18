package com.siezagym.app

import com.siezagym.app.Models.Exercise
import org.junit.Assert.assertEquals
import org.junit.Test

class ExerciseMediaTest {
    @Test
    fun conservaLaURLDelGifQueEntregaFirestore() {
        val url = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif"
        val exercise = Exercise.fromRawValue(
            "press-de-banca-con-barra",
            mapOf("nameEs" to "Press de banca con barra", "mediaUrl" to url),
        )
        assertEquals(url, exercise.mediaUrl)
    }
}