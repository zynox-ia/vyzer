# 01 · Design tokens (VYZ-12)

- **Arquivo:** [Vyzer](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer), página `0:1`. Sem variáveis nem estilos no Figma.
- **Origem da estrutura:** inventário em `inventory/` (valores, contagens e node-ids por tela).
- **Cores:** não vêm do Figma. Seguem a ADR-0013 (paleta quente, acento terracota mínimo, status em OKLCH, dois temas); valores e contrastes medidos ao vivo em `/design-system/foundations/colors`.
- **Implementação:** `packages/design-system`; documentação em `/design-system`.

## Divergências intencionais

| Figma                                                     | Implementação                                                             | Motivo                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Cores do Linear (cinzas frios, accent `#5e6ad2`)          | Paleta quente, acento terracota mínimo                                    | ADR-0013                                                                       |
| Títulos de página em Inter 13 px medium                   | Figtree em tudo: `type-title` 27 px / 300, headings 22 / 19 / 16 px / 500 | ADR-0013 (escala modular 1,2; pesos 300–500)                                   |
| Modal com raio 21 px                                      | `rounded-surface` (12 px)                                                 | Decisão do responsável; 21 px fica registrado aqui                             |
| Trilho de tabs/segmented com raio 5                       | `rounded-xs` (4 px)                                                       | Quase-duplicado consolidado na escala                                          |
| Anéis brancos translúcidos em pills e cards               | Bordas hairline (`border-*`)                                              | Contenção: profundidade por superfície e hairline                              |
| Sombra "raised" em painel, cards e botões                 | Sem sombra                                                                | Sombra só em overlays                                                          |
| Sombra de dropdown em 3 camadas a 0,125 (`1:904`)         | 2 camadas (contato + ambiente), blur = 2 × y                              | Skill §9                                                                       |
| Ícones de linha próprios do Figma (navegação, ações)      | lucide-react com traço 1,5 (dependência já aprovada no Foundation)        | Biblioteca única; status e prioridade mantêm os SVG exatos (6:1543, 1:935)     |
| Ícones de 14 px (o tamanho mais usado)                    | Escala 12 · 16 · 20 · 24 · 32                                             | Pendente de decisão do responsável (ver relatório da fundação)                 |
| Controle de 44 px no login (`1:12621`)                    | `h-control-xl` (40 px)                                                    | Skill §6 (escala de alturas termina em 40); pendente de confirmação            |
| Linha do command menu de 34 px                            | 36 px (`h-command-item`)                                                  | Grid de 4 px (skill §1)                                                        |
| Kbd em 12 px Regular (`1:942`)                            | `text-kbd` 12 / 16, 400, JetBrains Mono                                   | Mono para teclas (ADR-0013)                                                    |
| Fonte Inter em todo o arquivo                             | Figtree (corpo, interface e títulos)                                      | Decisão do responsável (ADR-0013)                                              |
| Inputs sem borda nem fundo, padding 6 px (1:7563, 1:7571) | Campo com borda de controle e fundo, padding horizontal 8 px              | Skill §1 e §3: controle de formulário precisa de borda ≥ 3:1 e padding 8–12 px |
| Accent do Linear no toggle ligado e no checkbox marcado   | `bg-checked` (cor do texto primário)                                      | ADR-0013: controles ativos sem acento                                          |
| Quase-duplicados de tipografia, raio e espaçamento        | Um valor canônico (o mais usado)                                          | Ruído de captura                                                               |

## Sem design

Hover de linha e card, anel de foco, durações de transição e estado de erro de input não têm nó no Figma. Foram definidos pelo padrão do Linear e pela ADR-0013, com as regras da skill `vyzer-ui-design`; calibrar quando houver desenho.
