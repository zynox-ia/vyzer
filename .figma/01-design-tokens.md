# 01 · Design tokens (VYZ-12)

- **Arquivo:** [Vyzer](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer), página `0:1`. Sem variáveis nem estilos no Figma.
- **Origem da estrutura:** inventário em `inventory/` (valores, contagens e node-ids por tela).
- **Cores:** não vêm do Figma. Seguem a ADR-0013 (paleta quente, acento terracota mínimo, status em OKLCH, dois temas, raio zero); valores em `packages/design-system/src/styles/` e no Storybook (Foundations → Colors).

## Divergências intencionais

| Figma                                                | Implementação                                                                                                     | Motivo                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Cores do Linear (cinzas frios, accent `#5e6ad2`)     | Paleta quente, acento terracota mínimo                                                                            | ADR-0011, ADR-0012                                |
| Inter Variable em tudo                               | Corpo em Inter (igual ao Figma); display e headings em Inter Tight; code, kbd e identificadores em JetBrains Mono | ADR-0013                                          |
| Raios do Figma (pílulas, 8, 10, 12 e 21 px no modal) | Raio zero; `full` só em radio, ícone de status, avatar e thumb do switch; toolbar compara 0/2/4 px                | ADR-0013                                          |
| Pesos 400, 500 e 600                                 | Só 400 e 500                                                                                                      | ADR-0013                                          |
| Anéis brancos translúcidos em pills e cards          | Bordas hairline (`border-*`)                                                                                      | Contenção: profundidade por superfície e hairline |
| Sombra "raised" em painel, cards e botões            | Sem sombra                                                                                                        | Sombra só em popover e modal                      |
| Quase-duplicados de tipografia, raio e espaçamento   | Um valor canônico (o mais usado)                                                                                  | Ruído de captura                                  |

## Sem design

Hover de linha e card, anel de foco, durações de transição e estado de erro de input não têm nó no Figma. Foram definidos pelo padrão do Linear e pelas ADR-0011 e ADR-0012; calibrar quando houver desenho.
