# Spec: Fases 4, 5 e 6 do Design System — Feedback, dados e Command Menu

Issue: [VYZ-34](https://linear.app/zynox-dev/issue/VYZ-34/fases-4-5-e-6-feedback-dados-e-command-menu), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-34-fases-4-5-e-6-feedback-dados-e-command-menu`, a partir de `vyz-33-composer-de-criacao-new-issue-new-project-new-view`.

## Como usar o Figma nesta entrega

O Figma é **referência visual geral**, não medida nó a nó (decisão do responsável, 28/09):

- O que já existe no design system é reutilizado.
- O que não tem frame, o agente desenha a partir do visual já implementado: tokens, relevo, foco de campo, hover por camada, menus para baixo e traço de 2,5 px.
- Não se cria prop nova só para bater um pixel.
- Em `.figma/`, uma linha por componente, só quando a divergência for relevante.

Referências que existem hoje no arquivo `CNJik9Re3oAtqNma67yjou`:

| Área                     | Nós                                         |
| ------------------------ | ------------------------------------------- |
| Dialog                   | 1:3241, 1:3409 (New Project)                |
| Progress                 | 1:5161, 1:5137, 1:6391                      |
| Empty state              | 1:6091, 1:6250, 1:6294                      |
| Lista de issues e grupos | 1:7477 (Issues), 27:17223 (Inbox)           |
| Board                    | 1:8749, 1:10657                             |
| Tabela de projetos       | 25:4964                                     |
| Hover cards              | 25:6683 (milestones), 25:6786 (pessoa)      |
| Activity e timeline      | 25:4689 (Project Details), 27:17223 (Inbox) |
| Command Menu             | menu "/" 1:4653 (a mesma família)           |

## Escopo

Cada item com página em `/design-system`, no template único.

**Fase 4 · Feedback**

1. **Dialog:** Radix Dialog, com fundo escurecido, título, corpo e rodapé de ações.
2. **Confirm dialog:** Radix AlertDialog, com ação destrutiva e foco inicial no Cancel.
3. **Toast:** Radix Toast, com as variantes padrão, sucesso e erro, ação opcional e desfazer.
4. **Alert inline:** info, sucesso, aviso e erro, com ícone.
5. **Progress:** barra e anel (Radix Progress).
6. **Spinner.**
7. **Skeleton:** linha, bloco e avatar.
8. **Empty state:** ícone, título, texto e ação.

**Fase 5 · Data Display**

1. **List row de issue:** prioridade, ID, status, título, chips, avatar e data. Densidade padrão e compacta.
2. **Group header:** recolhível (Radix Collapsible), com contagem e botão de adicionar.
3. **Table:** cabeçalho, linhas e ordenação visual, como a lista de projetos.
4. **Card de board** e coluna de board.
5. **Tree:** linhas aninhadas de sub-issues, com expandir e recolher.
6. **Avatar group.**
7. **Counter.**
8. **Hover card:** Radix HoverCard, com os exemplos de pessoa e de milestones.
9. **Activity / timeline:** eventos com ícone, autor e tempo relativo.

**Fase 6 · Command Menu**

1. **⌘K:** cmdk dentro de Dialog, com busca, grupos, atalhos em Kbd, navegação por teclado e submenus (páginas do cmdk). Segue a família do menu "/".

## Fatia vertical

| Camada | O que entra                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | Nada                                                                                                                                                              |
| API    | Nada                                                                                                                                                              |
| Tela   | Componentes em `packages/design-system/src/components`, exports em `index.ts`, páginas em `apps/web/src/features/design-system/pages` e registro em `registry.ts` |

## Comportamento

- **Dialog e Confirm:** Esc fecha; clique no fundo fecha o Dialog, mas não o Confirm; o foco fica preso dentro e volta ao gatilho.
- **Toast:** anúncio para leitor de tela (Radix); pausa no hover; fecha por swipe e por Esc.
- **List row, Table e Tree:** navegáveis por teclado; seleção visual por camada; Tree com → e ← para expandir e recolher.
- **Hover card:** abre no hover com atraso e no foco.
- **⌘K:**
  - Ctrl/⌘+K abre;
  - digitar filtra, ↑ ↓ navegam e Enter executa;
  - Backspace com a busca vazia volta da página;
  - Esc fecha.

## Estados

Padrão, hover, foco (linha de campo), ativo/selecionado, desabilitado, vazio, carregando e erro, conforme o componente. Todos nos dois temas.

## Critérios de aceite

- [ ] Todos os itens acima implementados, com peças existentes sempre que possível.
- [ ] Só tokens semânticos; primitivos do `radix-ui` e `cmdk`; nenhuma dependência nova.
- [ ] Teclado completo e foco visível.
- [ ] Testes de interação (agente de testes separado) e axe nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Uma revisão em contexto limpo no fim, sem bloqueantes, e validação do responsável no navegador.

## Fora do escopo

- **Gráficos e visualização** (Fase 9), **AI e chat** (Fase 7), **App Shell** (Fase 8) e **Patterns** (Fase 10).
- **Drag and drop** no board: fica para quando a tela de board for construída.
- **Dados reais pela API.**
