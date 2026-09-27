---
status: accepted
supersedes: visual parts of ADR-0011 and ADR-0012
---

# Design system package and its visual rules

The interface lives in a separate package, `packages/design-system` (`@vyzer/design-system`), with tokens, components and icons, documented in Storybook (which replaces the `/_design` route) and consumed by `apps/web` and future products. Tokens have three layers: primitives (raw palette, CSS only, no utilities), semantic tokens per theme (the only Tailwind utilities components use) and component tokens when needed. Tailwind's default scales are removed so off-token values cannot be written by accident.

The following replace the visual parts of ADR-0011 and ADR-0012 (the warm monochrome palette, restraint, two themes with dark as default, inverted primary button and underlined links still hold):

| Topic             | Decision                                                                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weights           | Only 400 and 500                                                                                                                                                                                                                                                                       |
| Type              | Inter for body, labels and UI; Inter Tight for display and headings; JetBrains Mono for code, kbd and issue identifiers. All OFL, self-hosted                                                                                                                                          |
| Panel headers     | 13 px / 500 (`label-md`); large titles only at page level                                                                                                                                                                                                                              |
| Active controls   | Checkbox, radio, switch and progress use the primary text color, not the accent                                                                                                                                                                                                        |
| Accent            | Terracotta only for focus, the active sidebar item indicator and highlighted counters                                                                                                                                                                                                  |
| Focus             | No thick ring. Variant B is the default: the component's 1 px border turns full terracotta plus a 2 px outer halo at 25%. Variant A (border at 25% only) is kept in the Storybook toolbar for comparison, because it measures about 1.3–1.4:1 and misses the 3:1 target in both themes |
| Radius            | Zero by default; `full` only where the shape carries meaning (radio, status icons, avatar, switch thumb). The Storybook toolbar compares 0 / 2 / 4 px before a final call                                                                                                              |
| Light theme       | Content on the cream: app and panel `#faf9f5`, sidebar and group headers `#f0eee6`, cards darker cream; nothing lighter than `#faf9f5`                                                                                                                                                 |
| Status and labels | OKLCH with one lightness and chroma per theme, only the hue varies (dark L 0.72, light L 0.55, C up to 0.15 within sRGB). Light badge text uses a darker step of the same hue to reach 4.5:1                                                                                           |
| Control borders   | Form controls use `border-control`, which reaches 3:1; hairlines are decorative and stay subtle                                                                                                                                                                                        |

## Consequences

- Colors are measured, not assumed: `docs/design/palette-contrast.mjs` derives them and Storybook (Foundations → Colors) measures every pair live in both themes; the Storybook accessibility addon fails tests on violations.
- `text-tertiary` keeps the requested `#87867f`; in the light theme it misses 4.5:1, so there it is only for placeholders, disabled text and decoration, while identifiers and metadata use `text-secondary`.
- One Vitest install serves the monorepo: a Node project for unit and API authorization tests, and a browser project (Playwright) that runs every story as an interaction and accessibility test.
