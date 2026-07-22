---
name: yandex-games-release-audit
description: Audit, repair, verify, and package browser games for release on Yandex Games. Use when preparing a web game for moderation, checking Yandex Games SDK integration, diagnosing draft failures, validating loading and gameplay lifecycle signals, reviewing ads/audio/input/mobile behavior, or building a release ZIP.
---

# Yandex Games Release Audit

Prepare a browser game for Yandex Games moderation without treating a successful production build as proof that the game is release-ready.

## Select a Mode

- `audit`: inspect and report without modifying project files.
- `fix`: audit, apply safe in-scope fixes, and rerun affected checks.
- `release`: run `fix`, build the production bundle, audit the bundle, and create a ZIP only when blocking checks pass.

Infer the mode from the request. Use `audit` when the user asks only for a review or diagnosis. Do not write files in `audit` mode.

## Run the Workflow

### 1. Establish Scope

Read repository instructions and inspect the package manager, framework, build command, output directory, SDK adapter, audio layer, state management, localization, and existing tests. Preserve unrelated changes.

Identify whether the game uses ads, leaderboards, player data, payments, cloud saves, or Gameplay API. Apply checks for optional features only when they are used or declared.

### 2. Refresh Requirements

Read [references/official-sources.md](references/official-sources.md), then verify the relevant requirements against the current official Yandex Games documentation. Requirements are time-sensitive; do not rely only on the bundled summary or memory.

Use official Yandex sources for release requirements. Clearly label any inference.

### 3. Run Static Project Audit

Run:

```bash
node <skill-dir>/scripts/audit-project.mjs <project-dir>
```

Use `--json` when structured output is useful and `--strict` in CI. Treat findings as leads to verify in source, not as definitive proof. Read [references/audit-checklist.md](references/audit-checklist.md) for checks that cannot be automated.

### 4. Inspect Runtime Behavior

Build and serve the game through its normal production-like workflow. Test the declared desktop and mobile layouts where tooling permits.

Verify at minimum:

- SDK initialization and failure fallback;
- `LoadingAPI.ready()` only after the game can accept input;
- loading progress while large assets load;
- pause/resume across visibility loss, SDK pause events, menus, and ads;
- gameplay and audio stopping together when required;
- ad callbacks returning the game to a valid state;
- keyboard, pointer, touch, orientation, fullscreen, and canvas resize behavior;
- asset, model, texture, audio, and localization requests without 404s;
- no uncaught exceptions or actionable console errors;
- save behavior when the game uses persistence.

Never claim device compatibility or moderation readiness without either testing it or marking it `MANUAL`.

### 5. Apply Fixes

In `fix` and `release` modes, classify each change using [references/remediation-policy.md](references/remediation-policy.md). Make the smallest architecture-consistent correction. Route SDK calls through an adapter, audio through the project's audio manager, and lifecycle changes through existing state/event systems.

Do not add fake integrations, silent error swallowing, placeholder credentials, unsolicited analytics, or broad refactors. Ask before changes that alter monetization, persistence semantics, game rules, permissions, or public policy text.

Rerun the closest relevant test after every fix group, then rerun the static audit and production build.

### 6. Audit the Production Bundle

Run:

```bash
node <skill-dir>/scripts/audit-build.mjs <build-dir>
```

Resolve missing local references, filesystem path leaks, insecure resource URLs, absent SDK integration, and build errors. Review size warnings rather than assuming a fixed platform limit; confirm current limits in official documentation.

### 7. Package the Release

Only after blocking bundle findings pass, run:

```bash
node <skill-dir>/scripts/package-release.mjs <build-dir> --output <archive.zip>
```

The script requires the `zip` executable, places build contents at the archive root, excludes source maps by default, and refuses to overwrite an archive unless `--force` is provided.

### 8. Report the Result

Report findings using exactly these statuses:

- `PASS`: verified and correct.
- `FIXED`: changed and verified.
- `WARNING`: likely issue or non-blocking risk.
- `BLOCKED`: release-stopping issue or failed verification.
- `MANUAL`: requires a real device, Yandex draft, account access, legal review, or human judgment.

Lead with release readiness, then list blockers, fixes, warnings, manual checks, commands run, and archive path. Distinguish static evidence from runtime evidence. A release is ready only when no `BLOCKED` findings remain; `MANUAL` items must stay visible.

## Resource Map

- [references/official-sources.md](references/official-sources.md): official documentation entry points and freshness rules.
- [references/audit-checklist.md](references/audit-checklist.md): detailed automated and manual checks.
- [references/remediation-policy.md](references/remediation-policy.md): safe-fix boundary and approval rules.
- `scripts/audit-project.mjs`: dependency-free source audit.
- `scripts/audit-build.mjs`: dependency-free production bundle audit.
- `scripts/package-release.mjs`: guarded ZIP packaging.
