# Remediation Policy

Apply fixes only in `fix` or `release` mode. Preserve the project's architecture and unrelated work.

## Safe In-Scope Fixes

- Correct broken asset paths, case mismatches, missing guards, and deterministic build errors.
- Correct readiness timing after tracing the real loading boundary.
- Pair pause/resume handlers and make lifecycle transitions idempotent.
- Pause and resume the existing game and audio systems around ads and visibility changes.
- Prevent unwanted context menu, selection, scrolling, or zoom within the game surface.
- Correct canvas resize, fullscreen, orientation, and safe-area layout behavior.
- Add a thin SDK adapter when SDK calls are scattered and the change remains local.
- Complete existing Russian/English keys without changing product meaning.
- Add focused tests for repaired lifecycle behavior.

## Require User Direction

- Adding or removing ads, changing ad frequency, or altering reward amounts.
- Changing payments, currencies, entitlements, or purchase reconciliation.
- Selecting a cloud-save conflict policy that can discard progress.
- Changing game rules, difficulty, scoring, age rating, or content.
- Adding analytics, trackers, permissions, personal-data collection, or policy text.
- Replacing major frameworks, state systems, renderers, or audio architecture.
- Publishing a draft or production release when credentials or external state are involved.

## Never Do

- Hide errors with empty catches or blanket console suppression.
- call readiness before the game is actually usable to satisfy a text search.
- Award a rewarded-ad outcome from a close callback.
- Hardcode account tokens, unpublished IDs, local paths, or developer URLs.
- Reset user progress to make a lifecycle test pass.
- Claim real-device, ad-network, or moderation verification from static inspection.

## Verification Standard

For every change, record the original finding, changed files, focused verification, and resulting status. A source-code pattern alone can support a finding, but runtime behavior is needed to close lifecycle, rendering, audio, input, advertising, and persistence risks.
