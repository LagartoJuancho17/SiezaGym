# Napkin Runbook

## Execution & Validation

1. **[2026-09-15] The visual evaluator needs a controlled mobile viewport**
   Do instead: run `D2_PREVIEW=true npm run dev` and inspect `/design-preview?viewport=390` before claiming visual parity.

2. **[2026-09-15] Google-hosted `next/font` can block offline builds**
   Do instead: run the local test lane first and record a build failure caused by `fonts.googleapis.com` separately from code failures.

## Repository Workflow

1. **[2026-09-15] This checkout can be read-only outside the Codex workspace**
   Do instead: keep a complete patchable copy under the writable Codex workspace and report the exact files that need syncing to the source checkout.

## Design Guardrails

1. **[2026-09-15] Goal rail height depends on every card, including offscreen cards**
   Do instead: keep long goal titles on one line with ellipsis and a `title` tooltip so the rail stays 151 px tall.

2. **[2026-09-15] The reference composition is measured against a 390 px interior**
   Do instead: preserve 18 px side padding, 150 × 151 px goal cards, 16 px card gap, 80 px activity rows, and a 340 × 67 px nav shell.
