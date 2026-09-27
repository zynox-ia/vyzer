---
status: proposed
amends: ADR-0013
---

# Three type weights, uppercase labels, radius roles and a darker app background

After the Phase 1 review, four rules of ADR-0013 change. Status stays `proposed` until the owner approves them in Storybook.

| Topic               | ADR-0013                                              | Now                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weights             | 400 and 500 only                                      | 400 (body), 500 (labels, buttons, panel titles, headings 3–4), 600 (display and headings 1–2, occasional emphasis on numbers and names). 700 stays out: too heavy for a dense interface                                                                                                                                                   |
| Uppercase           | not defined                                           | Only for short organizing labels, never sentences: `type-overline` (page eyebrow, settings section) and `type-label-caps` (sidebar section, table header), both with `0.06em` tracking                                                                                                                                                    |
| Radius              | One base value (0 / 2 / 4 px) scaling the whole scale | Components use roles — `rounded-inline`, `-control`, `-container`, `-overlay`, `-dialog` — and a preset decides their values: straight (all 0, current direction), soft (2/4/6/8/10) or rounded (4/6/8/12/16). Nested elements are concentric (inner radius never larger than the outer one); `full` only where the shape carries meaning |
| Dark app background | `#0e0e0d`                                             | `#0a0a09`, for a larger step to the `#141413` panels                                                                                                                                                                                                                                                                                      |

Dark-theme shadows also get a higher opacity (0.45), since a black shadow barely shows on a near-black surface; overlays keep a `border-strong` so their edge never depends on the shadow alone.
