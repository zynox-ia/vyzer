@AGENTS.md

## Específico do Claude Code

- Valores visuais: use as ferramentas do Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) no nó indicado pela spec.
- Revisão em contexto limpo: delegue ao subagente `figma-fidelity-reviewer` (`.claude/agents/`).
- Commits só com aprovação explícita do responsável.

## Agent skills

### Issue tracker

Issues no Linear (time `VYZ`), acessadas pelo MCP do Linear; specs continuam em `docs/specs/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Os cinco rótulos canônicos, com os nomes padrão. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` na raiz. See `docs/agents/domain.md`.
