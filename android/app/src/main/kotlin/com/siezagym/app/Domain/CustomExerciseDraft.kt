package com.siezagym.app.Domain

import com.siezagym.app.Models.Equipment
import com.siezagym.app.Models.MovementPattern
import com.siezagym.app.Models.MuscleGroup
import com.siezagym.app.Models.RegistrationType
import kotlin.math.roundToInt

/**
 * Un link de YouTube, en cualquiera de las formas en que YouTube lo comparte.
 *
 * Se guarda el id y no la URL pegada porque las de compartir vienen con basura de seguimiento
 * (`?si=`, `&t=`, listas de reproducción) y porque con el id se arma sola la miniatura.
 */
object YouTubeLink {
    private val permitidos = ('A'..'Z') + ('a'..'z') + ('0'..'9') + '_' + '-'

    fun esId(texto: String): Boolean = texto.length == 11 && texto.all { it in permitidos }

    /** El id del video, o null si el texto no es un link de YouTube. */
    fun id(texto: String): String? {
        val limpio = texto.trim()
        if (limpio.isEmpty()) return null

        // Pegar solo el id también vale: es lo que queda si copiás de la app.
        if (esId(limpio)) return limpio

        // Sin esquema, la URL no parsea el host.
        val conEsquema = if (limpio.contains("://")) limpio else "https://$limpio"
        val uri =
            runCatching { java.net.URI(conEsquema) }.getOrNull() ?: return null
        val host = uri.host?.lowercase() ?: return null

        val dominio = host.removePrefix("www.")
        val segmentos = uri.path.orEmpty().split("/").filter { it.isNotEmpty() }

        return when (dominio) {
            "youtu.be" -> segmentos.firstOrNull()?.takeIf { esId(it) }
            "youtube.com",
            "m.youtube.com",
            "music.youtube.com",
            "youtube-nocookie.com" -> {
                // /watch?v=ID
                val query =
                    uri.rawQuery
                        ?.split("&")
                        ?.mapNotNull { par ->
                            val i = par.indexOf('=')
                            if (i < 0) null else par.substring(0, i) to par.substring(i + 1)
                        }
                        ?.toMap()
                val v = query?.get("v")
                if (v != null && esId(v)) {
                    v
                } else if (
                    segmentos.size >= 2 &&
                        segmentos[0] in listOf("shorts", "embed", "live", "v") &&
                        esId(segmentos[1])
                ) {
                    segmentos[1]
                } else {
                    null
                }
            }
            else -> null
        }
    }

    /** La URL limpia que se guarda. */
    fun urlParaId(id: String): String = "https://www.youtube.com/watch?v=$id"

    /**
     * La miniatura del video. No hace falta guardarla: sale del id.
     *
     * `mqdefault` y no `maxresdefault` porque la máxima no existe para todos los videos y queda un
     * cuadrado roto.
     */
    fun miniaturaParaId(id: String): String = "https://img.youtube.com/vi/$id/mqdefault.jpg"
}

/**
 * Un ejercicio propio mientras se carga, antes de guardarlo.
 *
 * Es para lo que no está en el catálogo: una máquina rara del gimnasio, una variante del entrenador.
 * Vive en `users/{uid}/customExercises`, o sea que solo lo ve su dueño.
 */
