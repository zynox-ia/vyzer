@AGENTS.md

## Específico do Claude Code

- Valores visuais: use as ferramentas do Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) no nó indicado pela spec.
- Revisão em contexto limpo: delegue ao subagente `figma-fidelity-reviewer` (`.claude/agents/`).
- Commits só com aprovação explícita do responsável.
