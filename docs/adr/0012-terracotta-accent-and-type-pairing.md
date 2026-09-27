---
status: accepted
amends: ADR-0011
---

# Minimal terracotta accent, OKLCH status colors, Inter body with Inter Tight titles

After reviewing the first `/_design`, three parts of ADR-0011 change. Everything else in it (warm monochrome palette, two themes, dark by default, restraint, inverted primary button, underlined links in the text color, color never the only signal) still holds.

1. **A minimal accent.** Terracotta (`#d97757` from the reference, lightness adjusted per theme to keep ≥ 3:1 on every surface) marks only: the active sidebar item indicator, checked checkboxes, the focus ring and highlighted counters. It never paints buttons, backgrounds or running text, and it is not a status color. This replaces "no accent color" and the focus ring in the primary text color.
2. **Status and label colors in OKLCH** share one lightness and chroma per theme and differ only in hue (dark L 0.72, light L 0.52, C 0.15 capped by the sRGB gamut), replacing the earthy per-color palette. Badges use the color at 15% behind text in the full color; in the light theme the badge text takes a darker step of the same hue, because the full color cannot reach 4.5:1 there without turning ambers and limes muddy.
3. **Type pairing.** Body text is Inter; page titles use Inter Tight at a larger size and semibold weight, for contrast with the body. This replaces "Inter Tight everywhere".
