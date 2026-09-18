package com.siezagym.app.Models

import com.siezagym.app.Services.FirestoreValue

enum class Sex(val raw: String, val label: String) {
    MASCULINO("masculino", "Masculino"),
    FEMENINO("femenino", "Femenino"),
    PREFIERO_NO_DECIR("prefiero_no_decir", "Prefiero no decir");

    companion object {
        fun fromRaw(value: String?): Sex? = entries.firstOrNull { it.raw == value }
    }
}

enum class ExperienceLevel(val raw: String) {
    PRINCIPIANTE("principiante"),
    INTERMEDIO("intermedio"),
    AVANZADO("avanzado");

    val label: String get() = raw.replaceFirstChar { it.uppercase() }

    companion object {
        fun fromRaw(value: String?): ExperienceLevel? = entries.firstOrNull { it.raw == value }
    }
}

data class UserProfile(
    val id: String,
    val email: String?,
    val displayName: String?,
    val photoUrl: String?,
    val isCoach: Boolean,
    val sex: Sex?,
    val bodyWeightKg: Double?,
    val heightCm: Double?,
    val weeklyCalorieGoalKcal: Double?,
    val experienceLevel: ExperienceLevel?,
) {
    val initial: String
        get() {
            val base = displayName?.firstOrNull() ?: email?.firstOrNull() ?: 'T'
            return base.uppercase().toString()
        }

    companion object {
        fun fromFirestore(id: String, data: Map<String, Any?>): UserProfile = UserProfile(
            id = id,
            email = data["email"] as? String,
            displayName = data["displayName"] as? String,
            photoUrl = data["photoURL"] as? String,
            isCoach = FirestoreValue.bool(data["isCoach"]) ?: false,
            sex = Sex.fromRaw(data["sex"] as? String),
            bodyWeightKg = FirestoreValue.double(data["bodyWeightKg"]),
            heightCm = FirestoreValue.double(data["heightCm"]),
            weeklyCalorieGoalKcal = FirestoreValue.double(data["weeklyCalorieGoalKcal"]),
            experienceLevel = ExperienceLevel.fromRaw(data["experienceLevel"] as? String),
        )
    }
}