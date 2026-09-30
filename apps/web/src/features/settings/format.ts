/** "Sep 26": data curta das tabelas de Settings (Joined, Created), como o Linear mostra. */
export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
