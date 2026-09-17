# Dashboard e items · design2

Outcome: all personal areas and the coach area are reachable from `/dashboard`,
with real training metrics and the original item create/edit/delete actions.
The three dashboard/item pages share the same theme and bottom navigation.

Automated regression/evaluation lane:

```sh
npx vitest run tests/dashboard-design2.test.js tests/home-metrics.test.js
```

The dashboard render suite covers an ordinary user, coach, administrator,
unauthenticated requests, no sessions/items, a saved item, a missing or foreign
item, all form statuses, and a session containing both successful and failed sets.
Pass threshold: 100%. It renders the actual pages with mocked repository data;
metric computations are real. It does not invoke a paid model or production data.

Visual acceptance matrix (authenticated browser):

- At 320, 390 and 1440 px, inspect `/dashboard`, `/dashboard/items` and an item's
  edit page in Plata, Noche and Brasa. No clipping or horizontal page scrolling;
  labels remain readable and the last action is above the bottom navigation.
- A student has training/routines/history/progress/profile/items links, but no
  professor link. Coach and admin profiles also have the professor link.
- Empty metrics invite the first session. Saved metrics show their sample window,
  estimated intensity basis and the fallback 75 kg calorie assumption if needed.
- Expand distribution: muscle volume, push/pull, weekday volume, session volume,
  intensity zones and the last-session series sequence must reflect saved data.
- Create an item, edit all three fields, then delete it. Reload and confirm each
  change persisted. Verify logout returns to login.
- Open another user's item URL and verify it does not reveal their data.

Visual checks must all pass before publishing. This file defines the evaluation;
it does not claim browser interaction was executed by the automated render tests.
