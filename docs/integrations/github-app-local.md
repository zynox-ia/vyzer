# GitHub App no ambiente local

## Pré-requisitos

- Inicie os serviços locais com `pnpm dev` e confirme que `http://zynox.localhost/_health` está disponível.
- Configure no `.env` as variáveis `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_WEBHOOK_SECRET` e `GITHUB_APP_PRIVATE_KEY_PATH`. A chave privada deve permanecer em arquivo gitignored; não cole tokens ou chaves em logs, testes ou documentação.
- No GitHub App, configure `http://zynox.localhost/api/github/callback` como _User authorization callback URL_ e habilite a autorização OAuth durante a instalação. A instalação e a conexão de conta usam o mesmo callback.
- Assine os eventos `installation` e `pull_request` e mantenha a validação de assinatura de webhook habilitada.

## OAuth e instalação

1. Abra Settings → Connected accounts e conecte uma conta GitHub. A API inicia o fluxo em `/api/github/connect`, valida `state` e PKCE no callback e guarda somente o ID, login e avatar do usuário.
2. Para instalar o App na Workspace, use a ação de instalação como Admin. O fluxo começa em `/api/github/install`; o callback confere que a instalação pertence ao usuário que autorizou e ao App configurado antes de associá-la à Workspace.
3. A tela Code & reviews permite que um Admin ligue a vinculação de PRs. Atualizações do App no GitHub enviam os PRs ao webhook e uma branch contendo um identificador de issue, por exemplo `vyz-123-ajuste`, vincula o PR automaticamente.

## Webhook via túnel

O Traefik local recebe HTTP na porta 80 e encaminha `/api/*` à API. Para expor o ambiente temporariamente, inicie um túnel para a porta 80 (por exemplo, `ngrok http 80`) e configure no GitHub App a URL pública atual terminada em `/api/github/webhook`. Se o endereço do túnel mudar, atualize a URL do webhook.

- Faça um GET à URL pública do webhook: a resposta `{"status":"ok"}` confirma apenas o roteamento.
- Envie uma entrega de teste pelo GitHub App ou reenvie uma entrega na página de deliveries. Eventos POST sem assinatura HMAC válida são rejeitados; entregas de `pull_request` assinadas são processadas de forma idempotente.
- Um webhook pode chegar antes da instalação estar associada à Workspace. Nesse caso o evento é aceito sem criar PR; depois que a instalação estiver concluída, uma atualização ou reenvio do evento processará o PR.

O túnel deve ser usado apenas durante a validação local. Não compartilhe a URL temporária nem os valores das variáveis de ambiente.
