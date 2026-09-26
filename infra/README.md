# Infra local

Modelo híbrido no Windows: Traefik, Postgres e Redis em Docker; o Vite roda nativo (`pnpm dev`) e o Traefik encaminha `vyzer.localhost` para ele via `host.docker.internal:3000`.

## Primeira vez

```bash
cp .env.example .env   # troque as senhas
docker compose up -d
pnpm dev
```

## Endereços

- App: http://vyzer.localhost
- Dashboard do Traefik: http://traefik.vyzer.localhost
- Postgres: `localhost:5432` · Redis: `localhost:6379` (só em 127.0.0.1)

Armazenamento de arquivos ainda não definido; será escolhido junto com a stack do backend.
