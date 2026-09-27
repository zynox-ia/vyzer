# 01 · Design tokens (VYZ-12)

- **Arquivo:** [Vyzer](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer), página `0:1`. Sem variáveis nem estilos no Figma.
- **Origem da estrutura:** inventário em `inventory/` (valores, contagens e node-ids por tela).
- **Cores:** não vêm do Figma. Seguem a ADR-0011 e a ADR-0012 (paleta quente, acento terracota mínimo, status em OKLCH, dois temas); tabela final em `docs/specs/design-tokens.md`.

## Divergências intencionais

| Figma                                              | Implementação                                                                          | Motivo                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cores do Linear (cinzas frios, accent `#5e6ad2`)   | Paleta quente, acento terracota mínimo                                                 | ADR-0011, ADR-0012                                 |
| Títulos de página em Inter 13 px medium            | Títulos em Inter Tight (`font-display`) 20 px semibold; corpo em Inter, igual ao Figma | ADR-0012                                           |
| Modal com raio 21 px                               | `rounded-xl` (12 px)                                                                   | Decisão do responsável; 21 px fica registrado aqui |
| Anéis brancos translúcidos em pills e cards        | Bordas hairline (`border-*`)                                                           | Contenção: profundidade por superfície e hairline  |
| Sombra "raised" em painel, cards e botões          | Sem sombra                                                                             | Sombra só em popover e modal                       |
| Quase-duplicados de tipografia, raio e espaçamento | Um valor canônico (o mais usado)                                                       | Ruído de captura                                   |

## Sem design

Hover de linha e card, anel de foco, durações de transição e estado de erro de input não têm nó no Figma. Foram definidos pelo padrão do Linear e pelas ADR-0011 e ADR-0012; calibrar quando houver desenho.
