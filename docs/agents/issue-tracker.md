# Issue tracker: Linear

As issues do Vyzer ficam no Linear, time `VYZ`. Agentes acessam pelo MCP do Linear.

## Convenções

- Uma feature = uma issue-pai no time `VYZ`. Tickets de implementação viram sub-issues dela.
- Specs NÃO ficam no Linear: continuam em `docs/specs/<feature>.md` (regra do `AGENTS.md`). A issue-pai linka para a spec.
- Triagem: aplicar os rótulos de `triage-labels.md` como labels do Linear.
- Comentários e conversa ficam na própria issue.

## Quando uma skill disser "publish to the issue tracker"

Criar a issue no time `VYZ` pelo MCP do Linear, com título e descrição em markdown. Se for ticket de uma feature, criar como sub-issue da issue-pai.

## Quando uma skill disser "fetch the relevant ticket"

Ler a issue pelo identificador (ex.: `VYZ-123`) que o usuário passar, pelo MCP do Linear.

## Se o MCP do Linear não estiver autenticado

Parar e pedir ao usuário que autorize via `/mcp`. Não criar issues em outro lugar como alternativa.
