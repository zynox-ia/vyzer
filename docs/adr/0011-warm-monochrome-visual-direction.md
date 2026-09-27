---
status: accepted, amended by ADR-0012
---

# Warm monochrome visual direction, two themes, dark by default

Vyzer keeps the structure and density of the Figma file (which mirrors Linear) but not its colors: the palette is a warm monochrome inspired by Anthropic's design system (`docs/design/reference-anthropic.md`) — graphite, cream and warm greys, with no accent color and no bluish tones. Only status and labels carry color, as earthy tones with one variant per theme. Depth comes from surface steps and 1 px hairlines; shadows exist only on popovers and modals. From the reference we adopt the palette and the restraint only, not its sizes, spacing, components or (proprietary) fonts; the typeface is Inter Tight.

Two themes ship from the start with the same semantic tokens, dark being the default. The user picks dark, light or follow-the-system, as in Linear; the choice lives in localStorage for now and moves to user preferences in the database later.

## Consequences

- Neutral solutions replace the accent: the primary button is inverted (cream on graphite in dark, graphite on cream in light); links use the primary text color with an underline; the focus ring is 2 px of the primary text color with a 2 px offset; selection uses a surface grey; active controls (checkbox, toggle, progress) use the primary text color.
- Color is never the only signal: every status has its own icon shape.
- Every token exists in both themes, so a component styled only with semantic tokens works in both without changes.
- The Figma colors are intentionally not matched; fidelity reviews compare structure, sizes and typography, and colors against `docs/specs/design-tokens.md`.
