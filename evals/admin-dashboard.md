# Admin dashboard

Outcome: an administrator can understand the health of SiezaGym in under one
minute and reach the main operational areas without exposing the panel to other
users.

## Gate checks

```sh
npx vitest run tests/admin-access.test.js tests/admin-dashboard.test.js
npm run lint
npm run build
```

## Acceptance matrix

- `/admin` redirects to `/login` without a session.
- `/admin` redirects to `/` for a signed-in email outside the allowlist.
- `totoarr17@gmail.com` and `valentinsierradw@gmail.com` can see the panel.
- The panel renders live counts for users, active users, sessions, coaches and assignments.
- The panel shows recent users, coaches, routines and sessions with empty states.
- The catalog section reports exercises with and without visual media.
- The responsive layout works at 390px and 1440px without horizontal page scrolling.
- The global Firestore profile rules reject client changes to `isAdmin`, `isCoach` and `role`.
- The admin page never exposes Firebase credentials or Admin SDK code to a client component.

The current implementation is read-only. Destructive operations require a later
audit-log and confirmation flow before they are enabled.
