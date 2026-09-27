# Infra local

Modelo híbrido no Windows: Traefik, Postgres e Redis em Docker; o Vite e a API rodam nativos (`pnpm dev`). O Traefik encaminha `vyzer.localhost/api/*` para a API (`host.docker.internal:3001`) e o resto para o Vite (`host.docker.internal:3000`).

## Primeira vez

```bash
cp .env.example .env   # troque as senhas (e a do DATABASE_URL junto)
docker compose up -d
pnpm db:migrate
pnpm dev
```

## Endereços

- App: http://vyzer.localhost · API: http://vyzer.localhost/api · Diagnóstico: http://vyzer.localhost/_health
- Dashboard do Traefik: http://traefik.vyzer.localhost
- Postgres: `localhost:5432` · Redis: `localhost:6379` (só em 127.0.0.1)

Armazenamento de arquivos ainda não definido; será escolhido junto com a stack do backend.
