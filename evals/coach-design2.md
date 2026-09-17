# Coach design2 acceptance

Outcome: trainers can invite, unlink and inspect students without leaving the active design2 theme; history keeps real exercises, sets and volume.

Gate: `npx vitest run tests/coach-design2.test.js` covers real rendered roster links, accessible unlink labels, invitation empty state, actual completion duration and full student training details. The same suite exercises the real student route with mocked services to prove logged-out, non-coach and unrelated-student rejection, plus authorized data delivery. Invitation persistence requires the disposable-account browser cases below.

Browser evaluation, pass threshold 100% of applicable cases, with a test coach account:

1. At 320, 390 and 1280 px in Plata, Noche and Brasa, roster, dates and long names fit without horizontal overflow. Bottom navigation remains usable.
2. Open Agregar alumno: invitation dialog sits above navigation; focus stays inside, Escape closes and restores focus. Copy gives feedback. Reopen gets the active code. Regenerate invalidates the old code. Request failure offers Reintentar.
3. Follow a linked student: correct avatar/email, recent session count, last date, volume chart, routines, exercise names and every load/repetition appear. Zero/one sessions show honest chart guidance.
4. Unlink cancellation leaves the student. Confirming removes the link; opening the previous detail URL is rejected by the existing server relationship check.
5. Ordinary student cannot open coach routes; logged-out requests redirect to login.

Use development fixtures for layout only. Invitation and unlink writes must use a disposable test account, never production student records. Record screenshots and case results with the release evaluation.
