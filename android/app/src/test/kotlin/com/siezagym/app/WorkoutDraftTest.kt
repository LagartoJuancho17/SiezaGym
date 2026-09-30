package com.siezagym.app

import com.siezagym.app.Features.Workout.*
import com.siezagym.app.Models.*
import com.siezagym.app.Services.SessionTotals
import org.junit.Assert.*
import org.junit.Test

class WorkoutDraftTest {
    private fun routine(sets: List<Map<String, Any>>? = null): Routine =
        Routine.fromFirestore(
            "r",
            mapOf(
                "name" to "Fuerza",
                "exercises" to
                    listOf(
                        mapOf(
                            "exerciseId" to "press",
                            "targetSets" to 3,
                            "targetReps" to 10,
                            "targetWeight" to 40.0,
                            "targetRIR" to 2,
                            "sets" to sets,
                        )
                    ),
            ),
        )

    @Test
    fun individualCoachPrescriptionsOverrideRepeatedTargets() {
        val draft =
            WorkoutDraft(
                routine(
                    listOf(
                        mapOf("weight" to 42.5, "reps" to 8, "rir" to 2),
                        mapOf("weight" to 45, "reps" to 6, "rir" to 1),
                    )
                ),
                emptyMap(),
            )
        assertEquals(2, draft.totalSets)
        assertEquals(42.5, draft.exercises.first().sets.first().weight, 0.0)
        assertEquals(6, draft.exercises.first().sets.last().reps)
        assertFalse(draft.canSave)
    }

    @Test
    fun failedSetsAreLoggedButNeverAddVolume() {
        val draft = WorkoutDraft(routine(), emptyMap())
        val sets = draft.exercises.first().sets
        sets[0].done = true
        sets[1].done = true
        sets[1].failed = true
        // Third set has a prescription but was never completed.
        assertEquals(2, draft.completedSets)
        assertEquals(400.0, draft.volumeKg, 0.0)
        val logged = draft.loggedExercises()
        assertEquals(2, logged.single().sets.size)
        assertTrue(logged.single().sets.last().failed)
        assertEquals(2, logged.single().sets.last().setNumber)
        assertEquals(400.0, SessionTotals.volumeKg(logged), 0.0)
    }

    @Test
    fun addingASetCopiesNumbersWithoutCopyingCompletion() {
        val draft = WorkoutDraft(routine(), emptyMap())
        draft.exercises.first().sets.last().apply {
            weight = 55.5
            reps = 7
            rir = 1
            done = true
            failed = true
        }
        draft.addSet(draft.exercises.first().id)
        val added = draft.exercises.first().sets.last()
        assertEquals(55.5, added.weight, 0.0)
        assertEquals(7, added.reps)
        assertEquals(1, added.rir)
        assertFalse(added.done)
        assertFalse(added.failed)
    }

    @Test
    fun volumeIsRoundedOnceAndIsNotMultipliedByOneHundred() {
        val logged =
            listOf(
                LoggedExercise(
                    "press",
                    listOf(
                        LoggedSet(1, 42.555, 3, null, false),
                        LoggedSet(2, 100.0, 10, null, true),
                    ),
                )
            )
        assertEquals(127.67, SessionTotals.volumeKg(logged), 0.001)
    }

    @Test
    fun retryUsesSameDocumentWhileDifferentWorkoutsAndAccountsStaySeparate() {
        val start = java.time.Instant.parse("2026-09-30T12:00:00Z")
        assertEquals(SessionTotals.documentId("one", start), SessionTotals.documentId("one", start))
        assertNotEquals(
            SessionTotals.documentId("one", start),
            SessionTotals.documentId("two", start),
        )
        assertNotEquals(
            SessionTotals.documentId("one", start),
            SessionTotals.documentId("one", start.plusSeconds(1)),
        )
    }

    @Test
    fun freeWorkoutStartsEmptyAndCannotSave() {
        val draft = WorkoutDraft(null, emptyMap())
        assertFalse(draft.canSave)
        assertTrue(draft.loggedExercises().isEmpty())
    }
}
