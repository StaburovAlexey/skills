# Official Sources

Check the current official documentation before making release claims. Yandex Games requirements and SDK behavior can change after this skill is published.

## Primary Documentation

- [Yandex Games SDK overview](https://yandex.ru/dev/games/doc/ru/sdk/)
- [Technical requirements](https://yandex.ru/dev/games/doc/ru/concepts/requirements)
- [SDK integration requirement](https://yandex.ru/dev/games/doc/ru/requirements/1/19)
- [SDK events](https://yandex.ru/dev/games/doc/ru/sdk/sdk-events)
- [Moderation](https://yandex.ru/dev/games/doc/ru/concepts/moderation)
- [Saving progress requirements](https://yandex.ru/dev/games/doc/ru/requirements/1/9)

Follow links from these pages for advertising, payments, leaderboards, player data, and platform-specific rules when the game uses those features.

## Freshness Rules

1. Prefer the official Russian documentation because it is the platform's primary release reference.
2. Verify pages relevant to the features actually used by the game.
3. Compare requirement wording and update dates when a cached result conflicts with a live page.
4. Do not copy numeric limits into code unless the platform requires them at runtime. Keep changing thresholds in documentation or configuration.
5. Cite the exact official page beside any requirement that blocks release.

## Stable Baseline to Reconfirm

The following items formed the baseline when the skill was authored and must still be reconfirmed:

- initialize the Yandex Games SDK;
- signal readiness only when the player can start interacting;
- coordinate gameplay and audio with SDK pause/resume events and ads;
- show ads through supported SDK APIs at logical pauses;
- avoid actionable runtime console errors;
- prevent browser UI such as the context menu from disrupting gameplay where required;
- test every declared platform, orientation, and browser combination;
- provide the declared localization and reliable progress saving when persistence is used.
