# Spec: Preferences 100% persistida (o resto da tela, além do Customize sidebar)

## Link do Figma

Sem nó novo — mesma tela de `docs/specs/customize-sidebar-preferences.md` (Figma 33:20615).
Comportamento de cada campo é o que já existe hoje em `apps/web/src/features/settings/preferences.tsx`
e no Linear real; esta spec é só sobre tirar tudo de `useState`/`localStorage` e persistir de
verdade por Member, e aplicar o efeito de cada preferência onde fizer sentido.

## Escopo

Depois do Customize sidebar (já persistido), o resto da página de Preferences ainda tem três
níveis de "não terminado":

1. **Só `useState`** (perde ao recarregar): Display names, First day of the week, Convert text
   emoticons into emojis, Send comments on…, Font size (linha "Adjust the size of text across the
   app" — separada do "Font size" de dentro do card "Font"), Use pointer cursors, Underline links,
   Disable animated images & emoji, Open in desktop app, Auto-assign to self, On move to started
   status assign to yourself.
2. **`localStorage`** (`apps/web/src/features/settings/use-stored-preference.ts`): Default home
   view, Code theme, e os três campos do card "Font" (Font size, Line height, Custom font family).
3. **`localStorage` no design system** (`packages/design-system/src/lib/theme.ts`, linha 3: _"Guardada
   em localStorage por enquanto; depois vai para as preferências do usuário no banco"_ — o próprio
   código já previa esta migração): Interface theme.

Tudo isso passa a ser uma preferência real por Member, na API, igual ao padrão já criado para o
Customize sidebar (`sidebarPreferences.get/update`).

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banco  | Tabela nova `memberPreference`, uma linha por `memberId` (FK cascade), criada sob demanda (mesmo padrão de `memberSidebarPreference`). Colunas tipadas (não JSON solto — é o padrão já usado em `workspace`/`team` para configuração), uma por campo abaixo, cada uma com o default que a tela já usa hoje.                                                  |
| API    | `packages/contract` + `apps/api`: `memberPreferences.get` / `memberPreferences.update` (patch parcial, igual `sidebarPreferences.update`), seguindo o mesmo router novo (`createMemberPreferencesRouter`, registrado em `router.ts` do mesmo jeito que os outros dois).                                                                                      |
| Tela   | `preferences.tsx` troca todo `useState`/`useStoredPreference` por `useQuery`/`useMutation` em cima da API nova, com o mesmo padrão otimista + rollback + toast já usado em `customize-sidebar.tsx`. `theme.ts` do design system muda a fonte da verdade para a API, mantendo alguma forma de não "piscar" o tema errado no primeiro paint (ver nota abaixo). |

### Campos (nome sugerido, tipo, default — mesmos valores que já estão no código hoje)

| Campo                       | Tipo                                                                                                 | Default              |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| `defaultHomeView`           | enum (`agent`,`inbox`,`my-issues`,`reviews`,`all-issues`,`active-issues`,`current-cycle`,`projects`) | `agent`              |
| `displayNameFormat`         | enum (`full`,`first`)                                                                                | `full`               |
| `firstDayOfWeek`            | enum (`sunday`,`monday`)                                                                             | `sunday`             |
| `convertEmoticons`          | boolean                                                                                              | `true`               |
| `sendCommentsOn`            | enum (`enter`,`mod-enter`)                                                                           | `enter`              |
| `interfaceFontSize`         | enum (`small`,`default`,`large`)                                                                     | `default`            |
| `usePointerCursors`         | boolean                                                                                              | `false`              |
| `underlineLinks`            | boolean                                                                                              | `false`              |
| `disableAnimatedImages`     | boolean                                                                                              | `false`              |
| `interfaceTheme`            | enum (`system`,`light`,`dark`)                                                                       | `system`             |
| `codeTheme`                 | enum (ver `CODE_THEME_OPTIONS` em `code-themes.ts`)                                                  | `DEFAULT_CODE_THEME` |
| `codeFontSize`              | enum (`smaller`,`small`,`default`,`large`,`larger`)                                                  | `default`            |
| `codeLineHeight`            | enum (`compact`,`regular`,`relaxed`)                                                                 | `regular`            |
| `codeFontFamily`            | text                                                                                                 | `""`                 |
| `openInDesktopApp`          | boolean                                                                                              | `false`              |
| `autoAssignToSelf`          | boolean                                                                                              | `false`              |
| `autoAssignOnMoveToStarted` | boolean                                                                                              | `false`              |

## Comportamento

- Cada campo grava na hora que muda (sem botão "Salvar"), igual ao resto da página — otimista, com
  rollback e toast de erro em falha, igual `customize-sidebar.tsx`.
- **Interface theme**: hoje já funciona (aplica o tema de verdade), só muda a persistência. Cuidado
  para não piscar o tema errado no primeiro carregamento: ler o `defaultValue` de um cookie/atributo
  gravado no HTML no login (ou o que o time achar mais simples dentro do padrão já usado), com a API
  como fonte da verdade a partir do primeiro `fetch`. Se não houver um jeito limpo de evitar o
  flash sem inventar infra nova, perguntar antes de decidir sozinho.
- **Use pointer cursors** / **Underline links**: aplicar de verdade (não só guardar o valor) — um
  atributo/classe no elemento raiz do app que os estilos globais já possam responder, ou o que já
  existir de mecanismo parecido no design system.
- **Disable animated images & emoji**: aplicar onde o app já renderiza emoji/GIF, se for simples de
  achar; se não houver esse ponto de renderização ainda no Zynox, persistir o valor e marcar o
  efeito como fora do escopo por falta de o que desligar (não inventar um sistema de emoji/GIF só
  pra isso).
- **Open in desktop app**: **não há aplicativo desktop no Zynox hoje.** Persistir o valor normalmente,
  mas não implementar nenhum comportamento de "abrir no app" — não existe app pra abrir. Deixar
  registrado, não inventar.
- **Auto-assign to self**: ao criar uma issue sem assignee explícito, se ligado, atribuir ao Member
  atual. Ponto de entrada: fluxo de criação de issue (`apps/web/src/layouts/app-shell/create-issue-dialog.tsx`
  e/ou `createWorkspaceIssue` em `packages/db/src/issues.ts`).
- **On move to started status, assign to yourself**: ao mover uma issue sem assignee para um status
  de categoria `started` (`WorkflowStatusCategory`, `packages/db/src/schema.ts:226`), se ligado,
  atribuir ao Member que moveu. `packages/db/src/issues.ts` já rastreia `category`/`previousCategory`
  nas transições de status (linhas ~208-209, ~461) — esse é o ponto natural para pendurar a regra.
- **Font size (linha solta) / Code theme / Font (card)**: só troca a persistência; o efeito visual
  de cada um já existe (ou, no caso do "Font size" solto, ainda não existe nenhum — se não houver
  nenhum mecanismo de escala de fonte da interface no design system hoje, persistir o valor e
  perguntar antes de inventar um sistema de escala novo).

## Estados

- Carregando: skeleton, mesmo padrão de `customize-sidebar.tsx`.
- Erro ao carregar: `Alert` com "Retry", mesmo padrão.
- Erro ao gravar: rollback + toast, mesmo padrão.
- Padrão: os defaults da tabela acima (idênticos aos que já estão hardcoded na tela hoje, então
  ninguém percebe diferença visual no primeiro carregamento).

## Critérios de aceite

- [ ] Nenhum campo de Preferences usa `useState` solto ou `localStorage` para persistência (exceção:
      nenhuma — inclusive `theme.ts` do design system muda a fonte da verdade para a API).
- [ ] Todos os 16 campos acima persistem via `memberPreferences.get/update` e sobrevivem a um reload.
- [ ] Interface theme continua funcionando sem piscar no primeiro paint.
- [ ] Pointer cursors e Underline links têm efeito real observável.
- [ ] Auto-assign to self e Auto-assign on move to started têm efeito real (issue criada/movida sem
      assignee recebe o Member atual quando a preferência está ligada).
- [ ] Open in desktop app persiste, mas não finge um comportamento que não existe.
- [ ] Disable animated images & emoji: efeito real se houver onde aplicar; senão, documentado como
      persistido sem efeito, sem inventar infra de emoji/GIF.
- [ ] Só componentes/tokens já existentes; nenhuma prop nova sem aprovação.
- [ ] `pnpm check` e `pnpm build` sem avisos.

## Fora do escopo

- Qualquer sistema de escala de fonte da interface, se não existir um hoje — perguntar antes.
- Qualquer infra de emoji/GIF animado, se não existir hoje — perguntar antes.
- Aplicativo desktop — não existe, não é desta entrega.
- Novo token/variante de componente — parar e perguntar se faltar algo no design system.
