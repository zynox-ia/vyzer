# Spec: Fase 3 do Design System — Seleção e menus

Issue: [VYZ-31](https://linear.app/zynox-dev/issue/VYZ-31/fase-3-selecao-e-menus), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-31-fase-3-selecao-e-menus`, a partir de `vyz-30-fase-2-base` (depende da Fase 2 ainda não mesclada).

## Link do Figma

Arquivo [Zynox](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Zynox), página `0:1`. Mapa completo por fase no artifact "Mapa do Figma por fase".

| Componente              | Nó                                                                                                                                                                                                                             | Situação                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Chip / Tag              | 1:6914 (chip de projeto na linha de issue), 1:6948 (chip de relação, com contagem), 1:8881 e 1:8888 (chips do board); chips de view "All projects" (ativo e inativo) e "New view" (rascunho tracejado) na tela Projects 1:4813 | Com desenho                                                           |
| Popover                 | Superfície já medida em 1:935 (raio 12, borda forte, sombra md)                                                                                                                                                                | Com desenho; reaproveitar `popoverSurface`                            |
| Toggle Group (múltiplo) | Chips de "Display properties" em 18:722 e 18:930                                                                                                                                                                               | Com desenho; hoje embutido no Display Options                         |
| Context Menu            | —                                                                                                                                                                                                                              | Sem desenho: segue o Linear e o visual do Menu (família dropdown)     |
| Tooltip                 | —                                                                                                                                                                                                                              | Sem desenho: segue o Linear; registrar em `.figma/` como "sem design" |

## Escopo

Os cinco componentes que faltam da Fase 3 do plano original. Segmented Control, Select, Combobox e Dropdown Menu já existem e não entram.

1. **Chip / Tag:** rótulo compacto de valor (projeto, label, relação, view). Variantes com ícone ou cor (ColorDot), contagem opcional, removível (botão de remover com nome acessível), estado ativo/inativo (chips de view) e rascunho tracejado. Não confundir com Badge (estado) nem com Property Button (abre seletor).
2. **Popover:** wrapper do Radix Popover com `popoverSurface`, para conteúdo livre (não lista). Portal opcional, alinhamento, abre para baixo como os menus (decisão do responsável), com respiro de 8 px até a borda.
3. **Toggle Group (múltiplo):** Radix ToggleGroup `type="multiple"` com o visual dos chips de Display properties. O Display Options passa a usar esse componente, sem mudança visual.
4. **Context Menu:** Radix ContextMenu com os mesmos estilos, itens, separadores, submenus e atalhos do Menu (reaproveitar peças de `menu.tsx`, sem duplicar).
5. **Tooltip:** Radix Tooltip com atraso pelo token `--tooltip-delay`, texto curto e atalho opcional em Kbd. Abre também por foco de teclado, não só por mouse.

Cada um com página em `/design-system` no template único (playground, showcase, estados, temas, anatomia, teclado, acessibilidade, uso e props, decisões com a regra de cada escolha).

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | Nada                                                                                                                                                                                                                       |
| API    | Nada                                                                                                                                                                                                                       |
| Tela   | Componentes em `packages/design-system/src/components`, exports em `index.ts`, páginas em `apps/web/src/features/design-system/pages` (seções Components, Navigation e Forms, conforme o caso) e registro em `registry.ts` |

## Comportamento

- **Chip:** removível por botão (Enter/Espaço) e por Backspace/Delete quando focado, se removível. Chip clicável é botão; chip só de leitura não recebe foco.
- **Popover:** Esc fecha e devolve o foco ao gatilho; clique fora fecha; foco vai para o primeiro elemento focável.
- **Toggle Group:** setas movem entre itens (roving focus do Radix), Espaço/Enter liga e desliga, `aria-pressed` em cada item.
- **Context Menu:** abre no clique direito e com Shift+F10 / tecla de menu no alvo focado; setas, Enter, Esc, submenus com → e ←.
- **Tooltip:** abre no hover depois do atraso e no foco de teclado sem atraso; Esc fecha; nunca contém conteúdo interativo.

## Estados

Padrão, hover, foco (linha de foco de campo, sem terracota e sem halo), pressionado/ligado, desabilitado; aberto e fechado para Popover, Context Menu e Tooltip. Chip: com cor, com ícone, com contagem, removível, ativo, inativo, rascunho.

## Critérios de aceite

- [ ] Os cinco componentes implementados só com tokens semânticos; primitivos interativos do `radix-ui`.
- [ ] Nenhum componente duplicado: Context Menu reusa as peças do Menu; Popover reusa `popoverSurface`; Display Options usa o novo Toggle Group sem mudança visual.
- [ ] Chip, Popover e Toggle Group batem com os nós do Figma acima; Context Menu e Tooltip seguem o Linear e estão em `.figma/01-design-tokens.md` como "sem design".
- [ ] Decisões já tomadas pelo responsável respeitadas: foco de campo, hover só no fundo, menus para baixo, traço de ícone 2,5 px, barra de rolagem fina.
- [ ] Páginas no template único, com a seção Decisões citando nó ou regra.
- [ ] Testes de interação (agente de testes separado) e axe em todas as páginas nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Revisão em contexto limpo (figma-fidelity-reviewer + revisão de código) sem bloqueantes, e validação do responsável no navegador.

## Fora do escopo

- Qualquer componente das fases 4 em diante (Dialog, Toast, Tag de status etc.).
- Mudar a API de Menu, Select, Combobox ou Segmented Control além do necessário para reaproveitar peças.
- Dependências novas.
