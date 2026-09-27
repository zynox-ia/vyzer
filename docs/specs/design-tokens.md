# Spec: Design tokens

Substituída pelo **Vyzer Design System** ([VYZ-18](https://linear.app/zynox-dev/issue/VYZ-18/design-system)). A issue VYZ-12 foi marcada como duplicada.

- **Fonte da verdade dos tokens:** `packages/design-system/src/styles/` (`primitives.css`, `themes.css`, `theme.css`).
- **Documentação:** Storybook (`pnpm storybook`), em Foundations: Colors (valores e contrastes medidos ao vivo nos dois temas), Typography, Spacing, Radius, Shadows, Motion e Icons; e QA, com claro e escuro lado a lado.
- **Decisões:** [ADR-0013](../adr/0013-design-system-package-and-visual-rules.md), que substitui a parte visual das ADR-0011 e ADR-0012.
- **Derivação e contraste offline:** `node docs/design/palette-contrast.mjs`.
- **Origem da estrutura:** inventário do Figma em `.figma/inventory/` e divergências em `.figma/01-design-tokens.md`.
