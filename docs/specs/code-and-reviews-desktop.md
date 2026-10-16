# Spec: Code & Reviews e Zynox Desktop

## Link do Figma

Sem design. A referência de comportamento é o Linear; o design system é a fonte da verdade. Divergências e nós recebidos serão registrados em `.figma/code-and-reviews-desktop.md`.

## Contrato de implementação

Antes de implementar qualquer fatia, leia o contrato durável em `C:\Users\Cliente\.traycer\epics\552209d3-55ae-4874-b5c6-20109ac1e02e\artifacts\code-reviews-desktop\contracts\index.md`. Ele define agregados, API, estados, segurança, feedback, Desktop, Coding Sessions e os testes mínimos; prevalece sobre esta visão de escopo.

## Escopo

Entregar paridade funcional de Code & Reviews com Linear: GitHub, GitLab.com e GitLab self-hosted público; reviews dentro das issues; automações por time; preferências pessoais; notificações; Coding Sessions para repositórios GitHub; e Zynox Desktop em Windows, macOS e Linux.

O Desktop é um cliente Electron completo: autenticação, protocolo seguro, instalação/atualização, notificações nativas, tray/background, abertura de links Zynox e lançamento seguro de ferramentas locais e scripts configurados pelo usuário.

## Fatia vertical

| Camada | O que entra |
| ------ | ----------- |
| Banco | Integrações, repositórios/projetos autorizados, mudanças/revisões, automações, preferências, dispositivos Desktop, sessões e auditoria. |
| API | OAuth/tokens/webhooks, leitura e escrita estritamente autorizada nos provedores, sincronização, ações de review, notificações, contrato do Desktop e Coding Sessions. |
| Tela | Configurações de workspace/conta/time, conexão guiada, issue com PR/MR e diff, Reviews, Desktop e feedback de estado. |
| Desktop | Electron seguro, instaladores para Windows/macOS/Linux, login, notificações, protocolo/deep links, ferramentas locais e scripts. |

## Comportamento

- GitHub usa GitHub App; GitLab usa token, URL opcional de instância self-hosted e webhook por grupo ou projeto.
- Apenas administradores gerenciam integrações, repositórios, habilitação global, ambientes e políticas de assinatura.
- Cada membro gerencia sua identidade conectada e preferências pessoais.
- Uma mudança persistida mostra pendência, confirma com toast de sucesso no rodapé ou falha com toast de erro e reversão otimista.
- Ações externas mostram início e resultado. Chevrons que somente abrem uma página, dropdown ou submenu não exibem toast: a mudança visível de contexto é sua confirmação.
- PRs/MRs são vinculados por branch, título, palavras mágicas e commits quando suportados pelo provedor. A issue mostra estado, checks/pipeline, reviewers, previews, diff e histórico.
- Automações mudam o status da issue por eventos de revisão e por regras de branch-base.
- O Desktop só executa ferramentas conhecidas ou scripts configurados localmente pelo usuário, após validar uma intenção autenticada. Nenhum comando cru vindo da web é executado.
- Coding Sessions ligadas a issue trabalham em ambiente isolado e abrem PR em rascunho; merge continua humano.

## Estados

- Integração: desconectada, conectando, aguardando autorização/webhook, sincronizando, ativa, com aviso, erro, desconectando.
- Mudança persistida: repouso, pendente, sucesso (toast), erro (toast e valor anterior restaurado).
- Review: rascunho, aberta, review solicitada, com alterações pedidas, aprovada, pronta para merge, merged, closed.
- Desktop: não instalado, download, autenticando, conectado, atualização disponível, incompatível, erro de protocolo.
- Ferramenta local: indisponível, não configurada, pronta, iniciando, iniciada, falhou.
- Coding Session: configurando, em execução, aguardando usuário, preparando PR, concluída, falhou, cancelada.

## Critérios de aceite

- [ ] GitHub e GitLab reais podem ser conectados, validados, sincronizados e desconectados por admin.
- [ ] GitLab aceita GitLab.com e uma instância self-hosted publicamente acessível.
- [ ] Toda mutação mostra feedback inequívoco de sucesso ou erro; nenhuma navegação simples finge persistência.
- [ ] PRs/MRs vinculados exibem dados e ações reais dentro da issue.
- [ ] Automações e notificações reagem a eventos reais dos provedores.
- [ ] Desktop funciona em Windows, macOS e Linux e nunca expõe execução arbitrária à página web.
- [ ] Ferramentas locais e scripts recebem contexto seguro e confirmam início/erro.
- [ ] `pnpm check`, `pnpm build` e testes relevantes passam antes de validação humana.

## Fora do escopo

- GitLab Coding Sessions, pois não faz parte da paridade atual com Linear.
- Merge automático de PR/MR ou execução de comandos arbitrários por conteúdo de issue.
- Mobile nativo.

## Aprovação

Esta spec registra o escopo solicitado e aguarda aprovação humana antes de qualquer implementação.
