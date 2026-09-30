/**
 * Provedores de e-mail comuns, tratados como "Generic domains" sem precisar de linha na tabela
 * (spec `documents-customer-requests.md`, C1). Só alimenta o diálogo de leitura "List of generic
 * domains"; nenhum código de servidor lê a lista ainda (E4). A lista completa do Linear vive na
 * documentação dele e não foi copiada: esta cobre os provedores citados no texto da tela
 * ("Gmail, Outlook, etc.").
 */
export const GENERIC_DOMAINS = [
  "aol.com",
  "gmail.com",
  "gmx.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "yandex.com",
  "zoho.com",
] as const;
