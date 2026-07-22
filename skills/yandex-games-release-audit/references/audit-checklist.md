# Release Audit Checklist

Use this checklist after the static scripts. Mark untested behavior `MANUAL`, not `PASS`.

## Project and Build

- Repository instructions and user changes are preserved.
- Package manager, lockfile, runtime version, build command, and output directory are identified.
- Production build completes from a clean dependency install when authorized.
- The archive opens `index.html` from its root and uses deployable asset paths.
- Models, textures, audio, fonts, workers, WASM, and localization files return successfully.
- Case-sensitive paths work on Linux.
- No local filesystem paths, development servers, secrets, or source maps are unintentionally shipped.
- Bundle size and initial download are reviewed against current platform guidance.

## SDK and Lifecycle

- SDK is loaded once and initialized through a dedicated adapter or service.
- Local development handles SDK absence without hiding production failures.
- `LoadingAPI.ready()` fires once, after required assets and initial state are usable.
- Gameplay API start/stop calls are paired when the API is used.
- SDK pause/resume events, `visibilitychange`, and focus changes are coordinated with the game state.
- Repeated pause/resume events are idempotent and do not restart music or reset progress.
- Returning to the initial menu intentionally restores only the state that should reset.

## Advertising and Monetization

- Ads use the Yandex SDK and appear only at logical pauses.
- Gameplay input, timers, animation, and audio pause before ad presentation when required.
- Close, error, and offline paths restore a valid state exactly once.
- Rewarded outcomes are granted only by the SDK's reward callback.
- Payments and consumables are reconciled after reload when used.
- Monetization changes are never guessed or silently introduced by an audit.

## Audio

- Audio unlock follows a user gesture and failed unlocks are recoverable.
- Music, ambient, SFX, UI, and footsteps follow the project's category controls.
- Global lifecycle pause does not destroy playback position unless intended.
- Ads, page hiding, and SDK pause events cannot leave duplicate loops playing.
- Volume and mute settings persist if the game exposes them.

## Input, Mobile, and Rendering

- Keyboard, mouse, pointer lock, touch, and on-screen controls work as declared.
- Browser zoom, text selection, long-press, and context menu do not disrupt gameplay.
- The page does not scroll or overscroll during gameplay.
- Portrait and landscape behavior matches the declared orientation.
- Fullscreen changes and browser chrome resize the canvas and UI correctly.
- Safe-area insets do not cover controls.
- Pause/menu controls remain reachable on small horizontal screens.
- WebGL context loss or unsupported graphics produce a usable message.

## Localization and Accessibility

- Russian and English keys are complete when both languages are declared.
- Player-visible fallback text does not expose raw keys.
- Buttons and consent text match their actions.
- UI remains readable at common mobile resolutions and browser scaling.
- Essential controls are not distinguishable only by color.

## Persistence and Data

- Local and cloud saves are versioned and validated when used.
- Progress is saved immediately after meaningful actions or through an explicit save flow.
- Offline, anonymous, authorized, quota, and corrupted-data paths are handled.
- Cloud merge policy cannot silently replace newer progress with older progress.
- Personal data, analytics, and external requests match the project's disclosed policy.

## Runtime and Moderation

- No uncaught errors, rejected promises, WebGL errors, or repeating warnings appear during a complete session.
- Start, pause, resume, win, loss, reload, and return-to-menu flows are exercised.
- A Yandex draft is tested on every declared OS, browser, device class, and orientation.
- Ad behavior is tested through the platform environment rather than local mocks alone.
- Store assets, age rating, description, instructions, and legal rights receive human review.
