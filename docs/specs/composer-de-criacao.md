# Spec: Composer de criação (New Issue, New Project, New view)

Issue: [VYZ-33](https://linear.app/zynox-dev/issue/VYZ-33/composer-de-criacao-new-issue-new-project-new-view), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-33-composer-de-criacao-new-issue-new-project-new-view`, a partir de `vyz-31-fase-3-selecao-e-menus`: depende do Chip e do Popover da Fase 3, que ainda não foram mesclados.

## Link do Figma

[26:6859](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer?node-id=26-6859) "Issues -> New Issue". Aparece em uso no frame 1:7477, logo abaixo das abas de view.

Medidas do nó:

| Parte           | Figma                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cartão          | 1152 × 137, fundo #1a1a1b, borda #222325, raio 10, sombra de relevo curta                                                                                                             |
| Corpo           | padding 12, 6 entre as linhas                                                                                                                                                         |
| Linha do título | botão de ícone 28 × 28 (fundo translúcido, raio 4, ícone 16); campo do título com 24 de altura, padding 6, texto 15 px / 500 no placeholder (#5c5d5f); ações à direita com 6 entre si |
| Ações           | Cancel ghost (24, pílula, 12 px / 500) e primário "Create view" (24, pílula, accent do Linear #5e6ad2)                                                                                |
| Descrição       | alinhada ao título (recuo de 35), campo de 32 de altura, padding 6, 13 px Regular, placeholder "Description (optional)"                                                               |
| Rodapé          | hairline #2b2c2e no topo, padding 8 / 12; à direita, dois botões de ícone redondos de 28 (Filter e Display options) com relevo e ícone de 14                                          |

## Escopo

1. **Padrão de composição, não componente novo,** como o Composer de comentário (Forms → Composer, Figma 1:6363). É um cartão com:
   - cabeçalho: botão de ícone (Icon Picker existente) + título + ações;
   - descrição opcional alinhada ao título;
   - rodapé de ferramentas.
     Se faltar uma peça genérica no design system (por exemplo, o campo de título em tamanho maior, na variante `plain` do TextInput), ela entra no próprio componente de base, com uma prop, e não na página.
2. **Página em `/design-system`** (seção Forms, ao lado do Composer), no template único. Exemplos:
   - **New view:** exatamente o nó 26:6859, com Filter e Display options no rodapé, abrindo o Filter Menu e o Display Options já existentes.
   - **New issue** e **New project:** o mesmo cartão com o rótulo do botão primário trocado ("Create issue", "Create project"). O rodapé troca as ferramentas pelos Property Buttons já existentes (status, priority, lead).
3. **O chip "New view"** (rascunho, Fase 3) abre o composer no exemplo da página, como no frame 1:7477.

## Fatia vertical

| Camada | O que entra                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | Nada                                                                                                                                                          |
| API    | Nada                                                                                                                                                          |
| Tela   | Página do padrão em `apps/web/src/features/design-system/pages/forms`, registro em `registry.ts`. Ajustes pontuais nos componentes de base só se faltar peça. |

## Comportamento

- Ao abrir, o foco vai para o título. Tab percorre: título → descrição → ações → rodapé.
- **Enter** no título vai para a descrição. **⌘/Ctrl+Enter** confirma. **Esc** cancela e fecha, igual ao Cancel.
- O botão primário fica desabilitado com o título vazio.
- A descrição cresce com o texto (TextArea plain), sem barra até o limite.

## Estados

- **Padrão:** vazio, só com os placeholders.
- **Preenchido.**
- **Foco:** o cartão mostra a linha de foco de campo (`focus-ring-within`), sem halo e sem terracota.
- **Hover** dos botões.
- **Primário desabilitado.**
- **Dois temas.**

## Divergências esperadas (registrar em `.figma/`)

- **Botão primário:** o accent do Linear (#5e6ad2) vira o Button primário do Vyzer (ADR-0013).
- **Botões:** os de 24 px com padding 8 passam para o Button de tamanho único (28 px, padding 12), como no rodapé do Display Options.
- **Título:** 15 px vira o degrau da escala tipográfica mais próximo (decisão pela ADR-0013, registrada com a regra).
- **Raio do cartão:** 10 vira `rounded-container`. A borda e a hairline passam para os tokens semânticos.

## Critérios de aceite

- [ ] O exemplo New view bate com 26:6859, nos dois temas, com as divergências acima registradas.
- [ ] New issue e New project usam o mesmo padrão, só com peças existentes.
- [ ] Só tokens semânticos, nenhum valor fixo; Radix para os primitivos; nenhuma dependência nova.
- [ ] Teclado completo (foco inicial, Enter, ⌘/Ctrl+Enter, Esc) e foco visível.
- [ ] Testes de interação (agente de testes separado) e axe na página nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Revisão em contexto limpo sem bloqueantes e validação do responsável no navegador.

## Fora do escopo

- **Editor de texto rico** (negrito, menções, "/"): depende de uma dependência nova e de uma ADR.
- **Modal de New Project** atual (1:3241): continua como está. Só troca se o responsável pedir.
- **Telas novas** (Projects, detalhes do projeto): ficam nas fases 5, 8 e 10.
- **Criação real** de issue ou view pela API.
