package com.siezagym.app.Models

import com.siezagym.app.Services.FirestoreValue

/** Grupos musculares del catálogo. Los rawValue son las claves exactas que
 *  guarda Firestore en `muscleWeights`, no se pueden renombrar sin migrar data. */
enum class MuscleGroup(val raw: String, val label: String) {
    PECHO("pecho", "Pecho"),
    DORSAL("dorsal", "Dorsal"),
    ESPALDA_ALTA_TRAPECIO("espaldaAltaTrapecio", "Espalda alta y trapecio"),
    DELTOIDE_ANTERIOR("deltoideAnterior", "Deltoide anterior"),
    DELTOIDE_LATERAL("deltoideLateral", "Deltoide lateral"),
    DELTOIDE_POSTERIOR("deltoidePosterior", "Deltoide posterior"),
    BICEPS("biceps", "Bíceps"),
    TRICEPS("triceps", "Tríceps"),
    ANTEBRAZO("antebrazo", "Antebrazo"),
    CUADRICEPS("cuadriceps", "Cuádriceps"),
    ISQUIOTIBIALES("isquiotibiales", "Isquiotibiales"),
    GLUTEO("gluteo", "Glúteo"),
    ADUCTORES("aductores", "Aductores"),
    GEMELO("gemelo", "Gemelo"),
    ABDOMEN("abdomen", "Abdomen"),
    LUMBAR("lumbar", "Lumbar");

    companion object {
        fun fromRaw(value: String?): MuscleGroup? = entries.firstOrNull { it.raw == value }
    }
}

enum class Equipment(val raw: String, val label: String) {
    BARRA("barra", "Barra"),
    MANCUERNA("mancuerna", "Mancuerna"),
    MAQUINA("maquina", "Máquina"),
    POLEA("polea", "Polea"),
    PESO_CORPORAL("peso_corporal", "Peso corporal"),
    BANDA("banda", "Banda"),
    KETTLEBELL("kettlebell", "Kettlebell");

    companion object {
        fun fromRaw(value: String?): Equipment? = entries.firstOrNull { it.raw == value }
    }
}

enum class MovementPattern(val raw: String, val label: String) {
    EMPUJE_HORIZONTAL("empuje_horizontal", "Empuje horizontal"),
    EMPUJE_VERTICAL("empuje_vertical", "Empuje vertical"),
    TRACCION_HORIZONTAL("traccion_horizontal", "Tracción horizontal"),
    TRACCION_VERTICAL("traccion_vertical", "Tracción vertical"),
    DOMINANTE_RODILLA("dominante_rodilla", "Dominante de rodilla"),
    DOMINANTE_CADERA("dominante_cadera", "Dominante de cadera"),
    AISLAMIENTO("aislamiento", "Aislamiento"),
    CORE("core", "Core");

    val isPush: Boolean get() = this == EMPUJE_HORIZONTAL || this == EMPUJE_VERTICAL
    val isPull: Boolean get() = this == TRACCION_HORIZONTAL || this == TRACCION_VERTICAL

    companion object {
        fun fromRaw(value: String?): MovementPattern? = entries.firstOrNull { it.raw == value }
    }
}

enum class RegistrationType(val raw: String, val label: String) {
    PESO_REPS("peso_reps", "Peso × reps"),
    REPS("reps", "Solo reps"),
    TIEMPO("tiempo", "Tiempo"),
    DISTANCIA_TIEMPO("distancia_tiempo", "Distancia + tiempo");

    /** En estos, `targetReps` es una duración en segundos, no una cantidad. */
    val isTimeBased: Boolean get() = this == TIEMPO || this == DISTANCIA_TIEMPO

    companion object {
        fun fromRaw(value: String?): RegistrationType? = entries.firstOrNull { it.raw == value }
    }
}

enum class ExerciseSource(val raw: String) {
    CATALOG("catalog"),
    CUSTOM("custom");
}

data class Exercise(
    val id: String,
    val nameEs: String,
    val nameEn: String,
    val equipment: Equipment?,
    val pattern: MovementPattern?,
    /** Reparto del esfuerzo entre músculos. Los valores suman 1.0. */
    val muscleWeights: Map<MuscleGroup, Double>,
    val registrationType: RegistrationType,
    val unilateral: Boolean,
    val descriptionEs: String,
    val mediaUrl: String?,
    val source: ExerciseSource,
) {
    val primaryMuscle: MuscleGroup?
        get() = muscleWeights.maxByOrNull { it.value }?.key

    companion object {
        fun fromRawValue(id: String, data: Map<String, Any?>, source: ExerciseSource = ExerciseSource.CATALOG): Exercise {
            var weights: LinkedHashMap<MuscleGroup, Double> = LinkedHashMap()
            (data["muscleWeights"] as? Map<*, *>)?.forEach { (key, value) ->
                val muscle = MuscleGroup.fromRaw(key as? String)
                val share = FirestoreValue.double(value)
                if (muscle != null && share != null) weights[muscle] = share
            }
            return Exercise(
                id = id,
                nameEs = data["nameEs"] as? String ?: id,
                nameEn = data["nameEn"] as? String ?: "",
                equipment = Equipment.fromRaw(data["equipment"] as? String),
                pattern = MovementPattern.fromRaw(data["pattern"] as? String),
                muscleWeights = weights,
                registrationType = RegistrationType.fromRaw(data["registrationType"] as? String)
                    ?: RegistrationType.PESO_REPS,
                unilateral = FirestoreValue.bool(data["unilateral"]) ?: false,
                descriptionEs = data["descriptionEs"] as? String ?: "",
                mediaUrl = data["mediaUrl"] as? String,
                source = source,
            )
        }
    }
}