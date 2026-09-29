# Infra local

Modelo híbrido no Windows: Traefik, Postgres, Redis e RustFS em Docker; o Vite e a API rodam nativos (`pnpm dev`). O Traefik encaminha `vyzer.localhost/api/*` para a API (`host.docker.internal:3001`) e o resto para o Vite (`host.docker.internal:3000`).

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
- RustFS S3 API: `localhost:9000` · Console: `localhost:9001` (só em 127.0.0.1)

RustFS grava as logos de Workspace no volume Docker nomeado `rustfs_data`. As credenciais S3 locais e o endpoint/bucket da API ficam em `.env`; troque as chaves de acesso antes de expor o serviço à rede.
