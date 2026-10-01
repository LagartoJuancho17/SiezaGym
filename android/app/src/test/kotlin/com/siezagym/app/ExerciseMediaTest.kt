package com.siezagym.app

import com.siezagym.app.Models.Exercise
import org.junit.Assert.assertEquals
import org.junit.Test

class ExerciseMediaTest {
    @Test
    fun conservaLaURLDelGifQueEntregaFirestore() {
        val url =
            "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif"
        val exercise =
            Exercise.fromRawValue(
                "press-de-banca-con-barra",
                mapOf("nameEs" to "Press de banca con barra", "mediaUrl" to url),
            )
        assertEquals(url, exercise.mediaUrl)
    }

    @Test
    fun blankGifDoesNotHideCustomVideoThumbnail() {
        val exercise =
            Exercise.fromRawValue(
                "custom",
                mapOf(
                    "mediaUrl" to "  ",
                    "videoUrl" to "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                ),
                com.siezagym.app.Models.ExerciseSource.CUSTOM,
            )
        org.junit.Assert.assertNull(exercise.mediaUrl)
        assertEquals("https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", exercise.thumbnailUrl)
    }
}
