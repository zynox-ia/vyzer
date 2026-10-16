# Zynox

```bash
pnpm install
pnpm dev
```

Infra local (Traefik, Postgres, Redis): veja `infra/README.md`. Regras do projeto: `AGENTS.md`.

API keys authenticate requests that send `Authorization: Bearer vyz_…` and apply their
permissions to those requests. While authentication remains deferred (ADR-0015), requests without
an Authorization header still use the seeded Admin context; API key permissions therefore do not
protect the API from clients that omit the key.