data class CustomExerciseDraft(
    var nameEs: String = "",
    var equipment: Equipment = Equipment.BARRA,
    var pattern: MovementPattern = MovementPattern.EMPUJE_HORIZONTAL,
    var registrationType: RegistrationType = RegistrationType.PESO_REPS,
    var unilateral: Boolean = false,
    var videoURL: String = "",
    /**
     * Cuánto participa cada músculo, en partes enteras. Dos músculos en 1 y 1 es mitad y mitad; 3 y
     * 1 es 75/25. Se normaliza al guardar.
     */
    var shares: Map<MuscleGroup, Int> = emptyMap(),
) {
    val musculos: List<MuscleGroup> get() = MuscleGroup.entries.filter { (shares[it] ?: 0) > 0 }

    val videoID: String? get() = YouTubeLink.id(videoURL)

    /**
     * El link se acepta vacío, pero si tiene algo tiene que ser de YouTube: guardar un link roto es
     * peor que no guardar ninguno.
     */
    val linkInvalido: Boolean get() = videoURL.isNotBlank() && videoID == null

    /**
     * Los pesos que espera el modelo: suman 1.0 exacto.
     *
     * Se reparte por partes y no pidiendo porcentajes porque en el gimnasio nadie quiere pelear para
     * que tres campos sumen 100.
     */
    val muscleWeights: Map<MuscleGroup, Double>
        get() {
            val total = musculos.sumOf { (shares[it] ?: 0) }
            if (total <= 0) return emptyMap()

            val pesos =
                LinkedHashMap<MuscleGroup, Double>().apply {
                    for (musculo in musculos) {
                        this[musculo] =
                            ((shares[musculo] ?: 0).toDouble() / total * 100).roundToInt() / 100.0
                    }
                }

            // Redondear a dos decimales deja sobras (tres músculos iguales dan 0.99). El resto se lo
            // come el que más participa, para que la suma dé 1.0 exacto y la web no rechace el
            // documento.
            val suma = pesos.values.sum()
            if (suma != 1.0) {
                val mayor = pesos.maxByOrNull { it.value }?.key
                if (mayor != null) {
                    pesos[mayor] = ((pesos[mayor]!! + (1.0 - suma)) * 100).roundToInt() / 100.0
                }
            }
            return pesos
        }

    fun validar() {
        if (nameEs.isBlank()) throw CustomExerciseException(CustomExerciseError.SIN_NOMBRE)
        if (musculos.isEmpty()) throw CustomExerciseException(CustomExerciseError.SIN_MUSCULOS)
        if (linkInvalido) throw CustomExerciseException(CustomExerciseError.LINK_INVALIDO)
    }

    /**
     * El documento que espera Firestore.
     *
     * Las reglas exigen `ownerId`, `nameEs`, `equipment`, `pattern`, `muscleWeights` (no vacío) y
     * `registrationType`; sin alguno de esos el write se rechaza. `searchTextEs` es para que el
     * buscador de la web también lo encuentre.
     */
    fun firestoreValue(ownerID: String): MutableMap<String, Any?> {
        val limpio = nameEs.trim()
        val valor =
            mutableMapOf<String, Any?>(
                "ownerId" to ownerID,
                "nameEs" to limpio,
                "nameEn" to limpio,
                "equipment" to equipment.raw,
                "pattern" to pattern.raw,
                "muscleWeights" to muscleWeights.entries.associate { it.key.raw to it.value },
                "registrationType" to registrationType.raw,
                "unilateral" to unilateral,
                "descriptionEs" to "",
                "descriptionEn" to "",
                "searchTextEs" to textoDeBusqueda(limpio),
            )
        // Campo propio de la app: la web todavía no muestra video, y lo ignora.
        videoID?.let { valor["videoUrl"] = YouTubeLink.urlParaId(it) }
        return valor
    }

    companion object {
        /** Igual que `normalizeSearchText` en lib/text/normalize.js: sin tildes y en minúsculas. */
        fun textoDeBusqueda(texto: String): String =
            texto.lowercase().replace("ñ", "n").normalizeForSearch()
    }
}

private fun String.normalizeForSearch(): String =
    java.text.Normalizer.normalize(this, java.text.Normalizer.Form.NFD)
        .replace(Regex("\\p{InCombiningDiacriticalMarks}+"), "")

class CustomExerciseException(val error: CustomExerciseError) : Exception(error.mensaje)

enum class CustomExerciseError(val mensaje: String) {
    SIN_NOMBRE("Ponele un nombre al ejercicio."),
    SIN_MUSCULOS("Elegí al menos un músculo."),
    LINK_INVALIDO("Ese link no es de YouTube."),
}
