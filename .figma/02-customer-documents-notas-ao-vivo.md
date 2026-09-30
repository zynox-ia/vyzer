# Customer requests e Documents: notas do Linear ao vivo

Sem frame no Figma (MCP não autorizado nesta sessão). Referência: Linear ao vivo, workspace `zynox-dev`, 29/09. Spec: [`docs/specs/documents-customer-requests.md`](../docs/specs/documents-customer-requests.md). Customers foi observado numa janela autorizada (switch ligado, 1 customer e 1 request de teste, tudo revertido); Documents só tem o que o DOM mostrou, sem nenhum documento existente.

**Confirmado ao vivo (a spec previa por `[docs]`):**

- **Customers na sidebar:** aparece na seção Workspace, entre Views e More, só com o switch ligado. Desligado, `/customers` redireciona para `/agent`.
- **Cascata:** apagar um Customer avisa "This will also delete all associated customer requests" e a request some da Issue.
- **Criação de request:** menu "…" da Issue, item "Add customer request…" (`Ctrl Alt R`), logo depois de "Add link…". Formulário inline numa seção "Customers" da Issue; corpo pode ficar vazio.
- **Project → Overview:** seção "Customers" logo abaixo de Resources, com "Add customer request".

**Corrigido na spec depois da observação:**

- **Colunas da lista:** Name · Requests · Annual revenue · Size · Status · Tier · Owner. A versão inicial tinha Revenue/Size antes de Status e não tinha Requests.
- **URL do detalhe:** `/customer/<slug>-<id>` (singular). A spec passou de `/customers/:id` para `/customer/:customerId/:slug?`.
- **`requesterName` sai** do modelo: ao vivo só existem o corpo e o campo Source. "Added by" é o criador.
- **Detalhe do Customer mostra só Status** como propriedade; Tier, Revenue, Size e Owner não apareceram no corpo (podem estar só no "Edit…", não aberto).
- **Desligar o recurso pede confirmação:** "Disable customer requests for entire workspace?".
- **"Unknown customer"** no seletor de customer: opção para requests sem customer identificado. Construída como no Linear (spec E15, decisão do responsável): `customer_need.customerId` opcional e a opção disponível também na criação manual.

**Divergências de Documents já registradas:**

- **Documents não é tela de Workspace:** `/workspace/documents` devolve "Not found". Mora em Team (aba Documents), Project (Resources), Issue e Initiative.
- **Settings → Documents** tem só Templates (Workspace e Team).

**Não observado (não abriu por automação ou não exercitado):** marca de importância e menu "Open menu" da request; Add filter e Display options da lista de Customers e da aba Documents; diálogos "Edit…" e "Merge with…"; área de texto rico do formulário de request; o editor de Documents. **Dúvida:** receita e tamanho digitados no "Create customer" não apareceram nas colunas da lista; não confirmei se gravou.
